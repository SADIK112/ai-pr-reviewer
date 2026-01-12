import {
  DashboardSidebar,
  DashboardHeader,
} from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
} from "lucide-react";

const mockReviewDetails = [
  {
    id: "1",
    prNumber: 142,
    title: "Add user authentication with OAuth",
    repository: "acme/web-app",
    author: "john_dev",
    branch: "feature/oauth-auth",
    createdAt: "2 hours ago",
    status: "completed",
    complexity: "high",
    estimatedTime: "45 min",
    filesChanged: 12,
    additions: 487,
    deletions: 23,
    suggestions: [
      {
        id: "s1",
        type: "security",
        severity: "critical",
        title: "Potential SQL Injection",
        file: "src/api/users.ts",
        line: 42,
        accepted: true,
      },
      {
        id: "s2",
        type: "quality",
        severity: "medium",
        title: "Missing error handling",
        file: "src/services/auth.ts",
        line: 78,
        accepted: true,
      },
      {
        id: "s3",
        type: "performance",
        severity: "low",
        title: "Consider using useMemo",
        file: "src/components/UserList.tsx",
        line: 15,
        accepted: false,
      },
    ],
  },
  {
    id: "2",
    prNumber: 139,
    title: "Fix responsive layout issues",
    repository: "acme/web-app",
    author: "sarah_design",
    branch: "fix/responsive",
    createdAt: "5 hours ago",
    status: "completed",
    complexity: "low",
    estimatedTime: "10 min",
    filesChanged: 4,
    additions: 56,
    deletions: 32,
    suggestions: [
      {
        id: "s4",
        type: "quality",
        severity: "low",
        title: "Use Tailwind responsive prefixes",
        file: "src/components/Header.tsx",
        line: 22,
        accepted: true,
      },
    ],
  },
];

const Reviews = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <div className="pl-64 transition-all duration-300">
        <DashboardHeader title="Review History" />

        <main className="p-6">
          {/* Filters */}
          <Card variant="elevated" className="mb-6">
            <CardContent className="flex flex-wrap items-center gap-4 p-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  className="pl-10"
                />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Repository" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Repositories</SelectItem>
                  <SelectItem value="web-app">acme/web-app</SelectItem>
                  <SelectItem value="api-server">acme/api-server</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Reviews List */}
          <div className="space-y-4">
            {mockReviewDetails.map((review) => (
              <Card
                key={review.id}
                variant="elevated"
                className="transition-all hover:border-primary/30"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-mono text-sm text-primary">
                          #{review.prNumber}
                        </span>
                        <Badge
                          variant={
                            review.status === "completed" ? "success" : "warning"
                          }
                        >
                          {review.status}
                        </Badge>
                        <Badge
                          variant={
                            review.complexity === "high"
                              ? "critical"
                              : review.complexity === "medium"
                              ? "warning"
                              : "success"
                          }
                        >
                          {review.complexity} complexity
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{review.title}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {review.repository} • {review.branch} • by @
                        {review.author}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      View Details
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex gap-6 text-sm">
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {review.filesChanged}
                      </span>{" "}
                      files
                    </span>
                    <span className="text-success">
                      +{review.additions} additions
                    </span>
                    <span className="text-critical">
                      -{review.deletions} deletions
                    </span>
                    <span className="text-muted-foreground">
                      Est.{" "}
                      <span className="font-medium text-foreground">
                        {review.estimatedTime}
                      </span>{" "}
                      review
                    </span>
                  </div>

                  {/* Suggestions Preview */}
                  <div className="space-y-2">
                    {review.suggestions.slice(0, 3).map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              suggestion.severity === "critical"
                                ? "critical"
                                : suggestion.severity === "medium"
                                ? "warning"
                                : "muted"
                            }
                            className="text-[10px]"
                          >
                            {suggestion.severity}
                          </Badge>
                          <span className="text-sm">{suggestion.title}</span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {suggestion.file}:{suggestion.line}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {suggestion.accepted ? (
                            <ThumbsUp className="h-4 w-4 text-success" />
                          ) : (
                            <ThumbsDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reviews;
