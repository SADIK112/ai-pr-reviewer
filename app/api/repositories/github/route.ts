import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/db/prisma";
import { createOctokitClient, getUserRepositories } from "@/lib/github/octokit";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Prisma } from "@/lib/generated/prisma/client";

/**
 * Sync repositories from GitHub
 * @param req 
 * @returns 
 */

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const dbSession = await prisma.account.findFirst({
            where: {
                userId: session.user.id,
                provider: 'github',
            },
            select: {
                access_token: true,
            },
        });

        if (!dbSession?.access_token) {
            return NextResponse.json(
                { error: "Invalid session" },
                { status: 400 }
            );
        }

        const octokit = createOctokitClient(dbSession.access_token);
        const githubRepos = await getUserRepositories(octokit);

        const existingRepos = await prisma.repository.findMany({
            where: { userId: session.user.id },
        });
        const existingRepoMap = new Map(
            existingRepos.map(repo => [repo.fullName, repo])
        );

        const reposToCreate: Prisma.RepositoryCreateManyInput[] = [];
        const reposToUpdate: {
            id: string;
            data: Prisma.RepositoryUpdateInput;
        }[] = [];

        const githubRepoKeys = new Set<string>();

        for (const repo of githubRepos) {
            githubRepoKeys.add(repo.fullName);

            const existing = existingRepoMap.get(repo.fullName);

            if (existing) {
                reposToUpdate.push({
                    id: existing.id,
                    data: {
                        description: repo.description,
                        isPrivate: repo.private,
                        htmlUrl: repo.htmlUrl,
                        isActive: false,
                    },
                });
            } else {
                reposToCreate.push({
                    userId: session.user.id,
                    repoId: repo.repoId.toString(),
                    owner: repo.owner,
                    name: repo.name,
                    fullName: repo.fullName,
                    description: repo.description,
                    isPrivate: repo.private,
                    htmlUrl: repo.htmlUrl,
                    isActive: false,
                });
            }
        }

        const repoIdsToDeactivate = existingRepos
            .filter(repo => !githubRepoKeys.has(repo.fullName))
            .map(repo => repo.id);

        await prisma.$transaction(async (tx) => {
            if (reposToCreate.length > 0) {
                await tx.repository.createMany({
                    data: reposToCreate,
                    skipDuplicates: true,
                });
            }

            for (const update of reposToUpdate) {
                await tx.repository.update({
                    where: { id: update.id },
                    data: update.data,
                });
            }

            if (repoIdsToDeactivate.length > 0) {
                await tx.repository.updateMany({
                    where: {
                        id: { in: repoIdsToDeactivate },
                    },
                    data: {
                        isActive: false,
                    },
                });
            }
        });

        return NextResponse.json({
            success: true,
            stats: {
                total: githubRepos.length,
                added: reposToCreate.length,
                updated: reposToUpdate.length,
                deactivated: repoIdsToDeactivate.length,
            },
        });
    } catch (error) {
        console.error("[API] Repo sync failed:", error);
        return NextResponse.json(
            { error: "Failed to sync repositories" },
            { status: 500 }
        );
    }
}