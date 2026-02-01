import { useEffect, useState } from "react";

export interface DashboardStats {
    summary: {
        stats: {
            prsReviewed: {
                total: number;
                thisWeek: number;
                change: number;
            };
            suggestionAccepted: {
                total: number;
                rate: number;
                change: number;
            };
            issuesDetected: {
                total: number;
                critical: number;
            };
        };
        issueDistribution: Array<{
            type: "SECURITY" | "STYLE" | "BUG" | "BEST_PRACTICE";
            count: number;
        }>;
        severityDistribution: Array<{
            severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
            count: number;
        }>;
        recentReviews: Array<{
            id: string;
            prNumber: number;
            title: string;
            repository: string;
            createdAt: string;
            acceptedCount: number;
            totalCount: number;
            acceptanceRate: number;
            severity: "low" | "medium" | "high" | "critical";
            status: "open" | "closed" | "merged";
            url: string;
        }>;
    };
}

export interface ReviewTimelineItem {
    date: string;
    count: number;
    suggestions: number;
}

export function useDashboard(days: number = 30) {
    const [data, setData] = useState<DashboardStats | null>(null);
    const [timeline, setTimeline] = useState<ReviewTimelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAll();
    }, [days]);

    const fetchAll = async () => {
        try {
            setLoading(true);

            const [dashboardRes, timelineRes] = await Promise.all([
                fetch("/api/dashboard/stats"),
                fetch(`/api/dashboard/timeline?days=${days}`),
            ]);

            if (!dashboardRes.ok) {
                throw new Error("Failed to fetch dashboard stats");
            }
            if (!timelineRes.ok) {
                throw new Error("Failed to fetch timeline data");
            }

            const dashboardData: DashboardStats = await dashboardRes.json();
            const { timeline }: { timeline: ReviewTimelineItem[] } =
                await timelineRes.json();

            setData(dashboardData);
            setTimeline(timeline);
            setError(null);
        } catch (err: any) {
            console.error("[Dashboard Page Hook] Error:", err);
            setError(err.message ?? "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    return {
        data,
        timeline,
        loading,
        error,
        refresh: fetchAll,
    };
}
