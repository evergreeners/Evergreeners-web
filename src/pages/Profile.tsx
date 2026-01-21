import { Header } from "@/components/Header";
import { FloatingNav } from "@/components/FloatingNav";
import { Section } from "@/components/Section";
import { ActivityGrid } from "@/components/ActivityGrid";
import {
  Github, MapPin, Calendar, Link as LinkIcon,
  Edit2, Share2, Check, Copy, Trophy, Flame, Target, GitCommit,
  Eye, EyeOff, ExternalLink, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"; // Removed
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ProfileEditForm } from "@/components/ProfileEditForm";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";



const achievements = [
  { name: "Early Adopter", icon: "🌱", earned: true },
  { name: "30-Day Streak", icon: "🔥", earned: true },
  { name: "60-Day Streak", icon: "⚡", earned: true },
  { name: "100-Day Streak", icon: "💎", earned: false },
  { name: "Top 10", icon: "🏆", earned: false },
  { name: "Contributor", icon: "🤝", earned: true },
];



import { useSession, signIn, authClient } from "@/lib/auth-client";
import { useEffect } from "react";

export default function Profile() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const isMobile = useIsMobile();

  const [isPublic, setIsPublic] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGithubConnected, setIsGithubConnected] = useState(false); // New state

  const [profile, setProfile] = useState({
    name: "Loading...",
    username: "...",
    bio: "",
    location: "Earth",
    website: "",
    joinDate: "Joined recently",
    image: "",
    anonymousName: "",
    streak: 0,
    totalCommits: 0,
    todayCommits: 0, // New field
    contributionData: [] as any[] // New field
  });

  const stats = [
    { label: "Current Streak", value: profile.streak?.toString() || "0", icon: Flame },
    { label: "Commits Today", value: (profile.todayCommits || 0).toString(), icon: GitCommit },
    { label: "Total Commits", value: (profile.totalCommits || 0).toLocaleString(), icon: Trophy },
    { label: "Best Rank", value: "#24", icon: Target },
  ];

  const [editedProfile, setEditedProfile] = useState(profile);

  /* Effect: Load session data into state and check connections */
  useEffect(() => {
    const initProfile = async () => {
      if (session?.user) {
        // Initial hydrate from session (fast but potentially stale)
        const user = session.user as any;

        // Optimistically set from session first to show SOMETHING immediately
        setProfile(prev => ({
          ...prev,
          name: user.name || "Tree Planter",
          username: user.username || (user.email ? user.email.split('@')[0] : "user"),
          bio: user.bio || "No bio yet.",
          location: user.location || "Earth",
          website: user.website || "",
          joinDate: "Joined " + new Date(user.createdAt || Date.now()).toLocaleDateString(),
          image: user.image || "",
          anonymousName: user.anonymousName || "",
          streak: user.streak || 0,
          totalCommits: user.totalCommits || 0,
          todayCommits: user.todayCommits || 0,
          contributionData: user.contributionData || []
        }));
        setIsPublic(user.isPublic !== false);

        // Fetch FRESH data only (no profile overwrite if not needed, but here we want fresh stats AND fresh profile info if it changed)
        // Actually, the issue was user edits disappearing.
        // We fetching /api/user/profile ensures we display what is in the DB, not what is in the stale session cookie.
        try {
          const baseUrl = getBaseURL(import.meta.env.VITE_API_URL || 'http://localhost:3000');
          const res = await fetch(`${baseUrl}/api/user/profile`, { credentials: "include" });
          if (res.ok) {
            const { user: freshUser } = await res.json();
            setProfile(prev => ({
              ...prev,
              name: freshUser.name || prev.name,
              username: freshUser.username || prev.username,
              bio: freshUser.bio || prev.bio,
              location: freshUser.location || prev.location,
              website: freshUser.website || prev.website,
              image: freshUser.image || prev.image,
              anonymousName: freshUser.anonymousName || prev.anonymousName,
              streak: freshUser.streak,
              totalCommits: freshUser.totalCommits,
              todayCommits: freshUser.todayCommits,
              contributionData: freshUser.contributionData || prev.contributionData
            }));
            // Also update the edit form state so it doesn't revert if they open it
            setEditedProfile(prev => ({ ...prev, ...freshUser }));
            setIsPublic(freshUser.isPublic !== false);
          }
        } catch (e) {
          console.error("Failed to fetch fresh profile", e);
        }

        if (typeof user.isGithubConnected === 'boolean') {
          setIsGithubConnected(user.isGithubConnected);
        } else {
          try {
            const accounts = await authClient.listAccounts();
            if (accounts.data) {
              const hasGithub = accounts.data.some((acc) => acc.providerId === "github");
              setIsGithubConnected(hasGithub);
            }
          } catch (error) {
            console.error("Failed to list accounts", error);
          }
        }
      }
    };
    initProfile();
  }, [session]);

  const getBaseURL = (url: string) => {
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.includes("localhost") || url.includes("127.0.0.1")) return `http://${url}`;
    return `https://${url}`;
  };

  const syncGithubData = async (silent = false) => {
    try {
      if (!silent) toast.info("Syncing GitHub data...");
      const baseUrl = getBaseURL(import.meta.env.VITE_API_URL || 'http://localhost:3000');
      const res = await fetch(`${baseUrl}/api/user/sync-github`, {
        method: "POST",
        credentials: "include"
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(prev => ({
          ...prev,
          username: data.username || prev.username,
          streak: data.streak,
          totalCommits: data.totalCommits,
          todayCommits: data.todayCommits,
          contributionData: data.contributionData || []
        }));
        if (!silent) toast.success("GitHub data synced!");
      } else {
        console.error("Sync failed with status:", res.status);
      }
    } catch (e) {
      console.error("Sync failed", e);
    }
  };

  // Auto-sync effect: Always sync on load if connected (Real-time feel)
  useEffect(() => {
    if (isGithubConnected) {
      syncGithubData(true);
    }
  }, [isGithubConnected]);

  const publicUrl = `evergreeners.dev/${isPublic ? profile.username : profile.anonymousName || 'anonymous'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${publicUrl}`);
    setCopied(true);
    toast.success("Profile link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  /* Save Profile Function */
  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const baseUrl = getBaseURL(import.meta.env.VITE_API_URL || 'http://localhost:3000');
      const res = await fetch(`${baseUrl}/api/user/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Important for sending cookies!
        body: JSON.stringify({
          ...editedProfile,
          isPublic // send current public state too, though separate toggle exists
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update profile");
      }

      setProfile(editedProfile);
      setIsEditing(false);
      toast.success("Profile updated!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  /* Toggle Public/Private Function */
  const handleTogglePublic = async () => {
    const newStatus = !isPublic;
    // Optimistic update
    setIsPublic(newStatus);

    try {
      const baseUrl = getBaseURL(import.meta.env.VITE_API_URL || 'http://localhost:3000');
      const res = await fetch(`${baseUrl}/api/user/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Important for sending cookies!
        body: JSON.stringify({
          isPublic: newStatus
        })
      });

      const data = await res.json();
      if (data.anonymousName) {
        setProfile(prev => ({ ...prev, anonymousName: data.anonymousName }));
      }

      toast.success(newStatus ? "Profile is now public" : "Profile is now private");
    } catch (e) {
      setIsPublic(!newStatus); // Revert
      toast.error("Failed to update visibility");
    }
  };

  const handleConnectGithub = async () => {
    await signIn.social({
      provider: "github",
      callbackURL: `${window.location.origin}/dashboard`
    });
  };

  return (
    <div className="min-h-screen bg-background custom-scrollbar">
      <Header />

      <main className="container pt-24 pb-32 md:pb-12 space-y-8">
        {/* Profile Header */}
        <section className="animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-secondary border border-border overflow-hidden">
                <img
                  src={profile.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{profile.name}</h1>
                  <p className="text-muted-foreground">{isPublic ? `@${profile.username}` : `(Private • Playing as ${profile.anonymousName || "..."})`}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors"
                    onClick={handleCopyLink}
                  >
                    {copied ? <Check className="w-4 h-4 text-primary" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-3 max-w-md">{profile.bio}</p>

              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {profile.location}
                </span>
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                    <LinkIcon className="w-4 h-4" /> {profile.website.replace("https://", "").replace("http://", "")}
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> {profile.joinDate}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <Section className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="p-4 rounded-xl border border-border bg-secondary/30 text-center hover:bg-secondary/50 transition-all duration-300 relative group"
              >
                <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>

                {(stat.label === "Total Commits" || stat.label === "Commits Today") && isGithubConnected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      syncGithubData();
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Refresh Data"
                  >
                    <RefreshCw className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* Visibility Toggle */}
        <Section className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/30">
            <div className="flex items-center gap-3">
              {isPublic ? <Eye className="w-5 h-5 text-primary" /> : <EyeOff className="w-5 h-5 text-muted-foreground" />}
              <div>
                <p className="font-medium">{isPublic ? "Public Profile" : "Private Profile"}</p>
                <p className="text-sm text-muted-foreground">
                  {isPublic ? "Others can see your progress" : `You appear as "${profile.anonymousName || '...'}" on leaderboards`}
                </p>
              </div>
            </div>
            <button
              onClick={handleTogglePublic}
              className={cn(
                "w-12 h-6 rounded-full p-1 transition-colors duration-300",
                isPublic ? "bg-primary" : "bg-secondary"
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded-full bg-white transition-transform duration-300",
                isPublic ? "translate-x-6" : "translate-x-0"
              )} />
            </button>
          </div>
        </Section>

        {/* GitHub Connection */}
        <Section className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className={`flex items-center justify-between p-4 rounded-xl border ${isGithubConnected ? "border-primary/30 bg-primary/10" : "border-zinc-800 bg-zinc-900/50"}`}>
            <div className="flex items-center gap-3">
              <Github className={`w-6 h-6 ${isGithubConnected ? "text-primary" : "text-zinc-400"}`} />
              <div>
                <p className="font-medium">{isGithubConnected ? "GitHub Connected" : "Connect GitHub"}</p>
                <p className="text-sm text-muted-foreground">
                  {isGithubConnected ? `@${profile.username}` : "Link your account to track contributions"}
                </p>
              </div>
            </div>
            {isGithubConnected ? (
              <a
                href={`https://github.com/${profile.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl hover:bg-primary/20 transition-colors"
                title="View GitHub Profile"
              >
                <ExternalLink className="w-4 h-4 text-primary" />
              </a>
            ) : (
              <Button variant="outline" size="sm" onClick={handleConnectGithub}>
                Connect
              </Button>
            )}
          </div>
        </Section>

        {/* Activity Grid */}
        <Section title="Recent Activity" className="animate-fade-up" style={{ animationDelay: "0.25s" }}>
          <ActivityGrid data={profile.contributionData} />

        </Section>

        {/* Achievements */}
        <Section title="Achievements" className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.name}
                className={cn(
                  "flex flex-col items-center p-3 rounded-xl border transition-all duration-300 cursor-default",
                  achievement.earned
                    ? "border-primary/30 bg-primary/10"
                    : "border-border bg-secondary/30 opacity-50"
                )}
              >
                <span className="text-2xl mb-1">{achievement.icon}</span>
                <span className="text-[10px] text-center text-muted-foreground">{achievement.name}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Quick Actions */}
        <Section title="Quick Actions" className="animate-fade-up" style={{ animationDelay: "0.35s" }}>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/settings')}
              className="p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-all duration-300 text-left"
            >
              <p className="font-medium">Settings</p>
              <p className="text-xs text-muted-foreground mt-1">Manage your account</p>
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              className="p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-all duration-300 text-left"
            >
              <p className="font-medium">Leaderboard</p>
              <p className="text-xs text-muted-foreground mt-1">See how you rank</p>
            </button>
          </div>
        </Section>
      </main>

      {/* Responsive Edit Profile Modal */}
      {isMobile ? (
        <Drawer open={isEditing} onOpenChange={setIsEditing}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>Edit Profile</DrawerTitle>
              <DrawerDescription>Update your public profile details.</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4">
              <ProfileEditForm
                editedProfile={editedProfile}
                setEditedProfile={setEditedProfile}
                handleSaveProfile={handleSaveProfile}
                handleCopyLink={handleCopyLink}
                copied={copied}
                isSaving={isSaving}
              />
              <Button variant="outline" className="w-full mt-2" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={isEditing} onOpenChange={setIsEditing}>
          <SheetContent side="right" className="overflow-y-auto mb-16 sm:mb-0">
            <SheetHeader>
              <SheetTitle>Edit Profile</SheetTitle>
              <SheetDescription>Update your public profile details.</SheetDescription>
            </SheetHeader>
            <ProfileEditForm
              editedProfile={editedProfile}
              setEditedProfile={setEditedProfile}
              handleSaveProfile={handleSaveProfile}
              handleCopyLink={handleCopyLink}
              copied={copied}
              isSaving={isSaving}
            />
          </SheetContent>
        </Sheet>
      )}

      <FloatingNav />
    </div>
  );
}
