import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db/prisma";
import { PullRequestWebhookPayload, PingWebhookPayload, WebhookContext, ReviewableAction, REVIEWABLE_ACTIONS, SUPPORTED_EVENTS } from "@/types";
import { createOctokitClient } from "@/lib/github/octokit";
import { fetchPRData, getLanguageFromFilename } from "@/lib/github/pr-fetcher";
import { analyzePatterns } from "@/lib/analysis/pattern-matcher";
import { cleanLLMSuggestions, prepareLLMRequest } from "@/lib/ai/llm-helpers";
import { reviewWithLangChain } from "@/lib/ai/langchain";
import {
    calculateComplexityScore,
    deduplicateSuggestions,
    generateReviewSummary,
    prioritizeSuggestions
} from "@/lib/analysis/reviewer";
import { postReviewComment } from "@/lib/github/comment-poster";
import { SuggestionSeverity, SuggestionType } from "@/lib/generated/prisma/enums";
import { storeSuggestionEmbeddingsBatch } from "@/lib/vector/store";

/**
 * Verify Github webhook signature
 * @param payload 
 * @param signature 
 * @param secret 
 * @returns 
 */
const verifySignature = (
    payload: string,
    signature: string,
    secret: string
): boolean => {
    if (!signature || !secret) return false;

    try {
        const hmac = crypto.createHmac('sha256', secret);
        const digest = "sha256=" + hmac.update(payload).digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(digest)
        );
    } catch (error) {
        console.error('[Webhook] Signature verification error:', error);
        return false;
    }
};

/**
 * Parse webhook payload
 * @param payload 
 * @returns 
 */
const parsePayload = (payload: string): unknown => {
    if (payload.startsWith("payload=")) {
        const decoded = decodeURIComponent(payload.replace(/^payload=/, ""));
        return JSON.parse(decoded);
    }
    return JSON.parse(payload);
};

/**
 * Validate repository data
 * @param repoData 
 * @param repositoryId 
 */
const validateRepositoryData = (repoData: any, repositoryId: string) => {
    if (!repoData) {
        throw new Error(`Repository not found: ${repositoryId}`);
    }
    if (!repoData.webhookSecret) {
        throw new Error('Webhook secret not configured for repository');
    }
    if (!repoData.userId) {
        throw new Error('User ID not found for repository');
    }
};

/**
 * Handling incoming webhook request
 * @param req 
 * @returns 
 */
