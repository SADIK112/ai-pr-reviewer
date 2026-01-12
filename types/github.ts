// Webhook payload types

export enum PRState {
    OPEN = 'open',
    CLOSED = 'closed',
    MERGED = 'merged',
}

export enum FileChangeStatus {
    ADDED = 'added',
    MODIFIED = 'modified',
    REMOVED = 'removed',
    RENAMED = 'renamed',
}

export enum DiffType {
    ADD = 'add',
    REMOVE = 'remove',
    CONTEXT = 'context',
}

export enum WebhookEvents {
    PULL_REQUEST = 'pull_request',
    PING = 'ping',
}

export enum PREvents {
    OPENED = 'opened',
    SYNCHRONIZE = 'synchronize',
    REOPENED = 'reopened',
    CLOSED = 'closed',
}

export interface WebhookUser {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
    type: string;
}

export interface Repository {
    id?: string;
    repoId: string;
    userId: string;
    name: string;
    fullName: string;
    owner: string;
    isPrivate: boolean;
    htmlUrl: string;
    webhookId: string | null;
    webhookSecret: string | null;
    isActive: boolean;
    prsReviewed: Number;
    description: string | null;
    created_at: Date;
    updated_at: Date;
    lastReviewed?: Date | null,
    isSyncing?: boolean;
}

export interface PullRequest {
    id: number;
    node_id: string;
    number: number;
    state: PRState;
    title: string;
    user: WebhookUser;
    body: string | null;
    closed_at: string | null;
    merged_at: string | null;
    assignees: string[] | [];
    assignee: string | null;
    requested_reviewers: WebhookUser[] | [];
    comments: number;
    review_comments: number;
    commits: number;
    additions: number;
    deletions: number;
    changed_files: number;
    created_at: string;
    updated_at: string;
    html_url: string;
}

export interface PullRequestWebhookPayload {
    action: PREvents;
    number: number;
    pull_request: PullRequest;
    repository: Repository;
    sender: WebhookUser;
}

export interface PingWebhookPayload {
    zen: string;
    hook_id: number;
    repository: Repository;
}

// === PR DATA TYPES === //

export interface PRFile {
    filename: string;
    status: FileChangeStatus,
    additions: number;
    deletions: number;
    changes: number;
    patch: string;
    rawUrl: string;
    blobUrl: string;
    previousFilename?: string
}

export interface PRCommit {
    sha: string;
    message: string;
    author?: string;
    date?: string,
    url: string;
}

export interface PRData {
    id: number;
    number: number;
    title: string;
    body: string | null;
    state: PRState;
    baseBranch: string;
    headBranch: string;
    baseCommit: string;
    headCommit: string;
    author: string;
    url: string;
    files: PRFile[];
    commits: PRCommit[];
    additions: number;
    deletions: number;
    changedFiles: number;
    parsedDiff: ParsedDiff[];
    createdAt: string;
    updatedAt: string;
}

export interface DiffLine {
    content: string;
    type: DiffType,
    lineNumber: number;
    oldLineNumber: number | null;
    newLineNumber: number | null;
}

export interface DiffHunk {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: DiffLine[];
}

export interface ParsedDiff {
    filename: string;
    oldFilename?: string;
    status: FileChangeStatus;
    additions: number;
    deletions: number;
    hunks: DiffHunk[];
}

export interface WebhookContext {
    event: string | null;
    deliveryId: string | null;
    signature: string;
    payload: string;
}

// Constants
export const SUPPORTED_EVENTS = Object.values(WebhookEvents) as WebhookEvents[]
export const REVIEWABLE_ACTIONS = [
    PREvents.OPENED,
    PREvents.SYNCHRONIZE,
    PREvents.REOPENED
] as PREvents[]

// Types
export type SupportedEvent = WebhookEvents
export type ReviewableAction = PREvents