import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/db/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Get all repositories for the authenticated user
 * @param req 
 * @returns 
 */

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const searchParams = req.nextUrl.searchParams;

        const query = searchParams.get("query")?.trim();
        const isActiveParam = searchParams.get("isActive");

        // Convert string → boolean safely
        const isActive =
            isActiveParam === "true"
                ? true
                : isActiveParam === "false"
                    ? false
                    : undefined;

        const repos = await prisma.repository.findMany({
            where: {
                userId: session.user.id,

                ...(query && {
                    name: {
                        contains: query,
                        mode: "insensitive",
                    },
                }),

                ...(typeof isActive === "boolean" && {
                    isActive,
                }),
            },
            orderBy: {
                createdAt: "desc",
            },
            include: {
                _count: {
                    select: { pullRequests: true },
                },
            },
        });
        console.log({ repos })
        return NextResponse.json(repos);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to fetch repositories" },
            { status: 500 }
        );
    }
}


/**
 * Update selected repositories for the authenticated user
 * make isActive from false to true for all the selected repo
 * @param req 
 * @returns 
 */
export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        const { repoIds, isActive } = await req.json();

        if (!Array.isArray(repoIds) || repoIds.length === 0) {
            return NextResponse.json(
                { error: "No repositories selected" },
                { status: 400 }
            )
        }

        const updatedRepos = await prisma.repository.updateMany({
            where: {
                repoId: { in: repoIds },
                userId: session.user.id,
            },
            data: {
                isActive: isActive,
            }
        })
        console.log({ updatedRepos })
        // return success response if updated
        if (updatedRepos.count > 0) {
            return NextResponse.json({
                success: true,
                updatedCount: updatedRepos.count,
            })
        }
        return NextResponse.json({
            success: false,
            message: "No repositories were updated",
        })
    } catch (error) {
        console.error("[API] Update repositories failed:", error);
        return NextResponse.json(
            { error: "Failed to update repositories" },
            { status: 500 }
        )
    }
}