export async function POST(req: NextRequest) {
    const context: WebhookContext = {
        event: req.headers.get("x-github-event"),
        deliveryId: req.headers.get("x-github-delivery"),
        signature: req.headers.get("x-hub-signature-256") || "",
        payload: await req.text(),
    };

    console.log(`[Webhook] Received event: ${context.event}, delivery: ${context.deliveryId}`);

    try {
        // Parse payload early for repository ID
        const parsedPayload = parsePayload(context.payload);
        const result = parsedPayload as any;
        console.log({ parsedPayload })

        // Fetch repository data
        const repoData = await prisma.repository.findUnique({
            where: {
                repoId: result?.repository?.id?.toString()
            },
            select: {
                userId: true,
                repoId: true,
                webhookSecret: true,
            },
        });

        // Validate repository exists and has required data
        validateRepositoryData(repoData, result?.repository?.id);

        // Verify webhook signature
        const isValid = verifySignature(
            context.payload,
            context.signature,
            repoData!.webhookSecret as string
        );

        if (!isValid) {
            console.error('[Webhook] Invalid signature for delivery:', context.deliveryId);
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        // Route to appropriate handler
        switch (context.event) {
            case 'pull_request':
                return await handlePullRequestEvent(
                    parsedPayload as PullRequestWebhookPayload,
                    repoData!.userId as string
                );

            case 'ping':
                return handlePingEvent(parsedPayload as PingWebhookPayload);

            default:
                console.log(`[Webhook] Unhandled event type: ${context.event}`);
                return NextResponse.json({
                    message: 'Event received but not processed',
                    event: context.event
                });
        }
    } catch (error) {
        console.error('[Webhook] Error processing webhook:', error);

        // Return appropriate error message
        if (error instanceof SyntaxError) {
            return NextResponse.json(
                { error: 'Invalid JSON payload' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to process webhook', details: (error as Error).message },
            { status: 500 }
        );
    }
}

/**
 * Handle pull request event with pull request data
 * @param data 
 * @param userId 
 * @returns 
 */
const handlePullRequestEvent = async (
    data: PullRequestWebhookPayload,
    userId: string
) => {
    const { action, pull_request: pr, repository } = data;

    console.log(`[Webhook] PR #${pr.number} action: ${action}`);

    try {
        // Prepare PR data
        const prData = {
            prId: String(pr.id),
            nodeId: pr.node_id,
            title: pr.title,
            body: pr.body || '',
            author: pr.user.login,
            state: pr.state,
            url: pr.html_url,
            assignee: pr.assignee ?? null,
            assignees: pr.assignees,
            requestedReviewers: pr.requested_reviewers.map(r => r.login),
            comments: pr.comments,
            reviewComments: pr.review_comments,
            commits: pr.commits,
            additions: pr.additions,
            deletions: pr.deletions,
            changedFiles: pr.changed_files,
            updatedAtGithub: new Date(pr.updated_at),
            closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
            mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
        };

        // Upsert PR in database
        const pullRequest = await prisma.pullRequest.upsert({
            where: {
                repositoryId_prNumber: {
                    repositoryId: String(repository.id),
                    prNumber: pr.number,
                },
            },
            update: prData,
            create: {
                ...prData,
                prNumber: pr.number,
                createdAtGithub: new Date(pr.created_at),
                repositoryId: String(repository.id),
            },
        });

        console.log(`[Webhook] Upserted PR #${pr.number} (ID: ${pullRequest.id})`);

        // Trigger review for relevant actions
        if (REVIEWABLE_ACTIONS.includes(action as ReviewableAction)) {
            console.log(`[Webhook] Triggering review for PR #${pr.number}`);

            // Run asynchronously without blocking webhook response
            triggerReviewProcess(userId, repository, pr)
                .catch((error) => {
                    console.error(`[Webhook] Review process failed for PR #${pr.number}:`, error);
                });
        }

        return NextResponse.json({
            message: 'Webhook processed successfully',
            prId: pullRequest.id,
            action,
        });
    } catch (error) {
        console.error('[Webhook] Database error:', error);
        return NextResponse.json(
            { error: 'Failed to process pull request', details: (error as Error).message },
            { status: 500 }
        );
    }
};

/**
 * Handle specific webhook request data and process for github comment
 * @param userId 
 * @param repository 
 * @param pr 
 */
const triggerReviewProcess = async (
    userId: string,
    repository: any,
    pr: any,
) => {
    const startTime = Date.now();
    console.log(`[Reviewer] Starting review for PR #${pr.number}`);

    try {
        // Fetch user's GitHub access token
        const account = await prisma.account.findFirst({
            where: { userId },
            select: { access_token: true }
        });

        if (!account?.access_token) {
            throw new Error(`No access token found for user: ${userId}`);
        }

        // Initialize Octokit and fetch PR data
        const octokit = createOctokitClient(account.access_token);
        const prData = await fetchPRData(
            octokit,
            repository.owner.login,
            repository.name,
            pr.number
        );
        // Step 1: Run pattern analysis
        const patternResults = analyzePatterns(prData);
        // Step 2: LLM analysis
        const llmRequest = prepareLLMRequest(prData, patternResults.suggestions);
        const llmResults = await reviewWithLangChain(llmRequest);

        console.log(`[Reviewer] LLM suggestions received: ${llmResults.suggestions.length}`);
        // Step 3: Combine and process suggestions
        const allSuggestions = [
            ...patternResults.suggestions,
            ...llmResults.suggestions
        ];

        const uniqueSuggestions = deduplicateSuggestions(allSuggestions);
        const validSuggestions = cleanLLMSuggestions(uniqueSuggestions);
        const prioritizedSuggestions = prioritizeSuggestions(validSuggestions);
        console.log({ prioritizedSuggestions })
        console.log(`[Reviewer] Final suggestions: ${prioritizedSuggestions.length} (from ${allSuggestions.length} total)`);
        // Store embedding in vector database
        await storeSuggestionEmbeddingsBatch(
            userId,
            pr.number,
            pr.id.toString(),
            prioritizedSuggestions
        )
        // Step 4: Calculate metrics and generate summary
        const complexity = calculateComplexityScore(prData, prioritizedSuggestions);
        const summary = generateReviewSummary(prData, prioritizedSuggestions, complexity);

        // Step 5: Save review to database
        const savedReview = await prisma.review.create({
            data: {
                summary,
                complexityScore: complexity.score,
                totalSuggestions: prioritizedSuggestions.length,
                criticalIssues: complexity.criticalCount,
                pullRequestId: String(prData.id),
                suggestions: {
                    create: prioritizedSuggestions.map(s => ({
                        type: s.type as SuggestionType,
                        severity: s.severity as SuggestionSeverity,
                        title: s.title,
                        description: s.description,
                        filePath: s.filePath,
                        lineNumber: s.lineNumber,
                        lineEnd: s.lineEnd,
                        codeSnippet: s.codeSnippet,
                        suggestedCode: s.suggestedCode,
                    }))
                }
            },
        });

        console.log(`[Reviewer] Saved review (ID: ${savedReview.id})`);

        // Step 6: Post review to GitHub
        await postReviewComment(
            octokit,
            repository.owner.login,
            repository.name,
            pr.number,
            summary,
            prioritizedSuggestions,
            {
                updateExisting: true,
                maxInLineComments: 5,
            }
        );

        const duration = Date.now() - startTime;
        console.log(`[Reviewer] Completed review for PR #${pr.number} in ${duration}ms`);

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[Reviewer] Error in review process (${duration}ms):`, error);

        // Optionally: Store failed review attempt in database for debugging
        // or send notification to user about failed review

        throw error;
    }
};

/**
 * Check if webhook is working - test
 * @param data 
 * @returns 
 */
const handlePingEvent = (data: PingWebhookPayload) => {
    console.log('[Webhook] Ping event received');
    console.log(`[Webhook] Zen: ${data.zen}`);
    return NextResponse.json({
        message: 'Pong!',
        zen: data.zen
    });
};

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Webhook endpoint is running',
        timestamp: new Date().toISOString(),
        supportedEvents: SUPPORTED_EVENTS,
    });
}