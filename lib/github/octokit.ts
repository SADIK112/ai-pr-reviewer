import { Octokit } from '@octokit/rest';

/**
 * Create an authenticated Octokit client
 */
export function createOctokitClient(accessToken: string): Octokit {
    return new Octokit({
        auth: accessToken,
        userAgent: 'PR-Review-Assistant v1.0.0',
    });
}

/**
 * Get user's repositories (simplified for Step 1.4)
 */
export async function getUserRepositories(octokit: Octokit) {
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
        type: 'owner',
        sort: 'updated',
        per_page: 100,
    });

    return repos.map(repo => ({
        repoId: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner.login,
        private: repo.private,
        htmlUrl: repo.html_url,
        description: repo.description,
        language: repo.language,
        isActive: !repo.disabled,
        updated_at: repo.updated_at,
        created_at: repo.created_at
    }));
}

/**
 * Check if user has admin access to a repository
 */
export async function hasAdminAccess(
    octokit: Octokit,
    owner: string,
    repo: string
): Promise<boolean> {
    try {
        const { data } = await octokit.repos.get({ owner, repo });
        return data.permissions?.admin || false;
    } catch (error) {
        return false;
    }
}