import { Suggestion } from "@/types";
import { Octokit } from "@octokit/rest";

/**
 * Post a complete review to GitHub PR
 */
export const postReviewComment = async (
    octokit: Octokit,
    owner: string,
    repo: string,
    prNumber: number,
    summary: string,
    suggestions: Suggestion[],
    options?: {
        updateExisting?: boolean;
        maxInLineComments?: number;
    }
): Promise<void> => {
    try {
        console.log(`[GitHub] Posting review to PR #${prNumber}...`);
        let existingCommentId: number | null = null;

        if (options?.updateExisting) {
            existingCommentId = await findExistingReviewComment(octokit, owner, repo, prNumber);
        }
        // Format the main review comment
        const commentBody = formatMainReviewComment(summary, suggestions);
        // Post or update the main review comment
        if (existingCommentId) {
            await octokit.issues.updateComment({
                owner,
                repo,
                comment_id: existingCommentId,
                body: commentBody,
            });
            console.log(`[GitHub] Updated existing review comment (ID: ${existingCommentId})`);
        } else {
            await octokit.issues.createComment({
                owner,
                repo,
                issue_number: prNumber,
                body: commentBody,
            });
            console.log(`[GitHub] Posted new review comment to PR #${prNumber}`);
        }

        // Post inline comments for critical/high severity issue
        const maxInline = options?.maxInLineComments || 10;
        await postInlineComments(
            octokit,
            owner,
            repo,
            prNumber,
            suggestions,
            maxInline
        );
    } catch (error: any) {
        console.error(`[GitHub] Failed to post review comment:`, error);
        throw new Error(`Failed to post review: ${error.message}`);
    }
}

/**
 * Find existing AI review comment (for updates)
 */
const findExistingReviewComment = async (
    octokit: Octokit,
    owner: string,
    repo: string,
    prNumber: number
): Promise<number | null> => {
    try {
        const { data: comments } = await octokit.issues.listComments({
            owner,
            repo,
            issue_number: prNumber,
            per_page: 100,
        });

        // Find comment that starts with our AI review marker
        const existingComment = comments.find(comment =>
            comment.body?.startsWith('## 🤖 AI Code Review')
        );

        return existingComment?.id || null;
    } catch (error) {
        console.error('[GitHub] Error finding existing comment:', error);
        return null;
    }
}

/**
 * Format main review comment with summary and all findings
 */
const formatMainReviewComment = (
    summary: string,
    suggestions: Suggestion[]
): string => {
    let comment = `## 🤖 AI Code Review\n\n`;

    // Add the generated summary
    comment += summary + '\n\n';

    if (suggestions.length === 0) {
        return comment;
    }

    comment += `---\n\n`;
    comment += `## 📋 Detailed Findings\n\n`;

    // Group suggestions by file
    const groupedByFile = groupSuggestionsByFile(suggestions);

    // Format each file's suggestions
    for (const [filePath, fileSuggestions] of groupedByFile) {
        comment += formatFileSection(filePath, fileSuggestions);
    }

    // Add footer with helpful info
    comment += `\n---\n\n`;
    comment += `<sub>💡 **Tip:** Click on line numbers to see inline comments for critical issues</sub>\n`;
    comment += `<sub>🔄 This review will be updated automatically when you push new commits</sub>`;

    return comment;
}

/**
 * Format a file section with its suggestions
 */
const formatFileSection = (
    filePath: string,
    suggestions: Suggestion[]
): string => {
    let section = `## \`${filePath}\`\n\n`;

    for (const suggestion of suggestions) {
        section += formatSuggestion(suggestion);
    }

    return section;
}

/**
 * Format a single suggestion
 */
