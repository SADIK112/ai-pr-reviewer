'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, AlertCircle, CheckCircle2, Trash2, Plus, Webhook } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import crypto from "crypto";
import { toast } from "sonner"

interface WebhookManagementProps {
  repositoryId: string;
  repositoryOwner: string;
  repositoryName: string;
  webhookId: string | null;
  isActive: boolean;
  onWebhookUpdate: (
    repositoryId: string,
    data: {
      id: string | null;
      url: string;
      events: string[];
      secret: string;
      isActive: boolean;
    }
  ) => void;
  onWebhookDelete: (repositoryId: string) => void;
}

interface WebhookFormData {
  url: string;
  secret: string;
  events: string[];
}

const DEFAULT_WEBHOOK_URL = 'https://your-webhook-endpoint.com/api/webhook';
const DEFAULT_EVENTS = ['push', 'pull_request'];
const AVAILABLE_EVENTS = ['push', 'pull_request', 'issues', 'issue_comment'];

function generateRandomSecret(length = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

export function WebhookManagement({
  repositoryId,
  repositoryOwner,
  repositoryName,
  webhookId,
  isActive,
  onWebhookUpdate,
  onWebhookDelete,
}: WebhookManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState<WebhookFormData>({
    url: DEFAULT_WEBHOOK_URL,
    secret: generateRandomSecret(),
    events: DEFAULT_EVENTS,
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!showConfigDialog) {
      setFormData({
        url: DEFAULT_WEBHOOK_URL,
        secret: generateRandomSecret(),
        events: DEFAULT_EVENTS,
      });
    }
  }, [showConfigDialog]);

  // Handle toggle switch
  const handleToggleWebhook = async (checked: boolean) => {
    if (!webhookId) {
      // No webhook exists, open dialog to create one
      setShowConfigDialog(true);
      return;
    }

    // Webhook exists, toggle its active state
    await saveWebhook(checked);
  };

  // Save or update webhook
  const saveWebhook = async (active: boolean) => {
    setIsLoading(true);
    try {
      const payload = {
        repositoryId,
        repositoryOwner,
        repositoryName,
        webhookId: webhookId,
        webhookUrl: formData.url,
        webhookSecret: formData.secret,
        active,
        events: formData.events,
      };

      const response = await fetch(`/api/repositories/${repositoryId}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save webhook');
      }

      const result = await response.json();

      if (result?.success) {
        const newWebhookId = result?.repository?.webhookId || webhookId;

        toast.success(
          webhookId
            ? 'Webhook updated successfully'
            : 'Webhook created successfully',
        )

        // Update parent component immediately
        onWebhookUpdate(repositoryId, {
          id: newWebhookId,
          url: formData.url,
          events: formData.events,
          secret: formData.secret,
          isActive: active
        });

        setShowConfigDialog(false);
      }
    } catch (error) {
      console.error('Error saving webhook:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save webhook. Please try again.',)
    } finally {
      setIsLoading(false);
    }
  };

  // Delete webhook
  const deleteWebhook = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/repositories/${webhookId}/webhook`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete webhook');
      }

      toast.success('Webhook deleted successfully')

      // Update parent component immediately
      onWebhookDelete(repositoryId);

      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete webhook. Please try again.',)
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle event selection
  const toggleEvent = (event: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  // Regenerate secret
  const handleRegenerateSecret = () => {
    const newSecret = generateRandomSecret();
    setFormData(prev => ({ ...prev, secret: newSecret }));
    toast.info('A new webhook secret has been generated.')
  };

  // Copy secret to clipboard
  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(formData.secret);
      toast.info('Webhook secret copied to clipboard.')
    } catch (error) {
      toast.error('Could not copy to clipboard.')
    }
  };

  // Determine if form is valid
  const isFormValid = formData.url.trim() !== '' && formData.events.length > 0;

  return (
    <div className="mt-4 pt-4 border-t">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-medium">Webhook Configuration</h4>
          <div className="flex items-center text-xs text-muted-foreground">
            {webhookId ? (
              <>
                {isActive ? (
                  <span className="flex items-center text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center text-amber-600">
                    <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                    Inactive
                  </span>
                )}
                <span className="mx-2">•</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setShowConfigDialog(true)}
                        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                        disabled={isLoading}
                      >
                        <Webhook className="h-3.5 w-3.5 mr-1" />
                        Configure
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Update webhook settings</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <span className="mx-2">•</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setShowDeleteDialog(true)}
                        className="flex items-center text-destructive hover:text-destructive/80 transition-colors"
                        disabled={isLoading}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete webhook</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            ) : (
              <button
                onClick={() => setShowConfigDialog(true)}
                className="inline-flex items-center text-sm text-primary hover:underline"
                disabled={isLoading}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Webhook
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id={`webhook-${repositoryId}`}
            checked={webhookId ? isActive : false}
            onCheckedChange={handleToggleWebhook}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Webhook Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {webhookId ? 'Configure Webhook' : 'Add Webhook'}
            </DialogTitle>
            <DialogDescription>
              Set up a webhook to receive real-time updates for this repository.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://your-webhook-endpoint.com/api/webhook"
              />
            </div>

            <div className="space-y-2">
              <Label>Events</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_EVENTS.map((event) => (
                  <Button
                    key={event}
                    variant={formData.events.includes(event) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleEvent(event)}
                    className="capitalize"
                    type="button"
                  >
                    {event.replace(/_/g, ' ')}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="webhook-secret">Secret</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerateSecret}
                  className="h-8"
                  type="button"
                >
                  Regenerate
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="webhook-secret"
                  value={formData.secret}
                  readOnly
                  className="font-mono pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9 w-9"
                  onClick={handleCopySecret}
                  type="button"
                >
                  <span className="sr-only">Copy to clipboard</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use this secret to verify webhook payloads
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfigDialog(false)}
              disabled={isLoading}
              type="button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => saveWebhook(true)}
              disabled={isLoading || !isFormValid}
              type="button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {webhookId ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                webhookId ? 'Save Changes' : 'Create Webhook'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Webhook</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this webhook? This will stop all automatic updates for this repository.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isLoading}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteWebhook}
              disabled={isLoading}
              type="button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Webhook'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}