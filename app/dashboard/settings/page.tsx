import {
  DashboardSidebar,
  DashboardHeader,
} from "@/components/dashboard/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Github, Key, Bell, Shield, Code } from "lucide-react";

const SettingsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <div className="pl-64 transition-all duration-300">
        <DashboardHeader title="Settings" />

        <main className="p-6">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="review">Review Preferences</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="api">API Keys</TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Github className="h-5 w-5" />
                    GitHub Connection
                  </CardTitle>
                  <CardDescription>
                    Manage your GitHub integration and account settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 font-semibold text-primary">
                        D
                      </div>
                      <div>
                        <p className="font-medium">developer_demo</p>
                        <p className="text-sm text-muted-foreground">
                          Connected via GitHub OAuth
                        </p>
                      </div>
                    </div>
                    <Button variant="outline">Reconnect</Button>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Account Preferences</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          defaultValue="demo@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select defaultValue="utc">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="utc">UTC</SelectItem>
                            <SelectItem value="pst">
                              Pacific Time (PST)
                            </SelectItem>
                            <SelectItem value="est">
                              Eastern Time (EST)
                            </SelectItem>
                            <SelectItem value="cet">
                              Central European (CET)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="hero">Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Review Preferences */}
            <TabsContent value="review">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Review Preferences
                  </CardTitle>
                  <CardDescription>
                    Customize how ReviewBot analyzes your code.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Detection Settings</h4>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Security Issues</p>
                        <p className="text-sm text-muted-foreground">
                          Detect potential security vulnerabilities
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Code Quality</p>
                        <p className="text-sm text-muted-foreground">
                          Check for code smells and anti-patterns
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Performance Suggestions</p>
                        <p className="text-sm text-muted-foreground">
                          Identify potential performance issues
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Console.log Detection</p>
                        <p className="text-sm text-muted-foreground">
                          Flag leftover console statements
                        </p>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">TODO Comments</p>
                        <p className="text-sm text-muted-foreground">
                          Highlight TODO and FIXME comments
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Severity Thresholds</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Minimum Severity to Report</Label>
                        <Select defaultValue="low">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="critical">
                              Critical Only
                            </SelectItem>
                            <SelectItem value="high">High & Above</SelectItem>
                            <SelectItem value="medium">
                              Medium & Above
                            </SelectItem>
                            <SelectItem value="low">All Issues</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Comment Style</Label>
                        <Select defaultValue="detailed">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="brief">Brief</SelectItem>
                            <SelectItem value="detailed">Detailed</SelectItem>
                            <SelectItem value="verbose">
                              Verbose with Examples
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="hero">Save Preferences</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                  <CardDescription>
                    Configure when and how you receive notifications.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Receive email summaries of reviews
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Critical Issues Alert</p>
                        <p className="text-sm text-muted-foreground">
                          Immediate notification for critical security issues
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Weekly Digest</p>
                        <p className="text-sm text-muted-foreground">
                          Weekly summary of all reviews and metrics
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="hero">Save Notifications</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Keys */}
            <TabsContent value="api">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Keys
                  </CardTitle>
                  <CardDescription>
                    Manage API keys for external integrations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Secure Key Storage</p>
                        <p className="text-sm text-muted-foreground">
                          API keys are encrypted and stored securely. They are
                          never exposed in logs or responses.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>OpenAI API Key (Optional)</Label>
                      <Input
                        type="password"
                        placeholder="sk-..."
                        defaultValue=""
                      />
                      <p className="text-xs text-muted-foreground">
                        Use your own API key for increased rate limits
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Anthropic API Key (Optional)</Label>
                      <Input
                        type="password"
                        placeholder="sk-ant-..."
                        defaultValue=""
                      />
                      <p className="text-xs text-muted-foreground">
                        Use Claude for code analysis instead of GPT
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="hero">Save API Keys</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
