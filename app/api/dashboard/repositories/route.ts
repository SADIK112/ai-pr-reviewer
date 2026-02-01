import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getRepositoryStats } from "@/lib/db/metrics";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        const repositories = await getRepositoryStats(userId);

        return NextResponse.json({ repositories });
    } catch (error: any) {
        console.error("[Repositories API] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch repository stats" },
            { status: 500 }
        );
    }
}