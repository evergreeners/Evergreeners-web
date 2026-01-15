import { Header } from "@/components/Header";
import { FloatingNav } from "@/components/FloatingNav";
import { Section } from "@/components/Section";
import { 
  Globe, Bell, Shield, Moon, Trash2, LogOut, 
  ChevronRight, Github, Clock, Eye, RefreshCw, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SettingItem {
  icon: React.ElementType;
  title: string;
  description?: string;
  value?: string;
  action?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  danger?: boolean;
}

export default function Settings() {
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [notifications, setNotifications] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const timezones = [
    "America/Los_Angeles",
    "America/New_York",
    "Europe/London",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Singapore",
    "Australia/Sydney",
  ];

  const handleRefreshData = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: "Syncing with GitHub...",
        success: "Data refreshed successfully!",
        error: "Failed to refresh data",
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

  const handleDisconnectGithub = () => {
    toast.success("GitHub disconnected");
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
      
      <main className="container pt-24 pb-32 space-y-8">
        {/* Page Header */}
        <section className="animate-fade-in">
          <h1 className="text-3xl font-bold text-gradient">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your preferences</p>
        </section>

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
                  <p className="font-medium">GitHub Connected</p>
                  <p className="text-sm text-muted-foreground">@alexdev</p>
                </div>
              </div>
              <button 
                onClick={handleDisconnectGithub}
                className="text-sm text-destructive hover:underline"
              >
                Disconnect
              </button>
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
            <button 
              onClick={() => toast.success("Logged out successfully")}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
              <span>Log Out</span>
            </button>

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
