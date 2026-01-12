"use client"

import {
  DashboardSidebar,
  DashboardHeader,
} from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderGit, RefreshCw, Trash2, Loader2 } from "lucide-react";
import { useEffect, useCallback, useState } from "react";
import { AddRepositoryModal } from "@/components/repositories/AddRepositoryModal";
import { WebhookManagement } from "@/components/repositories/WebhookManagement";
import { Repository } from "@/types";
import { toast } from "sonner";

const Repositories = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch repositories from the database
  const fetchRepositories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/repositories/database?isActive=true`);
      if (!response.ok) throw new Error("Failed to fetch repositories");

      const data = await response.json();
      setRepositories(data.map((repo: Repository) => {
        return {
          ...repo,
          isSyncing: false,
        }
      }));
    } catch (error) {
      console.error("Error fetching repositories:", error);
      toast.error("Failed to load repositories. Please try again.")
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Initial fetch
  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  // Handle webhook updates - update specific repository in state
  const handleWebhookUpdate = useCallback((
    repositoryId: string,
    webhookData: {
      id: string | null;
      url: string;
      events: string[];
      secret: string;
      isActive: boolean;
    }
  ) => {
    setRepositories(prev =>
      prev.map(repo =>
        repo.repoId === repositoryId
          ? {
            ...repo,
            webhookId: webhookData.id,
            isActive: webhookData.isActive
          }
          : repo
      )
    );
  }, []);

  // Handle webhook deletion - remove webhook from repository
  const handleWebhookDelete = useCallback((repositoryId: string) => {
    setRepositories(prev =>
      prev.map(repo =>
        repo.repoId === repositoryId
          ? {
            ...repo,
            webhookId: null,
            isActive: false
          }
          : repo
      )
    );
  }, []);

  // Sync repositories from GitHub
  const handleSyncRepositories = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/repositories/github');
      if (!response.ok) throw new Error('Failed to sync repositories');

      const data = await response.json();

      toast.success(`Synced ${data.stats?.total || 0} repositories from GitHub.`)
      await fetchRepositories();
    } catch (error) {
      console.error('Error syncing repositories:', error);
      toast.error("Failed to sync repositories. Please try again.")
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete repository
  const handleDeleteRepository = async (repositoryId: string) => {
    try {
      const response = await fetch('/api/repositories/database', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoIds: [repositoryId],
          isActive: false,
        }),
      });

      if (!response.ok) throw new Error('Failed to delete repository');

      toast.success("Repository removed from dashboard.")

      // Remove repository from state
      setRepositories(prev => prev.filter(repo => repo.id !== repositoryId));
    } catch (error) {
      console.error('Error deleting repository:', error);
      toast.error("Failed to delete repository. Please try again.")
    }
  };

  // Refresh single repository
  const handleRefreshRepository = async (repositoryId: string) => {
    try {
      setRepositories((prev) =>
        prev.map((repo) =>
          repo.id === repositoryId ? { ...repo, isSyncing: true } : repo
        )
      );

      const response = await fetch(`/api/repositories/database/${repositoryId}`);
      if (!response.ok) throw new Error('Failed to refresh repository');

      const updatedRepo = await response.json();

      setRepositories(prev =>
        prev.map(repo => repo.id === repositoryId ? { ...updatedRepo, isSyncing: false } : repo)
      );

      toast.success("Repository data refreshed.")
    } catch (error) {
      console.error('Error refreshing repository:', error);
      toast.error("Failed to refresh repository.")
    }
  };

  // Handle adding repositories
  const handleAddRepositories = useCallback(async () => {
    // Refetch all repositories after adding new ones
    await fetchRepositories();
  }, [fetchRepositories]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <div className="pl-64 transition-all duration-300">
        <DashboardHeader title="Repositories" />

        <main className="p-6">
          {/* Info Card */}
          <Card variant="gradient" className="mb-6 border-primary/20">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <FolderGit className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  Connect repositories to enable AI-powered code reviews
                </p>
                <p className="text-sm text-muted-foreground">
                  ReviewBot will automatically analyze every PR opened in
                  connected repositories.
                </p>
              </div>
              <Button
                variant="heroOutline"
                onClick={handleSyncRepositories}
                disabled={isSyncing}
                className="gap-2"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Sync Repositories
                  </>
                )}
              </Button>
              <Button
                variant="hero"
                onClick={() => setIsAddModalOpen(true)}
              >
                Add Repository
              </Button>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && repositories.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && repositories.length === 0 && (
            <Card variant="elevated" className="py-12">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <FolderGit className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No repositories connected</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your first repository to start receiving AI-powered code reviews
                </p>
                <Button
                  variant="hero"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  Add Repository
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Repositories Grid */}
          {repositories.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {repositories.map((repo, index) => (
                <Card
                  key={`${repo.id}-${index}`}
                  variant="elevated"
                  className={
                    repo.isActive
                      ? "border-primary/30"
                      : "border-border/30 opacity-75"
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <FolderGit className="h-4 w-4 text-primary" />
                          {repo.fullName}
                        </CardTitle>
                        <div className="mt-2 flex items-center space-x-4 text-sm">
                          <div className="flex items-center">
                            <span className="text-muted-foreground">
                              PRs reviewed:{" "}
                              <span className="font-medium text-foreground">
                                {repo.prsReviewed.toString()}
                              </span>
                            </span>
                          </div>
                          {repo.lastReviewed && (
                            <div className="flex items-center">
                              <span className="text-muted-foreground">
                                Last review:{" "}
                                <span className="font-medium text-foreground">
                                  {new Date(repo.lastReviewed).toDateString()}
                                </span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRefreshRepository(repo.repoId)}
                        >
                          {repo.isSyncing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDeleteRepository(repo.repoId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <WebhookManagement
                      repositoryId={repo.repoId}
                      repositoryOwner={repo.owner}
                      repositoryName={repo.name}
                      webhookId={repo.webhookId}
                      isActive={repo.isActive}
                      onWebhookUpdate={handleWebhookUpdate}
                      onWebhookDelete={handleWebhookDelete}
                    />
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </main>

        {/* Add Repository Modal */}
        <AddRepositoryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddRepositories={handleAddRepositories}
        />
      </div>
    </div>
  );
};

export default Repositories;