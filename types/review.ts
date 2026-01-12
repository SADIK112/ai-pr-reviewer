export type SuggestionSeverity =
    | 'CRITICAL'
    | 'HIGH'
    | 'MEDIUM'
    | 'LOW'
    | 'INFO';
export type SuggestionType =
    | 'BUG'
    | 'SECURITY'
    | 'PERFORMANCE'
    | 'STYLE'
    | 'BEST_PRACTICE'
    | 'REFACTOR'
    | 'MAINTAINABILITY'
    | 'DOCUMENTATION';

export interface Suggestion {
    id?: string;
    type: SuggestionType;
    severity: SuggestionSeverity;
    title: string;
    description: string;
    filePath: string;
    lineNumber?: number;
    lineEnd?: number;
    codeSnippet?: string;
    suggestedCode?: string;
}

export interface PatternRule {
    name: string;
    description: string;
    pattern: RegExp;
    type: SuggestionType;
    severity: SuggestionSeverity;
    message: string;
    suggestion?: string;
    enabled: boolean;
    languages?: string[];
}

export interface PatternMatch {
    pattern: string;
    patternName: string;
    type: SuggestionType;
    severity: SuggestionSeverity;
    matches: Array<Match>;
}

export interface Match {
    filePath: string;
    lineNumber: number;
    matchedText: string;
    context: string;
}

// LLM Integration type
export interface LLMReviewRequest {
    files: Array<{
        path: string;
        language: string;
        additions: number;
        deletions: number;
        diff: string;
    }>;
    context: {
        prTitle: string;
        prDescription?: string;
        author: string;
        baseBranch: string;
        headBranch: string;
    };
    patternFindings?: Suggestion[];
    userPreferences?: {
        focusAreas: string[];
        reviewStyle: 'concise' | 'balanced' | 'detailed'
    };
}

export interface LLMReviewResponse {
    suggestions: Suggestion[];
    summary: string;
    confidence: number;
    tokensUsed: number;
    model: string;
}

export interface Review {
    prNumber: number;
    repository: string;
    summary: string;
    complexity: {
        score: number;
        estimatedReviewTime: number;
        priority: 'high' | 'medium' | 'low';
        criticalCount: number;
    };
    suggestions: Suggestion[];
    metadata: {
        patternMatchCount: number;
        llmSuggestionCount: number;
        totalSuggestions: number;
        executionTime: number;
        model: string;
    };
}