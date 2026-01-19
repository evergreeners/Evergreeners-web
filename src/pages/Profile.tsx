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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const activityData = Array.from({ length: 84 }, () =>
  Math.random() > 0.3 ? Math.floor(Math.random() * 5) : 0
);

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
  /* Hook and State Setup */
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();

  const [isPublic, setIsPublic] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
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
    totalCommits: 0
  });

  const stats = [
    { label: "Current Streak", value: profile.streak?.toString() || "0", icon: Flame },
    { label: "Total Commits", value: (profile.totalCommits || 0).toLocaleString(), icon: GitCommit },
    { label: "Goals Hit", value: "12", icon: Target },
    { label: "Best Rank", value: "#24", icon: Trophy },
  ];

  const [editedProfile, setEditedProfile] = useState(profile);

  /* Effect: Load session data into state and check connections */
  useEffect(() => {
    const initProfile = async () => {
      if (session?.user) {
        // Initial hydrate from session (fast)
        const user = session.user as any;
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
          totalCommits: user.totalCommits || 0
        }));
        setIsPublic(user.isPublic !== false);
        setEditedProfile(prev => ({ ...prev, ...user }));

        if (typeof user.isGithubConnected === 'boolean') {
          setIsGithubConnected(user.isGithubConnected);
        } else {
          // Fallback for older sessions or if field missing
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

  const syncGithubData = async () => {
    try {
      toast.info("Syncing GitHub data...");
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
          totalCommits: data.totalCommits
        }));
        toast.success("GitHub data synced!");
      } else {
        console.error("Sync failed with status:", res.status);
      }
    } catch (e) {
      console.error("Sync failed", e);
    }
  };

  // Auto-sync effect
  // Auto-sync effect removed as per user request to rely on DB data
  // useEffect(() => {
  //   if (isGithubConnected && profile.streak === 0 && profile.totalCommits === 0) {
  //     syncGithubData();
  //   }
  // }, [isGithubConnected]);

  const publicUrl = `evergreeners.dev/${isPublic ? profile.username : profile.anonymousName || 'anonymous'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${publicUrl}`);
    setCopied(true);
    toast.success("Profile link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  /* Save Profile Function */
  const handleSaveProfile = async () => {
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
      // Force reload or re-fetch session to get latest data if needed, 
      // but local state update is instant for UX.
      // window.location.reload(); 
    } catch (e: any) {
      toast.error(e.message);
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
                  <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogTrigger asChild>
                      <button className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="bg-background border-border">
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <label className="text-sm text-muted-foreground">Display Name</label>
                          <input
                            type="text"
                            value={editedProfile.name}
                            onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                            className="w-full mt-2 p-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Username</label>
                          <input
                            type="text"
                            value={editedProfile.username}
                            onChange={(e) => setEditedProfile({ ...editedProfile, username: e.target.value })}
                            className="w-full mt-2 p-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Profile Picture (Max 1MB)</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;

                              if (file.size > 1024 * 1024) {
                                toast.error("Image size must be less than 1MB");
                                e.target.value = ""; // Reset input
                                return;
                              }

                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setEditedProfile({ ...editedProfile, image: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }}
                            className="w-full mt-2 p-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                          />
                          {editedProfile.image && editedProfile.image.startsWith("data:") && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              Image selected (Preview above when saved)
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Bio</label>
                          <textarea
                            value={editedProfile.bio}
                            onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                            className="w-full mt-2 p-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors resize-none h-24"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Location</label>
                          <input
                            type="text"
                            value={editedProfile.location}
                            onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                            className="w-full mt-2 p-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Website</label>
                          <input
                            type="url"
                            value={editedProfile.website}
                            onChange={(e) => setEditedProfile({ ...editedProfile, website: e.target.value })}
                            className="w-full mt-2 p-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                          />
                        </div>
                        <Button
                          onClick={handleSaveProfile}
                          className="w-full bg-primary hover:bg-primary/90"
                        >
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
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

                {stat.label === "Total Commits" && isGithubConnected && (
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
          <ActivityGrid data={activityData} />
          <div className="flex items-center justify-end gap-2 mt-3">
            <span className="text-xs text-muted-foreground">Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`w-3 h-3 rounded-sm ${level === 0 ? "bg-secondary" :
                    level === 1 ? "bg-primary/25" :
                      level === 2 ? "bg-primary/50" :
                        level === 3 ? "bg-primary/75" :
                          "bg-primary"
                    }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">More</span>
          </div>
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

      <FloatingNav />
    </div>
  );
}
