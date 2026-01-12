import { ParsedDiff, DiffHunk, DiffLine, FileChangeStatus, DiffType } from "@/types";

/**
 * Parse unified diff format into structured data
 * Unified diff format example:
 * diff --git a.file.ts b/file.ts
 * index abc123..def444 100644
 * --- a/file.ts
 * +++ b/file.ts
 * context line
 * -removed line
 * +added line
 * context line
 */

export const parseDiff = (diffContent: string): ParsedDiff[] => {
    if (!diffContent || diffContent.trim() === '') {
        return [];
    }

    const files: ParsedDiff[] = [];
    const fileBlocks = splitIntoFileBlocks(diffContent);

    for (const block of fileBlocks) {
        const parsed = parseFileBlock(block);
        if (parsed) files.push(parsed)
    }

    return files;
}

/**
 * Split diff content into individual file blocks
 */

export const splitIntoFileBlocks = (diffContent: string): string[] => {
    const lines = diffContent.split('\n');
    const blocks: string[] = [];
    let currentBlock: string[] = [];

    for (const line of lines) {
        if (line.startsWith('diff --git')) {
            if (currentBlock.length > 0) {
                blocks.push(currentBlock.join('\n'));
            }
            currentBlock = [line];
        } else {
            currentBlock.push(line);
        }
    }

    if (currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n'));
    }

    return blocks;
}

/**
 * Parse a sigle file's diff block
 */

const parseFileBlock = (fileBlock: string): ParsedDiff | null => {
    const lines = fileBlock.split('\n');
    // Extract filename from diff --git line
    const gitLine = lines.find(l => l.startsWith('diff --git'));
    if (!gitLine) return null;

    const gitMatch = gitLine.match(/diff --git a\/(.*?) b\/(.*?)/);
    if (!gitMatch) return null;

    const oldFilename = gitMatch[1];
    const newFilename = gitMatch[2];
    // Determine file status
    let status: FileChangeStatus = FileChangeStatus.MODIFIED;

    if (oldFilename !== newFilename) {
        status = FileChangeStatus.RENAMED;
    } else if (lines.some(l => l.startsWith('new file'))) {
        status = FileChangeStatus.ADDED;
    } else if (lines.some(l => l.startsWith('deleted file'))) {
        status = FileChangeStatus.REMOVED;
    }
    // Parse hunks
    const hunks: DiffHunk[] = parseHunks(lines);
    // Calculate additions and deletions
    let additions = 0;
    let deletions = 0;
    for (const hunk of hunks) {
        for (const line of hunk.lines) {
            if (line.type === DiffType.ADD) additions++;
            if (line.type === DiffType.REMOVE) deletions++;
        }
    }

    return {
        filename: newFilename,
        oldFilename: oldFilename !== newFilename ? oldFilename : undefined,
        status,
        additions,
        deletions,
        hunks
    }
}

/**
 * Parse hunks from diff lines
 * Hunk header format: @@ -10,7 +10,8 @@ optional context
 */
const parseHunks = (lines: string[]): DiffHunk[] => {
    const hunks: DiffHunk[] = [];
    let currentHunk: DiffHunk | null = null;
    let oldLineNum = 0;
    let newLineNum = 0;

    for (const line of lines) {
        if (line.startsWith('@@')) {
            if (currentHunk) {
                hunks.push(currentHunk);
            }
            const hunkMatch = line.match(/@@ -(\d+),?(\d+)? \+(\d+),?(\d+)? @@/);
            if (hunkMatch) {
                const oldStart = parseInt(hunkMatch[1], 10);
                const oldLines = hunkMatch[2] ? parseInt(hunkMatch[2], 10) : 1;
                const newStart = parseInt(hunkMatch[3], 10);
                const newLines = hunkMatch[4] ? parseInt(hunkMatch[4], 10) : 1;

                currentHunk = {
                    oldStart,
                    oldLines,
                    newStart,
                    newLines,
                    lines: []
                };

                oldLineNum = oldStart;
                newLineNum = newStart;
            }
            continue;
        }
        // Parse diff content lines
        if (currentHunk) {
            if (line.startsWith('+') && !line.startsWith('+++')) {
                // Addition
                currentHunk.lines.push({
                    content: line.substring(1),
                    type: DiffType.ADD,
                    lineNumber: newLineNum,
                    oldLineNumber: oldLineNum,
                    newLineNumber: newLineNum
                });
                newLineNum++;
            } else if (line.startsWith('-') && !line.startsWith('---')) {
                // Deletion
                currentHunk.lines.push({
                    content: line.substring(1),
                    type: DiffType.REMOVE,
                    lineNumber: oldLineNum,
                    oldLineNumber: oldLineNum,
                    newLineNumber: newLineNum
                });
                oldLineNum++;
            } else if (line.startsWith(' ')) {
                // Context line (unchanged)
                currentHunk.lines.push({
                    content: line.substring(1),
                    type: DiffType.CONTEXT,
                    lineNumber: oldLineNum,
                    oldLineNumber: oldLineNum,
                    newLineNumber: newLineNum
                });
                oldLineNum++;
                newLineNum++;
            }
        }
    };
    // Add the last hunk
    if (currentHunk) {
        hunks.push(currentHunk);
    }

    return hunks;
}

/**
 * Get specific line from diff
 */
export const getLineFromDiff = (
    diff: ParsedDiff,
    lineNumber: number
): DiffLine | null => {
    for (const hunk of diff.hunks) {
        const line = hunk.lines.find(
            l => l.lineNumber === lineNumber || 
            l.newLineNumber === lineNumber
        );
        if (line) return line;
    }
    return null;
}

/**
 * Get lines changed in a specific range
 */
export const getLinesInRange = (
    diff: ParsedDiff,
    startLine: number,
    endLine: number
): DiffLine[] => {
    const lines: DiffLine[] = [];
    for (const hunk of diff.hunks) {
        for (const line of hunk.lines) {
            const lineNum = line.newLineNumber || line.lineNumber;
            if (lineNum >= startLine && lineNum <= endLine) {
                lines.push(line);
            }
        }
    };

    return lines;
}

/**
 * Get all added lines from diff
 */
export const getAddedLines = (diff: ParsedDiff): DiffLine[] => {
    const addedLines: DiffLine[] = [];
    for (const hunk of diff.hunks) {
        for (const line of hunk.lines) {
            if (line.type === DiffType.ADD) {
                addedLines.push(line);
            }
        }
    };

    return addedLines;
}

/**
 * Get all removed lines from diff
 */
export const getRemovedLines = (diff: ParsedDiff): DiffLine[] => {
    const removedLines: DiffLine[] = [];
    for (const hunk of diff.hunks) {
        for (const line of hunk.lines) {
            if (line.type === DiffType.REMOVE) {
                removedLines.push(line);
            }
        }
    };

    return removedLines;
}

/**
 * Format diff for display or analysis
 */
export const formatDiff = (diff: ParsedDiff): string => {
    let result = `File: ${diff.filename} (${diff.status})\n`;
    result += `+${diff.additions} -${diff.deletions}\n\n`;
    for (const hunk of diff.hunks) {
        result = `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@\n`;
        for (const line of hunk.lines) {
            const prefix = line.type === DiffType.ADD ? '+' : line.type === DiffType.REMOVE ? '-' : ' ';
            result += `${prefix}${line.content}\n`;
        }
        result += '\n';
    }

    return result;
}