'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, ExternalLink } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Repository } from '@/types';
import { debounce } from '@/lib/utils/common';
import { toast } from "sonner"

interface AddRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRepositories: () => Promise<void>;
}

export function AddRepositoryModal({
  isOpen,
  onClose,
  onAddRepositories
}: AddRepositoryModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());

  // Debounced fetch function
  const debouncedFetch = useMemo(
    () => debounce(async (search: string) => {
      await fetchRepositories(search);
    }, 300),
    []
  );

  // Fetch repositories based on search term
  const fetchRepositories = async (search: string) => {
    setIsLoading(true);
    try {
      const url = search
        ? `/api/repositories/database?query=${encodeURIComponent(search)}`
        : `/api/repositories/database`;

      const response = await fetch(url);

      if (!response.ok) throw new Error('Failed to get repositories');

      const data = await response.json();
      setRepositories(data);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      toast.error('Failed to load repositories. Please try again.')
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to handle modal open/close and search
  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setSearchTerm("");
      setSelectedRepos(new Set());
      setRepositories([]);
      debouncedFetch.cancel();
      return;
    }

    // Fetch repositories when modal opens or search changes
    debouncedFetch(searchTerm);
  }, [isOpen, searchTerm, debouncedFetch]);

  // Toggle repository selection
  const toggleRepoSelection = (repo: Repository) => {
    setSelectedRepos(prev => {
      const newSelected = new Set(prev);
      const repoId = repo.repoId;

      if (newSelected.has(repoId)) {
        newSelected.delete(repoId);
      } else {
        newSelected.add(repoId);
      }

      return newSelected;
    });
  };

  // Handle adding selected repositories
  const handleAddRepositories = async () => {
    if (selectedRepos.size === 0) return;

    setIsAdding(true);
    try {
      const response = await fetch('/api/repositories/database', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoIds: Array.from(selectedRepos),
          isActive: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to add repositories');

      const result = await response.json();

      if (result?.success) {
        toast.success(`${selectedRepos.size} ${selectedRepos.size === 1 ? 'repository' : 'repositories'} added to your dashboard.`)

        // Call parent callback to refresh the repositories list
        await onAddRepositories();

        // Close modal
        onClose();
      }
    } catch (error) {
      console.error('Error adding repositories:', error);
      toast.error('Failed to add repositories. Please try again.')
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Repositories</DialogTitle>
          <DialogDescription>
            Select repositories to add to your dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6 mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : repositories.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {searchTerm ? 'No repositories match your search.' : 'No repositories found.'}
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {repositories.map((repo) => (
                <div
                  key={repo.id}
                  className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${selectedRepos.has(repo.repoId)
                    ? 'bg-primary/5 border-primary/30'
                    : 'hover:bg-muted/50 border-transparent'
                    }`}
                  onClick={() => toggleRepoSelection(repo)}
                >
                  <Checkbox
                    id={`repo-${repo.id}`}
                    checked={selectedRepos.has(repo.repoId)}
                    onCheckedChange={() => toggleRepoSelection(repo)}
                    className="h-5 w-5"
                    onClick={(e) => e.stopPropagation()}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{repo.name}</span>
                      {repo.isPrivate && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                          Private
                        </span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {repo.description}
                      </p>
                    )}
                  </div>

                  <a
                    href={repo.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedRepos.size} {selectedRepos.size === 1 ? 'repository' : 'repositories'} selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isAdding}>
              Cancel
            </Button>
            <Button
              onClick={handleAddRepositories}
              disabled={selectedRepos.size === 0 || isAdding}
            >
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Selected'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}