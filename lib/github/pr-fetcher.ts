import { FileChangeStatus, PRCommit, PRData, PRFile } from "@/types";
import { Octokit } from "@octokit/rest";
import { parseDiff } from "../utils/diff-parser";
import { getPRType } from "../utils/common";

const MAX_FILE_SIZE = +(process.env.MAX_FILE_SIZE || 500000);
const CONTEXT_LINES = +(process.env.CONTEXT_LINES || 3);

/**
 * Fetch complete PR data including diffs and metadata
 */
export const fetchPRData = async (
    octokit: Octokit,
    owner: string,
    repo: string,
    prNumber: number
): Promise<PRData> => {
    try {
        const { data: pr } = await octokit.pulls.get({
            owner,
            repo,
            pull_number: prNumber
        });
        //Fetch list of changed files
        const files = await fetchPRFiles(octokit, owner, repo, prNumber);
        console.log("GET THE FILES: ", { files });
        // Fetch commits
        const commits = await fetchPRCommits(octokit, owner, repo, prNumber);
        console.log("GET THE COMMITS: ", { commits })
        // Parse the PR diff for detailed analysis
        const diffUrl = pr.diff_url;
        const diffContent = await fetchDiffContent(diffUrl);
        const parsedDiff = parseDiff(diffContent);
        console.dir({ parsedDiff }, { depth: null })

        return {
            id: pr.id,
            number: pr.number,
            title: pr.title,
            body: pr.body || '',
            author: pr.user.login,
            state: getPRType(pr.state),
            baseBranch: pr.base.ref,
            headBranch: pr.head.ref,
            baseCommit: pr.base.sha,
            headCommit: pr.head.sha,
            url: pr.html_url,
            createdAt: pr.created_at,
            updatedAt: pr.updated_at,
            additions: pr.additions,
            deletions: pr.deletions,
            changedFiles: pr.changed_files,
            files,
            commits,
            parsedDiff,
        };
    } catch (error: any) {
        console.error(`[PR Fetcher] Error fetching PR #${prNumber} data:`, error);
        throw new Error(`Failed to fetch PR data: ${error.message}`);
    }
}

/**
 * Fetch list of files changed in the PR
 * @param octokit
 * @param owner
 * @param repo
 * @param prNumber
 * @returns Promise<PRFile[]>
 */
const fetchPRFiles = async (
    octokit: Octokit,
    owner: string,
    repo: string,
    prNumber: number
): Promise<PRFile[]> => {
    const prFiles: PRFile[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
        const { data: files } = await octokit.pulls.listFiles({
            owner,
            repo,
            pull_number: prNumber,
            per_page: perPage,
            page
        });
        console.log("FILE SIZE", files.length);
        if (files.length === 0) break;

        for (const file of files) {
            if (isBinaryFile(file.filename)) continue;
            if (file.changes > MAX_FILE_SIZE) continue;

            prFiles.push({
                filename: file.filename,
                status: file.status as FileChangeStatus,
                additions: file.additions,
                deletions: file.deletions,
                changes: file.changes,
                patch: file.patch || '',
                rawUrl: file.raw_url,
                blobUrl: file.blob_url,
                previousFilename: file.previous_filename || undefined
            });

            if (prFiles.length >= MAX_FILE_SIZE) break;
        }

        if (files.length < perPage || prFiles.length >= MAX_FILE_SIZE) break;
        page++;
    }

    return prFiles;
};


/**
 * Fetch commits in the PR
 * @param octokit
 * @param owner
 * @param repo
 * @param prNumber
 * @returns Promise<PRCommit[]>
 */
const fetchPRCommits = async (
    octokit: Octokit,
    owner: string,
    repo: string,
    prNumber: number
): Promise<PRCommit[]> => {
    try {
        const { data: commits } = await octokit.pulls.listCommits({
            owner,
            repo,
            pull_number: prNumber,
            per_page: 100
        });

        return commits.map(c => ({
            sha: c.sha,
            message: c.commit.message,
            author: c?.commit?.author?.name,
            date: c?.commit?.author?.date,
            url: c.html_url,
        }))
    } catch (error: any) {
        console.error(`[PR Fetcher] Error fetching commits for PR #${prNumber}:`, error);
        throw new Error(`Failed to get webhook deliveries: ${error.message}`);
    }
}

/**
 * Fetch raw diff content from GitHub
 * @param diffUrl
 * @return string
 */
const fetchDiffContent = async (diffUrl: string): Promise<string> => {
    try {
        const response = await fetch(diffUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch diff from ${diffUrl}: ${response.status} ${response.statusText}`);
        }

        return await response.text();
    } catch (error: any) {
        console.error(`[PR Fetcher] Error fetching raw diff from ${diffUrl}:`, error);
        throw new Error(`Failed to fetch raw diff: ${error.message}`);
    }
}

/**
 * Check if a file is binary based on extension
 * @param filename
 * @return boolean
 */
const isBinaryFile = (filename: string): boolean => {
    const binaryExtensions = [
        '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg',
        '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z',
        '.exe', '.dll', '.so', '.dylib',
        '.mp3', '.mp4', '.avi', '.mov', '.wmv',
        '.ttf', '.woff', '.woff2', '.eot',
        '.pyc', '.class', '.o', '.a',
    ];
    const ext = filename.substring(filename.lastIndexOf('.'));
    return binaryExtensions.includes(ext.toLowerCase());
}

/**
 * Extract code context around specific lines
 * @param fileContent
 * @param lineNumber
 * @param contextLines
 * @return before, target, after
 */
export const extractCodeContext = (
    fileContent: string,
    lineNumber: number,
    contextLines: number = CONTEXT_LINES
): { before: string[]; target: string; after: string[] } => {
    const lines = fileContent.split('\n');
    const targetIndex = lineNumber - 1; // Convert to 0-based index

    if (targetIndex < 0 || targetIndex >= lines.length) {
        return {
            before: [],
            target: '',
            after: []
        }
    }
    const start = Math.max(0, targetIndex - contextLines);
    const end = Math.min(lines.length, targetIndex + contextLines + 1);

    return {
        before: lines.slice(start, targetIndex),
        target: lines[targetIndex],
        after: lines.slice(targetIndex + 1, end)
    }
}

/**
 * Get language from file extension
 * @param filename
 * @return string
 */
export const getLanguageFromFilename = (filename: string): string => {
    const ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    const languageMap: Record<string, string> = {
        'ts': 'typescript',
        'tsx': 'typescript',
        'js': 'javascript',
        'jsx': 'javascript',
        'py': 'python',
        'rb': 'ruby',
        'java': 'java',
        'go': 'go',
        'rs': 'rust',
        'c': 'c',
        'cpp': 'cpp',
        'h': 'c',
        'hpp': 'cpp',
        'cs': 'csharp',
        'php': 'php',
        'swift': 'swift',
        'kt': 'kotlin',
        'scala': 'scala',
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
    return languageMap[ext] || 'plaintext';
}