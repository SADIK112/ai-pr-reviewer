import crypto from "crypto";
import { Octokit } from "@octokit/rest";

/**
 * Generate a secure webhook secret
 */
export function generateWebhookSecret(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Update existing webhook
 * @param octokit 
 * @param owner 
 * @param repo
 * @param hookId 
 * @param webhookUrl 
 * @param secret 
 * @param events 
 * @returns 
 */
export async function updateWebhook(
    octokit: Octokit,
    owner: string,
    repo: string,
    hookId: number,
    webhookUrl: string,
    secret: string,
    active: boolean,
    events: Array<string>
): Promise<{ success: boolean, data: any | null }> {
    try {
        const { data: updatedHook } = await octokit.rest.repos.updateWebhook({
            owner,
            repo,
            hook_id: hookId,
            config: {
                url: webhookUrl,
                content_type: 'json',
                secret: secret,
                insecure_ssl: '0',
            },
            events: events,
            active: active,
        });
        console.log(`[Webhook] Updated webhook for ${owner}/${repo}`);
        return { success: true, data: { updatedHook } };
    } catch (error: any) {
        console.error('[Webhook] Failed to update webhook:', error.message);
        throw new Error(`Failed to update webhook: ${error.message}`);
    }
}

/**
 * Register a new hook
 * @param octokit 
 * @param owner 
 * @param repo 
 * @param webhookUrl 
 * @param secret 
 * @param events 
 * @returns 
 */
export async function registerWebhook(
    octokit: Octokit,
    owner: string,
    repo: string,
    webhookUrl: string,
    secret: string,
    active: boolean,
    events: Array<string>
): Promise<{ success: boolean, data: any | null }> {
    try {
        const { data: newHook } = await octokit.rest.repos.createWebhook({
            owner,
            repo,
            config: {
                url: webhookUrl,
                content_type: 'json',
                secret: secret,
                insecure_ssl: 0,
            },
            events: events,
            active: active || true,
        });
        console.log(`[Webhook] Created webhook for ${owner}/${repo}`);
        return { success: true, data: { newHook } };
    } catch (error: any) {
        console.error('[Webhook] Failed to register webhook:', error.message);
        throw new Error(`Failed to register webhook: ${error.message}`);
    }
}

/**
 * Delete a webhook from a repository
 */
export async function deleteWebhook(
    octokit: Octokit,
    owner: string,
    repo: string,
    hookId: number
): Promise<{ success: boolean, data: any }> {
    try {
        const deletedHook = await octokit.repos.deleteWebhook({
            owner,
            repo,
            hook_id: hookId,
        })
        console.log(`[Webhook] Deleted webhook ${hookId} from ${owner}/${repo}`);
        return {
            success: true,
            data: deletedHook
        }
    } catch (error: any) {
        console.error('[Webhook] Failed to delete webhook:', error.message);
        throw new Error(`Failed to delete webhook: ${error.message}`);
    }
}

/**
 * Test a webhook connection
 */
export async function testWebhookConnection(
    octokit: Octokit,
    owner: string,
    repo: string,
    hookId: number
): Promise<boolean> {
    try {
        await octokit.repos.pingWebhook({
            owner,
            repo,
            hook_id: hookId,
        });
        console.log(`[Webhook] Pinged webhook ${hookId} on ${owner}/${repo}`);
        return true;
    } catch (error: any) {
        console.error('[Webhook] Failed to ping webhook:', error.message);
        return false;
    }
}

/**
 * Get webhook deliveries
 */
export async function getWebhookDeliveries(
    octokit: Octokit,
    owner: string,
    repo: string,
    hookId: number
): Promise<any[]> {
    try {
        const { data: deliveries } = await octokit.repos.listWebhookDeliveries({
            owner,
            repo,
            hook_id: hookId,
            per_page: 10,
        });
        return deliveries;
    } catch (error: any) {
        console.error('[Webhook] Failed to get webhook deliveries:', error.message);
        throw new Error(`Failed to get webhook deliveries: ${error.message}`);
    }
}