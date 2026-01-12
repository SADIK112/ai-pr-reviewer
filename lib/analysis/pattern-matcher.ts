import type { PRData } from "@/types";
import { getAddedLines } from "../utils/diff-parser";
import { PATTERN_RULES } from "./pattern-rules";
import { PatternMatch, PatternRule, Suggestion } from "@/types/review";

/**
 * Run pattern matching analysis on PR data
 * @param prData
 * @return Promise - matches, suggestions, executionTime
 */
export const analyzePatterns = (prData: PRData): {
    matches: Array<PatternMatch>;
    suggestions: Array<Suggestion>;
    executionTime: number;
} => {
    const startTime = Date.now();
    const matches: PatternMatch[] = [];

    for (const diff of prData.parsedDiff) {
        const addedLines = getAddedLines(diff);
        // analyse each file diff
        for (const rule of PATTERN_RULES) {
            if (!rule.enabled) continue;
            // skip if rule is disabled
            if (rule.languages && rule.languages.length > 0) {
                const file_name = diff.filename || diff.oldFilename as string;
                const fileExt = file_name.split('.').pop()?.toLowerCase();
                if (!fileExt || !rule.languages.includes(fileExt)) continue;
            }
            // check each added line
            for (const line of addedLines) {
                const regex = new RegExp(rule.pattern);
                const lineMatches = regex.exec(line.content);
                if (lineMatches) {
                    // found a match
                    const existingMatch = matches.find(m => m.patternName === rule.name && m.pattern === rule.pattern.source);
                    const matchInfo = {
                        filePath: diff.filename || diff.oldFilename as string,
                        lineNumber: line.lineNumber,
                        matchedText: lineMatches[0],
                        context: line.content.trim(),
                    };
                    if (existingMatch) {
                        existingMatch.matches.push(matchInfo);
                    } else {
                        matches.push({
                            pattern: rule.pattern.source,
                            patternName: rule.name,
                            type: rule.type,
                            severity: rule.severity,
                            matches: [matchInfo],
                        })
                    }
                }
            }
        }
    }
    // convert matches to suggestions
    const suggestions = matchesToSuggestions(matches);
    const executionTime = Date.now() - startTime;

    return {
        matches,
        suggestions,
        executionTime
    };
}

/**
 * Convert pattern matches to actionable suggestions
 * @param matches
 * @returns Suggestion
 */
const matchesToSuggestions = (matches: Array<PatternMatch>): Array<Suggestion> => {
    const suggestions: Suggestion[] = [];

    for (const match of matches) {
        const rule = PATTERN_RULES.find(r => r.name === match.patternName);
        if (!rule) continue;
        // Group by file
        const fileGroups = groupByFile(match.matches);

        for (const [filePath, fileMatches] of Object.entries(fileGroups)) {
            const lineNumbers = fileMatches.map(m => m.lineNumber);
            const firstLine = Math.min(...lineNumbers);
            const lastLine = Math.max(...lineNumbers);

            suggestions.push({
                type: match.type,
                severity: match.severity,
                title: rule.message,
                description: generateDescription(rule, fileMatches),
                filePath,
                lineNumber: firstLine,
                lineEnd: lastLine > firstLine ? lastLine : undefined,
                codeSnippet: fileMatches.map(m => m.context).join('\n'),
                suggestedCode: rule.suggestion,
            })
        }
    }

    return suggestions;
}

/**
 * Group matches by file path
 * @param matches
 * @returns Record<string, PatternMatch>
 */
const groupByFile = (matches: PatternMatch["matches"]): Record<string, PatternMatch['matches']> => {
    return matches.reduce((acc, match) => {
        if (!acc[match.filePath]) {
            acc[match.filePath] = [];
        }
        acc[match.filePath].push(match);
        return acc;
    }, {} as Record<string, PatternMatch['matches']>)
}

/**
 * Generate detailed description for suggestion
 * @param rule
 * @param matches
 * @returns string
 */
const generateDescription = (rule: PatternRule, matches: PatternMatch["matches"]): string => {
    let description = rule.description;

    if (matches.length === 1) {
        description += `\n\nFound at line ${matches[0].lineNumber}:`;
        description += `\n\`\`\`\n${matches[0].context}\n\`\`\``;
    } else {
        description += `\n\nFound ${matches.length} occurrences:`;
        matches.slice(0, 3).forEach(m => {
            description += `\n- Line ${m.lineNumber}: \`${m.matchedText}\``;
        });
        if (matches.length > 3) {
            description += `\n- ... and ${matches.length - 3} more`;
        }
    }

    return description;
}

/**
 * Analyze a single file for patterns (utility)
 * @param filepath
 * @param content
 * @param rules
 * @returns Suggestions
 */
export const analyzeFile = (filename: string, content: string, rules: PatternRule[] = PATTERN_RULES): Suggestion[] => {
    const matches: PatternMatch[] = [];
    const lines = content.split('\n');

    for (const rule of rules) {
        if (!rule.enabled) continue;
        // Check language
        if (rule.languages && rule.languages.length > 0) {
            const fileExt = filename.split('.').pop()?.toLowerCase();
            if (!fileExt || !rule.languages.includes(fileExt)) continue;
        }

        lines.forEach((line, index) => {
            const lineMatches = rule.pattern.exec(line);;

            if (lineMatches) {
                const existingMatch = matches.find(m => m.patternName === rule.name);

                const matchInfo = {
                    filePath: filename,
                    lineNumber: index + 1,
                    matchedText: lineMatches[0],
                    context: line.trim(),
                };

                if (existingMatch) {
                    existingMatch.matches.push(matchInfo);
                } else {
                    matches.push({
                        pattern: rule.pattern.source,
                        patternName: rule.name,
                        type: rule.type,
                        severity: rule.severity,
                        matches: [matchInfo],
                    })
                }
            }
        })
    }

    return matchesToSuggestions(matches);
}

/**
 * Get statistics about pattern matches
 * @param matches
 */
export const getPatternStats = (matches: Array<PatternMatch>) => {
    const stats = {
        totalMatches: 0,
        byType: {} as Record<string, number>,
        bySeverity: {} as Record<string, number>,
        byPattern: {} as Record<string, number>
    };

    for (const match of matches) {
        stats.totalMatches += match.matches.length;
        stats.byType[match.type] = (stats.byType[match.type] || 0) + match.matches.length;
        stats.bySeverity[match.severity] = (stats.bySeverity[match.severity] || 0) + match.matches.length;
        stats.byPattern[match.patternName] = (stats.byPattern[match.patternName] || 0) + match.matches.length;
    }

    return stats;
}