"use client"

import {
  DashboardSidebar,
  DashboardHeader,
} from "@/components/dashboard/DashboardLayout";
import {
  StatsCard,
  RecentReviews,
  IssueDistribution,
} from "@/components/dashboard/DashboardComponents";
import { GitPullRequest, Check, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useDashboard } from "@/hooks/useDashboard";

interface ReviewTimelineItem {
  date: string; count: number; suggestions: number
}

function getAvgSuggestions(timeline: ReviewTimelineItem[]): number {
  if (timeline.length === 0) return 0;

  const total = timeline.reduce(
    (sum, day) => sum + day.count,
    0
  );

  return Math.round(total / timeline.length);
}


function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="mb-2 h-8 w-16" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

function RecentReviewsSkeleton() {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function IssueDistributionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-36" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-8" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="destructive" className="mx-auto max-w-2xl">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Failed to load dashboard data</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-4">
          We couldn't fetch your dashboard data. Please check your connection and try again.
        </p>
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}

function DashboardLoading() {
  return (
    <>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <StatsCardSkeleton key={i} />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <RecentReviewsSkeleton />
        <IssueDistributionSkeleton />
      </div>
    </>
  );
}

export default function Dashboard() {
  const { data, timeline, loading, error, refresh } = useDashboard();

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="pl-64 transition-all duration-300">
          <DashboardHeader title="Dashboard" />
          <main className="p-6">
            <DashboardLoading />
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="pl-64 transition-all duration-300">
          <DashboardHeader title="Dashboard" />
          <main className="p-6">
            <DashboardError onRetry={refresh} />
          </main>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="pl-64 transition-all duration-300">
          <DashboardHeader title="Dashboard" />
          <main className="p-6">
            <div className="text-center py-12 text-muted-foreground">
              No dashboard data available
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { summary } = data;
  console.log(summary)
  console.log(timeline)

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <div className="pl-64 transition-all duration-300">
        <DashboardHeader title="Dashboard" />

        <main className="p-6">
          {/* Stats Grid */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="PRs Reviewed"
              value={summary.stats?.prsReviewed?.total.toLocaleString()}
              change={`+${summary.stats?.prsReviewed?.thisWeek} this week`}
              changeType="positive"
              icon={GitPullRequest}
            />

            <StatsCard
              title="Suggestions Accepted"
              value={`${Math.round(summary?.stats?.suggestionAccepted?.rate)}%`}
              change={`${summary?.stats?.suggestionAccepted?.change >= 0 ? "+" : ""}${summary?.stats?.suggestionAccepted?.change}%`}
              changeType={summary?.stats?.suggestionAccepted?.change >= 0 ? "positive" : "negative"}
              icon={Check}
            />

            <StatsCard
              title="Issues Detected"
              value={summary?.stats?.issuesDetected?.total.toLocaleString()}
              change={summary?.stats?.issuesDetected?.critical > 0 ? `${summary?.stats?.issuesDetected?.critical} critical` : ""}
              changeType={summary?.stats?.issuesDetected?.critical > 0 ? "negative" : "neutral"}
              icon={AlertTriangle}
            />

            <StatsCard
              title="Avg Review Time"
              value={getAvgSuggestions(timeline)}
              change="AI-powered"
              changeType="positive"
              icon={Clock}
            />
          </div>

          {/* Recent Reviews + Issue Distribution */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {summary?.recentReviews && summary?.recentReviews.length && (
                <RecentReviews reviews={summary.recentReviews} />
              )}
            </div>

            <div>
              {summary?.issueDistribution && summary?.issueDistribution.length && (
                <IssueDistribution
                  items={summary?.issueDistribution.map((item) => ({
                    name: item.type,
                    count: item.count,
                    color:
                      item.type.toLowerCase().includes("security") ? "hsl(0, 72%, 55%)" :
                        item.type.toLowerCase().includes("quality") ? "hsl(38, 92%, 50%)" :
                          item.type.toLowerCase().includes("performance") ? "hsl(190, 95%, 55%)" :
                            "hsl(142, 71%, 45%)",
                  }))}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}