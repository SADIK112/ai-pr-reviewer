import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getDashboardStats } from "@/lib/db/metrics";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const userId = session.user.id;
        // Fetch dashboard stats for the user
        const summary = await getDashboardStats(userId);

        return NextResponse.json({
            success: true,
            summary,
        });
    } catch (error: any) {
        console.error("[Dashboard API] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard stats" },
            { status: 500 }
        );
    }
}