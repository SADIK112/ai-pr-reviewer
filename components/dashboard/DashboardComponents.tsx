import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
}

export function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
}: StatsCardProps) {
  const changeColors = {
    positive: "text-success",
    negative: "text-critical",
    neutral: "text-muted-foreground",
  };

  return (
    <Card variant="elevated" className="hover:border-primary/30">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {change && (
          <p className={`mt-1 text-sm ${changeColors[changeType]}`}>
            {changeType === "positive" && "↑ "}
            {changeType === "negative" && "↓ "}
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export interface Review {
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
}

interface RecentReviewsProps {
  reviews: Review[];
}

export function RecentReviews({ reviews }: RecentReviewsProps) {
  const statusVariant = {
    closed: "success" as const,
    open: "warning" as const,
    merged: "critical" as const,
  };

  const complexityVariant = {
    low: "success" as const,
    medium: "warning" as const,
    high: "critical" as const,
    critical: "critical" as const,
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="text-lg">Recent Reviews</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex items-center justify-between p-4 transition-colors hover:bg-muted/30"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-primary">
                    #{review.prNumber}
                  </span>
                  <h4 className="truncate font-medium">{review.title}</h4>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {review.repository} • {review.createdAt}
                </p>
              </div>

              <div className="ml-4 flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm">
                    {review.acceptedCount}/{review.totalCount}
                  </p>
                  <p className="text-xs text-muted-foreground">accepted</p>
                </div>
                <Badge variant={complexityVariant[review.severity]}>
                  {review.severity}
                </Badge>
                <Badge variant={statusVariant[review.status]}>
                  {review.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface IssueDistributionItem {
  name: string;
  count: number;
  color: string;
}

interface IssueDistributionProps {
  items: IssueDistributionItem[];
}

export function IssueDistribution({ items }: IssueDistributionProps) {
  const total = items.reduce((acc, item) => acc + item.count, 0);

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="text-lg">Issue Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.name}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>{item.name}</span>
                <span className="font-mono text-muted-foreground">
                  {item.count}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(item.count / total) * 100}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
