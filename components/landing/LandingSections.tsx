"use client"

import { Button } from "@/components/ui/button";
import { Github, Zap, Brain, Shield, TrendingUp, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { redirect, RedirectType } from "next/navigation";

export function Navbar() {
  const { data: session } = useSession()
  console.log({ session })

  const handleSignOut = () => {
    signOut();
    redirect("/", RedirectType.push)
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">ReviewBot</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/#features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            How it Works
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/20 text-xs text-primary">
                      {session?.user?.name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">{session?.user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-critical">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button variant="hero" size="sm" asChild>
                <Link href="/dashboard" className="flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  Get Started
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export function HeroSection() {
  const { data: session } = useSession()
  console.log({ session })

  return (
    <section className="relative min-h-screen overflow-hidden pt-16">
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-glow opacity-50" />
      <div className="absolute top-1/3 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

      <div className="container relative mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
        <div className="animate-fade-in-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <Brain className="h-4 w-4" />
            AI-Powered Code Reviews
          </div>

          <h1 className="mb-6 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Code Reviews That{" "}
            <span className="text-gradient">Learn From You</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            An intelligent PR assistant that analyzes your GitHub pull requests,
            learns your coding style, and provides personalized feedback that
            gets smarter over time.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {session ? (
              <Button variant="hero" size="xl" asChild>
                <Link href="/dashboard" className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Go to Dashboard
                </Link>
              </Button>
            ) : (
              <Button variant="hero" size="xl" asChild>
                <Link href="/login" className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  Connect GitHub
                </Link>
              </Button>
            )}
            <Button variant="heroOutline" size="xl" asChild>
              <Link href="/#how-it-works">See How It Works</Link>
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-success" />
              <span>Security-first analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Learns your preferences</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-warning" />
              <span>Instant feedback</span>
            </div>
          </div>
        </div>

        {/* Code preview mockup */}
        <div className="mt-16 w-full max-w-4xl animate-fade-in">
          <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-elevated">
            <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-critical/60" />
              <div className="h-3 w-3 rounded-full bg-warning/60" />
              <div className="h-3 w-3 rounded-full bg-success/60" />
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                PR #142: Add user authentication
              </span>
            </div>
            <div className="p-6">
              <div className="space-y-4 font-mono text-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-critical/20">
                    <span className="text-xs text-critical">!</span>
                  </div>
                  <div>
                    <p className="font-semibold text-critical">
                      Potential SQL Injection
                    </p>
                    <p className="text-muted-foreground">
                      Line 42: User input is not sanitized before query
                      execution
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-warning/20">
                    <span className="text-xs text-warning">⚡</span>
                  </div>
                  <div>
                    <p className="font-semibold text-warning">
                      Missing Error Handling
                    </p>
                    <p className="text-muted-foreground">
                      Async operation lacks try-catch block
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-success/20">
                    <span className="text-xs text-success">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-success">
                      Good: Type Safety
                    </p>
                    <p className="text-muted-foreground">
                      Proper TypeScript interfaces defined
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: "Personalized Learning",
      description:
        "The AI learns from your code patterns and past reviews to give you increasingly relevant suggestions tailored to your style.",
    },
    {
      icon: Shield,
      title: "Security Analysis",
      description:
        "Automatically detects hardcoded secrets, SQL injection risks, XSS vulnerabilities, and other security issues before they reach production.",
    },
    {
      icon: Zap,
      title: "Instant Feedback",
      description:
        "Get AI-powered code review comments directly on your PRs within seconds, not hours. Never wait for reviewers again.",
    },
    {
      icon: TrendingUp,
      title: "Track Improvements",
      description:
        "Monitor your code quality trends over time with detailed metrics on accepted suggestions and common issues.",
    },
  ];

  return (
    <section id="features" className="py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Everything You Need for{" "}
            <span className="text-gradient">Smarter Reviews</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Powered by advanced AI models that understand code context and learn
            from your preferences to deliver increasingly accurate suggestions.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border/50 bg-card p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-glow"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Connect Your Repository",
      description:
        "Authorize ReviewBot with your GitHub account and select the repositories you want to monitor.",
    },
    {
      number: "02",
      title: "Open a Pull Request",
      description:
        "Create or update a PR as you normally would. ReviewBot automatically triggers on PR events.",
    },
    {
      number: "03",
      title: "Get AI-Powered Feedback",
      description:
        "Within seconds, receive detailed code review comments with severity levels and suggested fixes.",
    },
    {
      number: "04",
      title: "Learn & Improve",
      description:
        "Accept or dismiss suggestions. ReviewBot learns from your feedback to improve future reviews.",
    },
  ];

  return (
    <section id="how-it-works" className="border-t border-border/50 py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Get started in minutes with a simple four-step process that
            integrates seamlessly with your existing workflow.
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative flex gap-6 pb-12 last:pb-0"
            >
              {/* Line connector */}
              {index < steps.length - 1 && (
                <div className="absolute left-6 top-12 h-[calc(100%-3rem)] w-px bg-gradient-to-b from-primary/50 to-primary/10" />
              )}

              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-primary font-mono text-sm font-bold text-primary-foreground">
                {step.number}
              </div>

              <div className="pt-2">
                <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTASection() {
  return (
    <section className="border-t border-border/50 py-24">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-card p-12 text-center shadow-glow">
          <div className="absolute inset-0 bg-glow opacity-30" />
          <div className="relative">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Ready to Ship Better Code?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
              Join thousands of developers who are already using AI-powered
              reviews to ship faster and with more confidence.
            </p>
            <Button variant="hero" size="xl" asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                Start Free with GitHub
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">ReviewBot</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 ReviewBot. AI-Powered Code Reviews.
          </p>
        </div>
      </div>
    </footer>
  );
}