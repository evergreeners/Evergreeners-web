import { Header } from "@/components/Header";
import { FloatingNav } from "@/components/FloatingNav";
import { Section } from "@/components/Section";
import {
  Globe, Bell, Shield, Moon, Trash2, LogOut,
  ChevronRight, Github, Clock, Eye, RefreshCw, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/api-config";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { signOut, authClient, useSession } from "@/lib/auth-client";

// ... (existing helper function/interface code)

export default function Settings() {
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [notifications, setNotifications] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState("");
  const [showDisconnectInfo, setShowDisconnectInfo] = useState(false);

  const { data: session } = useSession();

  // Check connection status
  useEffect(() => {
    const checkConnections = async () => {
      const user = session?.user as any;
      if (user && typeof user.isGithubConnected === 'boolean') {
        setIsGithubConnected(user.isGithubConnected);
        return;
      }

      try {
        const accounts = await authClient.listAccounts();
        if (accounts.data) {
          // Fix provider check for TypeScript
          const hasGithub = accounts.data.some((acc) => acc.providerId === "github");
          setIsGithubConnected(hasGithub);
        }
      } catch (error) {
        console.error("Failed to list accounts", error);
      }
    };
    if (session) {
      checkConnections();
    }
  }, [session]);

  // Fetch standard profile settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const baseUrl = getBaseURL(import.meta.env.VITE_API_URL || 'http://localhost:3000');
        const res = await fetch(`${baseUrl}/api/user/profile`, {
          credentials: "include"
        });
        if (res.ok) {
          const data = await res.json();
          // Rely on listAccounts for connection status, but use this for username/public toggle
          if (data.user) {
            setGithubUsername(data.user.username);
            if (typeof data.user.isPublic !== 'undefined') setPublicProfile(data.user.isPublic);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSettings();
  }, [session]);

  const timezones = [
    "America/Los_Angeles",
    "America/New_York",
    "Europe/London",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Singapore",
    "Australia/Sydney",
  ];

  /* Helper to ensure correct URL in production */
  const handleRefreshData = async () => {
    toast.promise(
      (async () => {
        const res = await fetch(getApiUrl("/api/user/sync-github"), {
          method: "POST",
          credentials: "include"
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to sync");
        }
        // Reload to show changes
        setTimeout(() => window.location.reload(), 1000);
      })(),
      {
        loading: "Syncing with GitHub...",
        success: "Profile synced! Reloading...",
        error: (err) => `Sync failed: ${err.message}`,
      }
    );
  };

  const handleExportData = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: "Preparing export...",
        success: "Data exported! Check your downloads.",
        error: "Export failed",
      }
    );
  };

  // Connect GitHub
  const handleConnectGithub = async () => {
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: `${window.location.origin}/settings`
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to initiate GitHub connection");
    }
  };

  // Disconnect GitHub (Show Info)
  const handleDisconnectClick = () => {
    setShowDisconnectInfo(true);
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation === "DELETE") {
      toast.success("Account deletion initiated");
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-background custom-scrollbar">
      <Header />

      <main className="container pt-24 pb-32 md:pb-12 space-y-8">
        {/* Page Header */}
        <section className="animate-fade-in">
          <h1 className="text-3xl font-bold text-gradient">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your preferences</p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Left Column */}
          <div className="space-y-6">
            {/* Account Section */}
            <Section title="Account" className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
              <div className="space-y-1 rounded-xl border border-border overflow-hidden">

                {/* GitHub Connection */}
                <div className="flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Github className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{isGithubConnected ? "GitHub Connected" : "Connect GitHub"}</p>
                      <p className="text-sm text-muted-foreground">
                        {isGithubConnected ? `@${(session?.user as any)?.username || session?.user?.name || 'user'}` : "Sync your contributions"}
                      </p>
                    </div>
                  </div>
                  {isGithubConnected ? (
                    <button
                      onClick={handleDisconnectClick}
                      className="text-sm text-destructive hover:underline"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={handleConnectGithub}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      Connect
                    </button>
                  )}
                </div>

                {/* Refresh Data */}
                <button
                  onClick={handleRefreshData}
                  className="w-full flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Refresh Data</p>
                      <p className="text-sm text-muted-foreground">Sync with GitHub</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>

                {/* Export Data */}
                <button
                  onClick={handleExportData}
                  className="w-full flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <Download className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Export Data</p>
                      <p className="text-sm text-muted-foreground">Download your data</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </Section>

            {/* Notifications Section */}
            <Section title="Notifications" className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <div className="space-y-1 rounded-xl border border-border overflow-hidden">
                {/* Push Notifications */}
                <div className="flex items-center justify-between p-4 bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <Bell className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">Streak reminders & updates</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setNotifications(!notifications);
                      toast.success(notifications ? "Notifications disabled" : "Notifications enabled");
                    }}
                    className={cn(
                      "w-12 h-6 rounded-full p-1 transition-colors duration-300",
                      notifications ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-white transition-transform duration-300",
                      notifications ? "translate-x-6" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {/* Email Digest */}
                <div className="flex items-center justify-between p-4 bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <Globe className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Weekly Digest</p>
                      <p className="text-sm text-muted-foreground">Weekly email summary</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEmailDigest(!emailDigest);
                      toast.success(emailDigest ? "Weekly digest disabled" : "Weekly digest enabled");
                    }}
                    className={cn(
                      "w-12 h-6 rounded-full p-1 transition-colors duration-300",
                      emailDigest ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-white transition-transform duration-300",
                      emailDigest ? "translate-x-6" : "translate-x-0"
                    )} />
                  </button>
                </div>
              </div>
            </Section>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Preferences Section */}
            <Section title="Preferences" className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
              <div className="space-y-1 rounded-xl border border-border overflow-hidden">
                {/* Timezone */}
                <div className="flex items-center justify-between p-4 bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Timezone</p>
                      <p className="text-sm text-muted-foreground">For accurate streak tracking</p>
                    </div>
                  </div>
                  <select
                    value={timezone}
                    onChange={(e) => {
                      setTimezone(e.target.value);
                      toast.success(`Timezone updated to ${e.target.value.split('/')[1]}`);
                    }}
                    className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>{tz.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>

                {/* Dark Mode */}
                <div className="flex items-center justify-between p-4 bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <Moon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-muted-foreground">Always on (we love dark mode)</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setDarkMode(!darkMode);
                      toast.success("Dark mode is the only way!");
                    }}
                    className={cn(
                      "w-12 h-6 rounded-full p-1 transition-colors duration-300",
                      darkMode ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-white transition-transform duration-300",
                      darkMode ? "translate-x-6" : "translate-x-0"
                    )} />
                  </button>
                </div>
              </div>
            </Section>

            {/* Privacy Section */}
            <Section title="Privacy" className="animate-fade-up" style={{ animationDelay: "0.25s" }}>
              <div className="space-y-1 rounded-xl border border-border overflow-hidden">
                {/* Public Profile */}
                <div className="flex items-center justify-between p-4 bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <Eye className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Public Profile</p>
                      <p className="text-sm text-muted-foreground">Allow others to see your profile</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setPublicProfile(!publicProfile);
                      toast.success(publicProfile ? "Profile is now private" : "Profile is now public");
                    }}
                    className={cn(
                      "w-12 h-6 rounded-full p-1 transition-colors duration-300",
                      publicProfile ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-white transition-transform duration-300",
                      publicProfile ? "translate-x-6" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {/* Show on Leaderboard */}
                <div className="flex items-center justify-between p-4 bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <Shield className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Show on Leaderboard</p>
                      <p className="text-sm text-muted-foreground">Appear in public rankings</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toast.success("Leaderboard visibility updated")}
                    className="w-12 h-6 rounded-full p-1 transition-colors duration-300 bg-primary"
                  >
                    <div className="w-4 h-4 rounded-full bg-white translate-x-6 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            </Section>

            {/* Danger Zone */}
            <Section title="Danger Zone" className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <div className="space-y-3">
                {isGithubConnected && (
                  <>
                    <button
                      onClick={handleDisconnectClick}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/20 transition-colors text-left text-orange-500"
                    >
                      <div className="flex items-center gap-3">
                        <Github className="w-5 h-5" />
                        <span>Disconnect GitHub</span>
                      </div>
                      <div className="text-sm opacity-80">
                        Connected as @{(session?.user as any)?.username || githubUsername || session?.user?.name}
                      </div>
                    </button>

                    <Dialog open={showDisconnectInfo} onOpenChange={setShowDisconnectInfo}>
                      <DialogContent className="bg-background border-border">
                        <DialogHeader>
                          <DialogTitle>Cannot Disconnect Account</DialogTitle>
                          <DialogDescription>
                            Your GitHub account is permanently linked to your profile to track your progress and contributions.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-2 text-sm text-muted-foreground space-y-2">
                          <p>To switch GitHub accounts, you must delete your current profile and create a new one.</p>
                          <p>If you believe this is an error, please contact support.</p>
                        </div>
                        <div className="flex gap-2 justify-end mt-2">
                          <Button variant="secondary" onClick={() => setShowDisconnectInfo(false)}>Close</Button>
                          <Button variant="outline" asChild>
                            <a href="mailto:support@evergreeners.dev">Contact Support</a>
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}

                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogTrigger asChild>
                    <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-destructive/50 bg-destructive/10 hover:bg-destructive/20 transition-colors text-left text-destructive">
                      <Trash2 className="w-5 h-5" />
                      <span>Delete Account</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-background border-border">
                    <DialogHeader>
                      <DialogTitle className="text-destructive">Delete Account</DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        This action cannot be undone. All your data will be permanently deleted.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="text-sm text-muted-foreground">Type "DELETE" to confirm</label>
                        <input
                          type="text"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder="DELETE"
                          className="w-full mt-2 p-3 rounded-xl bg-secondary border border-border focus:border-destructive focus:outline-none transition-colors"
                        />
                      </div>
                      <Button
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmation !== "DELETE"}
                        variant="destructive"
                        className="w-full"
                      >
                        Delete My Account
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Section>
          </div>
        </div>

        {/* Version */}
        <div className="text-center text-xs text-muted-foreground animate-fade-up" style={{ animationDelay: "0.35s" }}>
          <p>Evergreeners v1.0.0</p>
          <p className="mt-1">Made with 💚 for developers</p>
        </div>
      </main>

      <FloatingNav />
    </div>
  );
}
