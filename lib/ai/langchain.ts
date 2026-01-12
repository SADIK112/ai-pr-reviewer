import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { z } from 'zod';
import type { LLMReviewRequest, LLMReviewResponse, Suggestion } from '@/types';
import { buildSystemPrompt, buildUserPrompt } from './prompts';
import { getllmConfig } from './client';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { ChatGroq } from "@langchain/groq";

/**
 * Define output schema using Zod (same as before)
 */
const suggestionSchema = z.object({
    type: z.enum(['BUG', 'SECURITY', 'PERFORMANCE', 'STYLE', 'BEST_PRACTICE', 'MAINTAINABILITY', 'DOCUMENTATION']),
    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
    title: z.string().describe('Brief title for the issue'),
    description: z.string().describe('Detailed explanation of the issue'),
    filePath: z.string().describe('Path to the file with the issue'),
    lineNumber: z.number().optional().describe('Line number where issue occurs'),
    lineEnd: z.number().optional().describe('End line number for multi-line issues'),
    codeSnippet: z.string().optional().describe('The problematic code'),
    suggestedCode: z.string().optional().describe('Fixed version of the code'),
});

const reviewOutputSchema = z.object({
    summary: z.string().describe('Brief overall assessment of the PR'),
    confidence: z.number().min(0).max(1).describe('Confidence score between 0 and 1'),
    suggestions: z.array(suggestionSchema).describe('List of code review suggestions'),
});

type ReviewOutput = z.infer<typeof reviewOutputSchema>;

export function createReviewChain() {
    const config = getllmConfig();

    const model = new ChatGroq({
        model: config.model,
        maxTokens: config.tokens,
        temperature: config.temperature,
        apiKey: config.apiKey
    })
    // Create parser with format instructions
    const parser = StructuredOutputParser.fromZodSchema(reviewOutputSchema);

    return { model, parser, config };
}

export async function executeLangChainReview(
    request: LLMReviewRequest
): Promise<LLMReviewResponse> {
    try {
        const { model, parser, config } = createReviewChain();

        const systemPrompt = buildSystemPrompt(request);
        const userPrompt = buildUserPrompt(request);

        const promptTemplate = ChatPromptTemplate.fromMessages([
            ["system", "{systemPrompt}"],
            ["human", "{userPrompt}"],
            ["human", "{formatInstructions}"],
        ]);

        console.log("[LangChain OpenAI] Executing review chain...");

        const chain = RunnableSequence.from([
            promptTemplate,
            model,
            parser,
        ]);

        const result: ReviewOutput = await chain.invoke({
            systemPrompt,
            userPrompt,
            formatInstructions: parser.getFormatInstructions(),
        });

        return {
            suggestions: result.suggestions as Suggestion[],
            summary: result.summary,
            confidence: result.confidence,
            tokensUsed: 0,
            model: config.model,
        };
    } catch (error: any) {
        console.error("[LangChain OpenAI] Review failed:", error);

        if (error?.status === 429) {
            throw new Error("Rate limit exceeded. Please try again later.");
        }

        if (error?.status === 401) {
            throw new Error("Invalid OpenAI API key.");
        }

        if (error?.name === "OutputParserException") {
            throw new Error(
                "Failed to parse model output as JSON. Reduce temperature or chunk input."
            );
        }

        throw new Error(`OpenAI review error: ${error.message}`);
    }
}

/**
 * Review with retry logic (unchanged logic, just updated internals)
 */
export async function reviewWithLangChain(
    request: LLMReviewRequest,
    maxRetries = 3
): Promise<LLMReviewResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[LangChain HF] Attempt ${attempt}/${maxRetries}`);
            return await executeLangChainReview(request);
        } catch (error: any) {
            lastError = error;

            // Non-retryable errors
            if (error.message.includes('Invalid API key') ||
                error.message.includes('authentication')) {
                throw error;
            }

            // Exponential backoff before retry
            if (attempt < maxRetries) {
                const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
                console.log(`[LangChain HF] Retrying in ${delayMs / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }

    throw lastError || new Error('Review failed after maximum retries');
}