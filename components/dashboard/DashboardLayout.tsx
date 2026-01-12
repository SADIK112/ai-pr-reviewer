"use client"

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  GitPullRequest,
  FolderGit,
  Settings,
  Zap,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/reviews", label: "Reviews", icon: GitPullRequest },
  { href: "/dashboard/repositories", label: "Repositories", icon: FolderGit },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  // const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const pathName = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border/50 bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border/50 px-4">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 transition-opacity",
            collapsed && "opacity-0"
          )}
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-primary">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold">ReviewBot</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathName == item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon
                className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")}
              />
              <span
                className={cn(
                  "transition-opacity",
                  collapsed && "opacity-0 w-0 overflow-hidden"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border/50 p-3">
        <div
          className={cn(
            "mb-3 flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2",
            collapsed && "justify-center px-2"
          )}
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 font-semibold text-primary">
            D
          </div>
          <div
            className={cn(
              "min-w-0 transition-opacity",
              collapsed && "hidden"
            )}
          >
            <p className="truncate text-sm font-medium">Developer</p>
            <p className="truncate text-xs text-muted-foreground">
              SADIKUR
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          className={cn("w-full justify-start gap-3", collapsed && "justify-center")}
          asChild
        >
          <Link href="/">
            <LogOut className="h-4 w-4" />
            <span className={cn(collapsed && "hidden")}>Sign Out</span>
          </Link>
        </Button>
      </div>
    </aside>
  );
}

export function DashboardHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-6 backdrop-blur-md">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          View Docs
        </Button>
        <Button variant="hero" size="sm">
          New Repository
        </Button>
      </div>
    </header>
  );
}
