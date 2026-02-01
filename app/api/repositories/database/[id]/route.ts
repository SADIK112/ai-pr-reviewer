import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/db/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const repoId = id;

        const repository = await prisma.repository.findFirst({
            where: {
                repoId: repoId,
                userId: session.user.id
            },
            include: {
                _count: {
                    select: { pullRequests: true },
                },
            },
        });
        console.log({ repository })
        if (!repository) {
            return NextResponse.json({ error: "Repository not found" }, { status: 404 });
        }

        return NextResponse.json(repository);
    } catch (error) {
        console.error("[API] Fetch single repository failed:", error);
        return NextResponse.json({ error: "Failed to fetch repository" }, { status: 500 });
    }
}
