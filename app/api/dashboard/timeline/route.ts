import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getReviewTimeline } from "@/lib/db/metrics";

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
        const { searchParams } = new URL(req.url);
        const days = parseInt(searchParams.get('days') || '30');

        const timeline = await getReviewTimeline(userId, days);

        return NextResponse.json({
            success: true,
            timeline,
        })
    } catch (error: any) {
        console.error("[Timeline API] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch timeline" },
            { status: 500 }
        );
    }
}