import type { PRData, LLMReviewRequest, Suggestion } from "@/types";
import { getLanguageFromFilename } from "../github/pr-fetcher";
import { formatDiff } from "../utils/diff-parser";

/**
 * Prepare PR data for LLM Review
 * @param prData
 * @param patternFindings
 * @returns LLMReviewRequest
 */
export const prepareLLMRequest = (
    prData: PRData,
    patternFindings?: Suggestion[]
): LLMReviewRequest => {
    const files = prData.files.map(file => {
        const parsedDiff = prData.parsedDiff.find(d => d.filename === file.filename);

        return {
            path: file.filename,
            language: getLanguageFromFilename(file.filename),
            additions: file.additions,
            deletions: file.deletions,
            diff: parsedDiff ? formatDiff(parsedDiff) : file.patch || '',
        }
    });

    return {
        files,
        context: {
            prTitle: prData.title,
            prDescription: prData.body || "",
            author: prData.author,
            baseBranch: prData.baseBranch,
            headBranch: prData.headBranch,
        },
        patternFindings: patternFindings || [],
        userPreferences: {
            focusAreas: ['bugs', 'security', 'performance'],
            reviewStyle: 'balanced'
        }
    };
}

/**
 * Estimate token count (rough approximation)
 * @param request
 * @returns number
 */
export const estimateTokens = (request: LLMReviewRequest): number => {
    let total = 0;
    // system prompt: ~300 tokens
    total += 300;
    // context: ~100 tokens
    total += 100;
    // Files summary: ~10 tokens per file
    total += request.files.length * 10;
    // Diffs: ~1 token per 4 characters (rough estimate)
    for (const file of request.files) {
        total += Math.ceil(file.diff.length / 4);
    }
    // Pattern findings: ~50 tokens per finding
    if (request.patternFindings) {
        total += request.patternFindings.length * 50;
    }

    return total;
}

/**
 * Split Large PR into chunks for multiple requests
 * @param request
 * @param maxTokens
 * @return LLMReviewRequest[]
 */
export const splitLargeRequest = (
    request: LLMReviewRequest,
    maxTokens: number = 8000
): LLMReviewRequest[] => {
    const estimatedTokens = estimateTokens(request);
    // if under limit, return as single request
    if (estimatedTokens < maxTokens * 0.8) {
        return [request];
    }
    // split into chunks
    const chunks: LLMReviewRequest[] = [];
    const filesPerChunk = Math.ceil(request.files.length / Math.ceil(estimatedTokens / (maxTokens * 0.8)));
    for (let i = 0; i < request.files.length; i += filesPerChunk) {
        const chunkFiles = request.files.slice(i, i + filesPerChunk);
        chunks.push({
            ...request,
            files: chunkFiles
        })
    }
    console.log(`[LLM] Splitting large PR into ${chunks.length} chunks`);
    return chunks;
}

/**
 * Validate LLM suggestion
 * @param suggestion
 * @returns boolean
 */
export const validateSuggestion = (suggestion: Suggestion): boolean => {
    // check required fields
    if (!suggestion.title || !suggestion.type || !suggestion.severity) {
        return false;
    };
    // check valid types
    const validTypes = ['BUG', 'SECURITY', 'PERFORMANCE', 'STYLE', 'BEST_PRACTICE', 'MAINTAINABILITY', 'DOCUMENTATION'];
    if (!validTypes.includes(suggestion.type)) {
        return false;
    }
    // check valid severities
    const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'INFO'];
    if (!validSeverities.includes(suggestion.severity)) {
        return false;
    }
    // check has description and file path
    if (!suggestion.description || !suggestion.filePath) {
        return false;
    }

    return true;
}

/**
 * Filter and clean LLM suggestions
 * @param suggestions
 * @returns suggestions
 */
export const cleanLLMSuggestions = (suggestions: Suggestion[]): Suggestion[] => {
    return suggestions.filter(validateSuggestion).map(s => ({
        type: s.type,
        severity: s.severity,
        title: s.title,
        description: s.description,
        filePath: s.filePath,
        lineNumber: s.lineNumber || 1,
        lineEnd: s.lineEnd,
        codeSnippet: s.codeSnippet || '',
        suggestedCode: s.suggestedCode || '',
    }))
}

/**
 * Calculate review priority score
 * @param prData
 * @param patternFindings
 * @returns string
 */
export const calculatePriority = (
    prData: PRData,
    patternFindings?: Suggestion[]
): 'high' | 'medium' | 'low' => {
    // High priority if:
    // - Has critical/high pattern findings
    // - Many files changed
    // - Large number of changes
    const criticalCount = patternFindings?.filter(f => f.severity === 'CRITICAL').length || 0;
    const highCount = patternFindings?.filter(f => f.severity === 'HIGH').length || 0;

    if (criticalCount > 0 || highCount > 2) {
        return 'high';
    }
    if (prData.changedFiles > 20 || prData.additions + prData.deletions > 1000) {
        return 'high';
    }
    if (prData.changedFiles > 10 || prData.additions + prData.deletions > 500) {
        return 'medium';
    }

    return 'low';
}