import type { PRData, Suggestion, Review } from "@/types";
import { calculatePriority } from "../ai/llm-helpers";

/**
 * Remove duplicate suggestions based on file + line number + type
 * @param suggestions
 * @returns suggestion
 */
export function deduplicateSuggestions(suggestions: Suggestion[]): Suggestion[] {
    const seen = new Set<string>();
    const unique: Suggestion[] = [];

    for (const suggestion of suggestions) {
        // Create unique key: file path + line number + type + severity
        const key = `${suggestion.filePath}:${suggestion.lineNumber}:${suggestion.type}`;

        if (!seen.has(key)) {
            seen.add(key);
            unique.push(suggestion);
        } else {
            // If duplicate exists, keep the one with higher severity
            const existingIndex = unique.findIndex(
                s => `${s.filePath}:${s.lineNumber}:${s.type}` === key
            );

            if (existingIndex !== -1) {
                const existing = unique[existingIndex];
                if (getSeverityWeight(suggestion.severity) > getSeverityWeight(existing.severity)) {
                    unique[existingIndex] = suggestion;
                }
            }
        }
    }

    console.log(`[Reviewer] Deduplicated ${suggestions.length} → ${unique.length} suggestions`);
    return unique;
}

/**
 * Prioritize suggestions by severity
 * @param suggestions
 * @returns suggestions
 */
export function prioritizeSuggestions(suggestions: Suggestion[]): Array<Suggestion> {
    return suggestions.sort((a, b) => {
        // First sort by severity
        const severityDiff = getSeverityWeight(b.severity) - getSeverityWeight(a.severity);
        if (severityDiff !== 0) return severityDiff;

        // Then by type (security > bugs > performance > style)
        const typeDiff = getTypeWeight(b.type) - getTypeWeight(a.type);
        if (typeDiff !== 0) return typeDiff;

        // Finally by file path (alphabetical)
        return a.filePath.localeCompare(b.filePath);
    });
}

/**
 * Get numeric weight for severity
 * @param severity -> string
 * @returns string
 */
function getSeverityWeight(severity: string): number {
    const weights: Record<string, number> = {
        'CRITICAL': 5,
        'HIGH': 4,
        'MEDIUM': 3,
        'LOW': 2,
        'INFO': 1,
    };
    return weights[severity] || 0;
}

/**
 * Get numeric weight for type (higher = more important)
 * @param type -> string
 * @returns number
 */
function getTypeWeight(type: string): number {
    const weights: Record<string, number> = {
        'SECURITY': 7,
        'BUG': 6,
        'PERFORMANCE': 5,
        'MAINTAINABILITY': 4,
        'BEST_PRACTICE': 3,
        'STYLE': 2,
        'DOCUMENTATION': 1,
    };
    return weights[type] || 0;
}

/**
 * Calculate complexity score and metrics
 * @param prData
 * @param suggestions
 * @returns complexity
 */
export function calculateComplexityScore(
    prData: PRData,
    suggestions: Suggestion[]
): Review['complexity'] {
    // Base complexity from code changes
    const linesChanged = prData.additions + prData.deletions;
    const filesChanged = prData.changedFiles;

    // Complexity from suggestions
    const criticalCount = suggestions.filter(s => s.severity === 'CRITICAL').length;
    const highCount = suggestions.filter(s => s.severity === 'HIGH').length;

    // Calculate score (0-10 scale)
    let score = 0;
    score += Math.min(linesChanged / 100, 3); // Max 3 points for lines
    score += Math.min(filesChanged / 5, 2); // Max 2 points for files
    score += criticalCount * 1.5; // 1.5 points per critical issue
    score += highCount * 0.5; // 0.5 points per high issue

    // Cap at 10
    score = Math.min(score, 10);

    // Estimate review time (5-60 minutes)
    const estimatedReviewTime = Math.max(5, Math.min(Math.ceil(score * 6), 60));

    // Determine priority
    const priority = calculatePriority(prData, suggestions);

    return {
        score: Math.round(score * 10) / 10, // Round to 1 decimal
        estimatedReviewTime,
        priority,
        criticalCount
    };
}

/**
 * Generate human-readable review summary
 * @param prData
 * @param suggestions
 * @param complexity
 * @returns string
 */