const formatSuggestion = (suggestion: Suggestion): string => {
    const icon = getSeverityIcon(suggestion.severity);
    const severityColor = getSeverityColor(suggestion.severity);
    const language = getLanguageFromPath(suggestion.filePath);

    let formatted = `#### ${icon} ${suggestion.title}\n\n`;

    // Metadata line with badges
    formatted += `<sub>`;
    formatted += `<strong>${suggestion.type}</strong> • `;
    formatted += `<span style="color: ${severityColor}"><strong>${suggestion.severity}</strong></span>`;

    if (suggestion.lineNumber) {
        formatted += ` • Line ${suggestion.lineNumber}`;
        if (suggestion.lineEnd && suggestion.lineEnd !== suggestion.lineNumber) {
            formatted += `-${suggestion.lineEnd}`;
        }
    }
    formatted += `</sub>\n\n`;

    // Description
    formatted += `${suggestion.description}\n\n`;

    // Code snippets with language-specific syntax highlighting
    if (suggestion.codeSnippet) {
        formatted += `**Current code:**\n`;
        formatted += `\`\`\`${language}\n${formatCode(suggestion.codeSnippet)}\n\`\`\`\n\n`;
    }

    if (suggestion.suggestedCode) {
        formatted += `**Suggested fix:**\n`;
        formatted += `\`\`\`${language}\n${formatCode(suggestion.suggestedCode)}\n\`\`\`\n\n`;
    }

    formatted += `<details>\n`;
    formatted += `<summary>💬 Feedback</summary>\n\n`;
    formatted += `Was this helpful? React with 👍 or 👎\n`;
    formatted += `</details>\n\n`;

    return formatted;
}

/**
 * Post inline comments on specific lines for high-priority issues
 */
const postInlineComments = async (
    octokit: Octokit,
    owner: string,
    repo: string,
    prNumber: number,
    suggestions: Suggestion[],
    maxComments: number
): Promise<void> => {
    const inlineTargets = suggestions
        .filter(s =>
            (s.severity === 'CRITICAL' || s.severity === 'HIGH') &&
            s.lineNumber !== undefined
        )
        .slice(0, maxComments); // Limit to prevent spam

    console.log(`[GitHub] Posting ${inlineTargets.length} inline comments...`);

    // Get PR commits to find the latest commit SHA
    const { data: commits } = await octokit.pulls.listCommits({
        owner,
        repo,
        pull_number: prNumber,
    });

    const latestCommit = commits[commits.length - 1];
    if (!latestCommit) {
        console.warn('[GitHub] No commits found, skipping inline comments');
        return;
    }

    // Post inline comments
    for (const suggestion of inlineTargets) {
        try {
            await octokit.pulls.createReviewComment({
                owner,
                repo,
                pull_number: prNumber,
                body: formatInlineComment(suggestion),
                commit_id: latestCommit.sha,
                path: suggestion.filePath,
                line: suggestion.lineNumber!,
                side: 'RIGHT', // Comment on the new version
            });

            console.log(`[GitHub] Posted inline comment on ${suggestion.filePath}:${suggestion.lineNumber}`);
        } catch (error: any) {
            // Inline comments can fail if line doesn't exist in diff
            console.warn(`[GitHub] Failed to post inline comment:`, error.message);
            // Continue with other comments
        }
    }
}

/**
 * Format inline comment for a specific line
 */
const formatInlineComment = (suggestion: Suggestion): string => {
    const icon = getSeverityIcon(suggestion.severity);

    let comment = `${icon} **${suggestion.title}**\n\n`;
    comment += `**${suggestion.type}** | **${suggestion.severity}**\n\n`;
    comment += `${suggestion.description}\n`;

    if (suggestion.suggestedCode) {
        comment += `\n**Suggested fix:**\n`;
        // Use GitHub's suggestion syntax - this allows users to commit the suggestion directly
        comment += `\`\`\`suggestion\n${formatCode(suggestion.suggestedCode)}\n\`\`\``;
    }

    return comment;
}

/**
 * Group suggestions by file path
 */
const groupSuggestionsByFile = (
    suggestions: Suggestion[]
): Map<string, Suggestion[]> => {
    const grouped = new Map<string, Suggestion[]>();

    for (const suggestion of suggestions) {
        const existing = grouped.get(suggestion.filePath) || [];
        existing.push(suggestion);
        grouped.set(suggestion.filePath, existing);
    }

    return grouped;
}

/**
 * Get emoji icon for severity level
 */
