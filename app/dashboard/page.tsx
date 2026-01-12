import {
  DashboardSidebar,
  DashboardHeader,
} from "@/components/dashboard/DashboardLayout";
import {
  StatsCard,
  RecentReviews,
  IssueDistribution,
  Review,
} from "@/components/dashboard/DashboardComponents";
import { GitPullRequest, Check, AlertTriangle, Clock } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect, RedirectType } from "next/navigation";

// Mock data for demonstration
const mockReviews: Review[] = [
  {
    id: "1",
    prNumber: 142,
    title: "Add user authentication with OAuth",
    repository: "acme/web-app",
    status: "completed",
    suggestionsCount: 8,
    acceptedCount: 6,
    complexity: "high",
    createdAt: "2 hours ago",
  },
  {
    id: "2",
    prNumber: 139,
    title: "Fix responsive layout issues",
    repository: "acme/web-app",
    status: "completed",
    suggestionsCount: 3,
    acceptedCount: 3,
    complexity: "low",
    createdAt: "5 hours ago",
  },
  {
    id: "3",
    prNumber: 137,
    title: "Implement payment processing",
    repository: "acme/api-server",
    status: "pending",
    suggestionsCount: 12,
    acceptedCount: 4,
    complexity: "high",
    createdAt: "1 day ago",
  },
  {
    id: "4",
    prNumber: 135,
    title: "Update dependencies",
    repository: "acme/web-app",
    status: "completed",
    suggestionsCount: 2,
    acceptedCount: 2,
    complexity: "low",
    createdAt: "2 days ago",
  },
  {
    id: "5",
    prNumber: 133,
    title: "Add unit tests for utils",
    repository: "acme/api-server",
    status: "completed",
    suggestionsCount: 5,
    acceptedCount: 4,
    complexity: "medium",
    createdAt: "3 days ago",
  },
];

const issueData = [
  { name: "Security Issues", count: 23, color: "hsl(0, 72%, 55%)" },
  { name: "Code Quality", count: 45, color: "hsl(38, 92%, 50%)" },
  { name: "Performance", count: 18, color: "hsl(190, 95%, 55%)" },
  { name: "Best Practices", count: 67, color: "hsl(142, 71%, 45%)" },
];

const Dashboard = async () => {
  const session = await getServerSession(authOptions);
  console.log({ session })
  if (!session) return redirect("/login", RedirectType.push)

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
              value="127"
              change="12 this week"
              changeType="positive"
              icon={GitPullRequest}
            />
            <StatsCard
              title="Suggestions Accepted"
              value="73%"
              change="+5% from last month"
              changeType="positive"
              icon={Check}
            />
            <StatsCard
              title="Issues Detected"
              value="153"
              change="23 critical"
              changeType="negative"
              icon={AlertTriangle}
            />
            <StatsCard
              title="Avg Review Time"
              value="24s"
              change="2.3x faster than manual"
              changeType="positive"
              icon={Clock}
            />
          </div>

          {/* Charts and Recent Reviews */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RecentReviews reviews={mockReviews} />
            </div>
            <div>
              <IssueDistribution items={issueData} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