export function generateReviewSummary(
    prData: PRData,
    suggestions: Suggestion[],
    complexity: Review['complexity']
): string {
    const criticalCount = suggestions.filter(s => s.severity === 'CRITICAL').length;
    const highCount = suggestions.filter(s => s.severity === 'HIGH').length;
    const mediumCount = suggestions.filter(s => s.severity === 'MEDIUM').length;
    const lowCount = suggestions.filter(s => s.severity === 'LOW').length;

    let summary = `Reviewed PR #${prData.number}: "${prData.title}"\n\n`;

    // Complexity assessment
    summary += `**Complexity:** ${complexity.score}/10 (${complexity.priority} priority)\n`;
    summary += `**Estimated Review Time:** ${complexity.estimatedReviewTime} minutes\n\n`;

    // Changes overview
    summary += `**Changes:** ${prData.changedFiles} files, +${prData.additions}/-${prData.deletions} lines\n\n`;

    // Findings summary
    if (suggestions.length === 0) {
        summary += `✅ No issues found. Code looks good!`;
    } else {
        summary += `**Findings:**\n`;
        if (criticalCount > 0) summary += `- 🔴 ${criticalCount} Critical issue${criticalCount > 1 ? 's' : ''}\n`;
        if (highCount > 0) summary += `- 🟠 ${highCount} High priority issue${highCount > 1 ? 's' : ''}\n`;
        if (mediumCount > 0) summary += `- 🟡 ${mediumCount} Medium issue${mediumCount > 1 ? 's' : ''}\n`;
        if (lowCount > 0) summary += `- 🟢 ${lowCount} Low priority suggestion${lowCount > 1 ? 's' : ''}\n`;
    }

    return summary;
}

/**
 * Group suggestions by file for structured comments
 * @param suggestions
 * @returns Map<string, suggestions>
 */
export function groupSuggestionsByFile(suggestions: Suggestion[]): Map<string, Suggestion[]> {
    const grouped = new Map<string, Suggestion[]>();

    for (const suggestion of suggestions) {
        const existing = grouped.get(suggestion.filePath) || [];
        existing.push(suggestion);
        grouped.set(suggestion.filePath, existing);
    }

    return grouped;
}

/**
 * Format suggestions for GitHub comment
 * @param result -> Review
 * @returns string
 */
export function formatForGitHubComment(result: Review): string {
    let comment = `## 🤖 AI Code Review\n\n`;
    comment += result.summary + '\n\n';

    if (result.suggestions.length === 0) {
        return comment;
    }

    comment += `---\n\n`;

    // Group by file
    const byFile = groupSuggestionsByFile(result.suggestions);

    for (const [filePath, suggestions] of byFile) {
        comment += `### 📄 \`${filePath}\`\n\n`;

        for (const suggestion of suggestions) {
            const icon = getSeverityIcon(suggestion.severity);
            comment += `#### ${icon} ${suggestion.title}\n`;
            comment += `**Type:** ${suggestion.type} | **Severity:** ${suggestion.severity}\n`;

            if (suggestion.lineNumber) {
                comment += `**Line:** ${suggestion.lineNumber}`;
                if (suggestion.lineEnd && suggestion.lineEnd !== suggestion.lineNumber) {
                    comment += `-${suggestion.lineEnd}`;
                }
                comment += '\n';
            }

            comment += `\n${suggestion.description}\n`;

            if (suggestion.codeSnippet) {
                comment += `\n**Current code:**\n\`\`\`\n${suggestion.codeSnippet}\n\`\`\`\n`;
            }

            if (suggestion.suggestedCode) {
                comment += `\n**Suggested fix:**\n\`\`\`\n${suggestion.suggestedCode}\n\`\`\`\n`;
            }

            comment += '\n---\n\n';
        }
    }

    return comment;
}

/**
 * Get emoji icon for severity
 * @param severity -> string
 * @returns string
 */
function getSeverityIcon(severity: string): string {
    const icons: Record<string, string> = {
        'CRITICAL': '🔴',
        'HIGH': '🟠',
        'MEDIUM': '🟡',
        'LOW': '🟢',
        'INFO': 'ℹ️',
    };
    return icons[severity] || '•';
}