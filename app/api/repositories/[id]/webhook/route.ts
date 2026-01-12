import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/db/prisma";
import { createOctokitClient } from "@/lib/github/octokit";
import {
    registerWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhookConnection
} from "@/lib/github/webhooks";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Enable webhook for a repository
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }
        const {
            repositoryId,
            repositoryOwner,
            repositoryName,
            webhookId,
            webhookUrl,
            webhookSecret,
            active,
            events
        } = await req.json();
        console.log({
            repositoryId,
            repositoryOwner,
            repositoryName,
            webhookId,
            webhookUrl,
            webhookSecret,
            active,
            events
        })
        // Get session token from account db
        const dbSession = await prisma.account.findFirst({
            where: {
                userId: session.user.id,
                provider: 'github',
            },
            select: {
                access_token: true,
            }
        });

        if (!dbSession?.access_token) {
            return NextResponse.json(
                { error: "GitHub access token not found" },
                { status: 400 }
            )
        };
        // Create Octokit client
        const octokit = createOctokitClient(dbSession.access_token);
        let webhookResult = null;

        if (webhookId) {
            //Update the existing Webhook
            webhookResult = await updateWebhook(
                octokit,
                repositoryOwner,
                repositoryName,
                parseInt(webhookId),
                webhookUrl,
                webhookSecret,
                active,
                events,
            )
        } else {
            // Register a new webhook
            webhookResult = await registerWebhook(
                octokit,
                repositoryOwner,
                repositoryName,
                webhookUrl,
                webhookSecret,
                active,
                events,
            );
        }
        console.dir({ webhookResult }, { depth: null });
        // Update repository in database
        const updatedRepo = await prisma.repository.update({
            where: { repoId: repositoryId },
            data: {
                webhookId: webhookResult?.data?.newHook.id.toString(),
                webhookSecret: webhookSecret,
                isActive: webhookResult?.data.newHook.active || true
            }
        });

        return NextResponse.json({
            success: true,
            repository: {
                id: updatedRepo.id,
                name: updatedRepo.name,
                owner: updatedRepo.owner,
                isActive: updatedRepo.isActive,
                webhookId: updatedRepo.webhookId,
            },
        });
    } catch (error: any) {
        console.error('[API] Webhook registration failed:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to enable webhook' },
            { status: 500 }
        );
    }
}

/**
 * Disable webhook for a repository
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;
        console.log({ id });
        // Find repository
        const repository = await prisma.repository.findFirst({
            where: {
                webhookId: id,
                userId: session.user.id,
            },
            select: {
                id: true,
                name: true,
                owner: true,
                webhookId: true,
            }
        });
        
        if (!repository) {
            return NextResponse.json(
                { error: 'Repository not found' },
                { status: 404 }
            );
        }

        if (!repository.webhookId) {
            return NextResponse.json(
                { error: 'No webhook configured' },
                { status: 400 }
            );
        }
        // Get session token from account db
        const dbSession = await prisma.account.findFirst({
            where: {
                userId: session.user.id,
                provider: 'github',
            },
            select: {
                access_token: true,
            }
        });

        if (!dbSession?.access_token) {
            return NextResponse.json(
                { error: "GitHub access token not found" },
                { status: 400 }
            )
        };

        // Create Octokit client
        const octokit = createOctokitClient(dbSession.access_token);
        // Delete webhook from GitHub
        const result = await deleteWebhook(
            octokit,
            repository.owner,
            repository.name,
            parseInt(repository.webhookId)
        );

        console.dir({ result }, { depth: null })

        // Update repository in database
        const updatedRepo = await prisma.repository.update({
            where: { id: repository.id },
            data: {
                webhookId: null,
                webhookSecret: null,
            },
        });

        return NextResponse.json({
            success: true,
            repository: {
                id: updatedRepo.id,
                name: updatedRepo.name,
                owner: updatedRepo.owner,
            },
        });
    } catch (error: any) {
        console.error('[API] Webhook deletion failed:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to disable webhook' },
            { status: 500 }
        );
    }
}

// Test webhook connection
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Find repository
        const repository = await prisma.repository.findFirst({
            where: {
                repoId: params.id,
                userId: session.user.id,
            },
        });

        if (!repository) {
            return NextResponse.json(
                { error: 'Repository not found' },
                { status: 404 }
            );
        }

        if (!repository.webhookId) {
            return NextResponse.json(
                { error: 'No webhook configured' },
                { status: 400 }
            );
        }
        // Get session token from account db
        const dbSession = await prisma.account.findFirst({
            where: {
                userId: session.user.id,
                provider: 'github',
            },
            select: {
                access_token: true,
            }
        });

        if (!dbSession?.access_token) {
            return NextResponse.json(
                { error: "GitHub access token not found" },
                { status: 400 }
            )
        };
        // Create Octokit client
        const octokit = createOctokitClient(dbSession.access_token);

        const success = await testWebhookConnection(
            octokit,
            repository.owner,
            repository.name,
            parseInt(repository.webhookId)
        );

        return NextResponse.json({
            success,
            message: success ? 'Webhook is working' : 'Webhook test failed',
        });
    } catch (error: any) {
        console.error('[API] Webhook test failed:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to test webhook' },
            { status: 500 }
        );
    }
}