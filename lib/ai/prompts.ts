import type { LLMReviewRequest } from "@/types";

/**
 * Build system prompt with better instructions
 */
export const buildSystemPrompt = (request: LLMReviewRequest): string => {
  const focusAreas =
    request.userPreferences?.focusAreas ?? [
      "bugs",
      "security",
      "performance",
      "maintainability",
    ];

  return `You are an expert code reviewer performing a GitHub pull request analysis.

CRITICAL RULES:
1. Return ONLY valid JSON matching the exact schema provided
2. DO NOT include markdown, explanations, or text outside the JSON object
3. DO NOT fabricate files, functions, or line numbers not present in the diff
4. If uncertain about an issue, do NOT report it (precision over recall)
5. Empty suggestions array is acceptable if code is clean

FOCUS AREAS (in priority order):
${focusAreas.map((area, i) => `${i + 1}. ${area}`).join('\n')}

OUTPUT REQUIREMENTS:
- title: Brief, actionable (max 60 chars). Example: "Potential SQL injection in user query"
- description: Explain WHY it's an issue and WHAT could go wrong (2-3 sentences)
- codeSnippet: Extract ONLY the problematic lines (max 10 lines)
- suggestedCode: Provide the FIXED code with proper formatting
  * Use \\n for line breaks (IMPORTANT!)
  * Maintain original indentation
  * Example: "if (user) {\\n  return user.id;\\n}" NOT "if (user) { return user.id; }"

SEVERITY GUIDELINES:
- CRITICAL: Security vulnerabilities, data loss, crashes
- HIGH: Bugs that affect functionality, performance issues
- MEDIUM: Code smells, maintainability concerns
- LOW: Style improvements, minor optimizations
- INFO: Suggestions, best practices

CONFIDENCE SCORE:
- 0.9-1.0: Certain (clear bug, security issue)
- 0.7-0.8: High confidence (likely issue based on context)
- 0.5-0.6: Medium (potential issue, needs review)
- Below 0.5: Do not report

EXAMPLES OF GOOD SUGGESTIONS:
✓ Specific: "Missing null check on line 42 before accessing user.email"
✗ Vague: "There might be some issues with error handling"

✓ Actionable: "Replace var with const to prevent reassignment"
✗ Generic: "Use better variable names"

Remember: Quality over quantity. 3 high-confidence issues > 10 uncertain ones.`;
};

/**
 * Build user prompt with cleaner structure
 */
export const buildUserPrompt = (request: LLMReviewRequest): string => {
  const { files, context, patternFindings } = request;

  let prompt = `# Pull Request Review

## Context
**Title:** ${context.prTitle}
${context.prDescription ? `**Description:** ${context.prDescription}\n` : ''}
**Changes:** ${files.length} files, ${files.reduce((sum, f) => sum + f.additions, 0)} additions, ${files.reduce((sum, f) => sum + f.deletions, 0)} deletions

`;

  // Priority: Show diffs FIRST (most important)
  prompt += `## Code Changes\n\n`;

  const maxFiles = 5;
  const maxLinesPerFile = 150; // Increased for better context

  files.slice(0, maxFiles).forEach((file, index) => {
    const lineCount = file.diff.split("\n").length;
    const isTruncated = lineCount > maxLinesPerFile;

    prompt += `### ${index + 1}. ${file.path} (+${file.additions}/-${file.deletions})\n`;
    prompt += `Language: ${file.language}\n\n`;
    prompt += '```diff\n';
    prompt += file.diff.split("\n").slice(0, maxLinesPerFile).join("\n");
    prompt += '\n```\n\n';

    if (isTruncated) {
      prompt += `_[Showing ${maxLinesPerFile} of ${lineCount} lines]_\n\n`;
    }
  });

  // Secondary: Pattern findings as additional context
  if (patternFindings?.length) {
    prompt += `## Pre-Analysis Signals\n`;
    prompt += `The following potential issues were detected by automated patterns. Use these as hints, but verify each one:\n\n`;

    patternFindings.slice(0, 5).forEach((finding, i) => {
      prompt += `${i + 1}. **${finding.title}** (${finding.severity})\n`;
      prompt += `   - File: \`${finding.filePath}\`${finding.lineNumber ? `:${finding.lineNumber}` : ''}\n`;
      prompt += `   - ${finding.description.split('\n')[0]}\n\n`;
    });
  }

  // Additional files summary (if truncated)
  if (files.length > maxFiles) {
    prompt += `\n## Additional Files (not shown in detail)\n`;
    files.slice(maxFiles).forEach((file, i) => {
      prompt += `${i + 1}. \`${file.path}\` (+${file.additions}/-${file.deletions})\n`;
    });
  }

  prompt += `\n---\n\n`;
  prompt += `**Instructions:** Review the code changes above. Focus on the diff sections (lines starting with + or -). Report only issues you can verify from the provided code.`;

  return prompt.trim();
};