const getSeverityIcon = (severity: string): string => {
    const icons: Record<string, string> = {
        'CRITICAL': '🔴',
        'HIGH': '🟠',
        'MEDIUM': '🟡',
        'LOW': '🟢',
        'INFO': 'ℹ️',
    };
    return icons[severity] || '•';
}

/**
 * Get color for severity level
 */
const getSeverityColor = (severity: string): string => {
    const colors: Record<string, string> = {
        'CRITICAL': '#dc2626', // red-600
        'HIGH': '#ea580c',     // orange-600
        'MEDIUM': '#ca8a04',   // yellow-600
        'LOW': '#16a34a',      // green-600
        'INFO': '#2563eb',     // blue-600
    };
    return colors[severity] || '#6b7280'; // gray-500
}

/**
 * Post a simple status comment (for errors or completion)
 */
export const postStatusComment = async (
    octokit: Octokit,
    owner: string,
    repo: string,
    prNumber: number,
    status: 'success' | 'error' | 'analyzing',
    message?: string
): Promise<void> => {
    const icons = {
        success: '✅',
        error: '❌',
        analyzing: '🔄',
    };

    const icon = icons[status];
    const body = `${icon} **AI Code Review ${status === 'analyzing' ? 'in progress' : status}**\n\n${message || ''}`;

    try {
        await octokit.issues.createComment({
            owner,
            repo,
            issue_number: prNumber,
            body,
        });
    } catch (error) {
        console.error(`[GitHub] Failed to post status comment:`, error);
    }
}

/**
 * Create a GitHub review (approve/request changes/comment)
 */
export const createReview = async (
    octokit: Octokit,
    owner: string,
    repo: string,
    prNumber: number,
    event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT',
    body: string,
    comments?: Array<{
        path: string;
        line: number;
        body: string;
    }>
): Promise<void> => {
    try {
        await octokit.pulls.createReview({
            owner,
            repo,
            pull_number: prNumber,
            event,
            body,
            comments,
        });

        console.log(`[GitHub] Created review with event: ${event}`);
    } catch (error: any) {
        console.error(`[GitHub] Failed to create review:`, error);
        throw new Error(`Failed to create review: ${error.message}`);
    }
}

/**
 * Format code by preserving proper indentation and line breaks
 * Cleans up unnecessary whitespace while maintaining structure
 */
const formatCode = (code: string): string => {
    if (!code) return '';
    // Split into lines
    const lines = code.split(/\\n|\n/);
    // Remove empty lines at start and end
    while (lines.length > 0 && lines[0].trim() === '') {
        lines.shift();
    }
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
        lines.pop();
    }

    if (lines.length === 0) return code.trim();

    // Find minimum indentation (ignoring empty lines)
    const nonEmptyLines = lines.filter(line => line.trim() !== '');
    if (nonEmptyLines.length === 0) return code.trim();

    const minIndent = Math.min(
        ...nonEmptyLines.map(line => {
            const match = line.match(/^[\s\t]*/);
            return match ? match[0].length : 0;
        })
    );

    // Remove common indentation from all lines
    const normalized = lines.map(line => {
        if (line.trim() === '') return '';
        return line.substring(minIndent);
    });

    return normalized.join('\n');
}

/**
 * Get language identifier for syntax highlighting based on file path
 */
const getLanguageFromPath = (filePath: string): string => {
    const extension = filePath.split('.').pop()?.toLowerCase();

    const languageMap: Record<string, string> = {
        'ts': 'typescript',
        'tsx': 'tsx',
        'js': 'javascript',
        'jsx': 'jsx',
        'py': 'python',
        'rb': 'ruby',
        'java': 'java',
        'go': 'go',
        'rs': 'rust',
        'c': 'c',
        'cpp': 'cpp',
        'cs': 'csharp',
        'php': 'php',
        'swift': 'swift',
        'kt': 'kotlin',
        'sql': 'sql',
        'sh': 'bash',
        'yaml': 'yaml',
        'yml': 'yaml',
        'json': 'json',
        'xml': 'xml',
        'html': 'html',
        'css': 'css',
        'scss': 'scss',
        'md': 'markdown',
    };

    return languageMap[extension || ''] || 'text';
}