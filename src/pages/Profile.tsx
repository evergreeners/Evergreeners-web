import { Header } from "@/components/Header";
import { FloatingNav } from "@/components/FloatingNav";
import { Section } from "@/components/Section";
import { ActivityGrid } from "@/components/ActivityGrid";
import {
  Github, MapPin, Calendar, Link as LinkIcon,
  Edit2, Share2, Check, Trophy, Flame, Target, GitCommit,
  Eye, EyeOff, ExternalLink, RefreshCw, Leaf, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ProfileEditForm } from "@/components/ProfileEditForm";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/api-config";
import NotFound from "./NotFound";
import { useSession, signIn, authClient } from "@/lib/auth-client";
import { Logo } from "@/components/Logo";

// ─── Static data ─────────────────────────────────────────────────────────────

const achievements = [
  { name: "Early Adopter", icon: "🌱", earned: true },
  { name: "30-Day Streak", icon: "🔥", earned: true },
  { name: "60-Day Streak", icon: "⚡", earned: true },
  { name: "100-Day Streak", icon: "💎", earned: false },
  { name: "Top 10", icon: "🏆", earned: false },
  { name: "Contributor", icon: "🤝", earned: true },
];

// ─── Public minimal header (for unauthenticated visitors) ────────────────────

function PublicHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-0">
      <div className="glass-nav mt-4 rounded-2xl mx-auto max-w-5xl border border-primary/20 bg-primary/10">
        <div className="flex items-center justify-between py-3 px-4">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="w-6 h-6" />
            <span className="font-semibold text-foreground hidden md:block">Evergreeners</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-sm">Log In</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="text-sm bg-primary text-primary-foreground hover:bg-primary/90">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Profile() {
  const navigate = useNavigate();
  const { username: urlUsername } = useParams();
  const { data: session, isPending: sessionLoading } = useSession();
  const isMobile = useIsMobile();

  // ── State ──────────────────────────────────────────────────────────────────
  const [isPublic, setIsPublic] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  const [profile, setProfile] = useState({
    name: "Loading...",
    username: "...",
    bio: "",
    location: "",
    website: "",
    joinDate: "Joined recently",
    image: "",
    anonymousName: "",
    streak: 0,
    totalCommits: 0,
    todayCommits: 0,
    bestRank: null as number | null,
    contributionData: [] as any[]
  });

  const [editedProfile, setEditedProfile] = useState(profile);

  // ── Derived state ──────────────────────────────────────────────────────────
  // isOwnProfile: true when viewing /profile (no urlUsername) AND logged in,
  //               OR when the urlUsername matches the logged-in user's username.
  const isAuthenticated = !!session?.user && !sessionLoading;
  const loggedInUsername = (session?.user as any)?.username;
  const isOwnProfile = isAuthenticated && (
    !urlUsername || loggedInUsername === urlUsername
  );
  // Viewing someone else while logged in
  const isAuthenticatedGuest = isAuthenticated && !isOwnProfile;
  // Completely unauthenticated visitor
  const isUnauthenticatedGuest = !session?.user && !sessionLoading;

  const stats = [
    { label: "Current Streak", value: profile.streak?.toString() || "0", icon: Flame },
    { label: "Commits Today", value: (profile.todayCommits || 0).toString(), icon: GitCommit },
    { label: "Total Commits", value: (profile.totalCommits || 0).toLocaleString(), icon: Trophy },
    { label: "Best Rank", value: profile.bestRank ? `#${profile.bestRank}` : "—", icon: Target },
  ];

  // ── Data fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Don't fetch until we know whether the user is logged in
    if (sessionLoading) return;

    const fetchProfile = async () => {
      setIsLoading(true);
      setNotFound(false);
      setIsPrivate(false);

      try {
        let url: string;
        let options: RequestInit;

        if (isOwnProfile && !urlUsername) {
          // /profile — fetch own authenticated profile
          url = getApiUrl("/api/user/profile");
          options = { credentials: "include" };
        } else if (urlUsername) {
          // /:username — fetch public profile (no auth needed)
          url = getApiUrl(`/api/user/profile/${urlUsername}`);
          options = { credentials: "include" }; // include anyway for any future personalisation
        } else {
          // /profile but not logged in — redirect to login
          navigate("/login");
          return;
        }

        const res = await fetch(url, options);

        if (res.status === 404) { setNotFound(true); return; }
        if (res.status === 403) { setIsPrivate(true); return; }
        if (res.status === 401) {
          // Needed session but none found — send to login
          navigate("/login");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch profile");

        const { user } = await res.json();

        setProfile({
          name: user.name || "Tree Planter",
          username: user.username || "user",
          bio: user.bio || "",
          location: user.location || "",
          website: user.website || "",
          joinDate: "Joined " + new Date(user.createdAt || Date.now()).toLocaleDateString(),
          image: user.image || "",
          anonymousName: user.anonymousName || "",
          streak: user.streak || 0,
          totalCommits: user.totalCommits || 0,
          todayCommits: user.todayCommits || 0,
          bestRank: user.bestRank || null,
          contributionData: user.contributionData || []
        });

        setEditedProfile(user);
        setIsPublic(user.isPublic !== false);

        // Only check GitHub connection status for own profile — via better-auth
        if (isOwnProfile) {
          let githubConnected = !!user.isGithubConnected;
          try {
            const accounts = await authClient.listAccounts();
            if (accounts.data) {
              githubConnected = accounts.data.some((acc) => acc.providerId === "github");
            }
          } catch {
            // fall back to DB value
          }
          setIsGithubConnected(githubConnected);

          // Kick off authenticated sync ONCE, right here after we have the data
          if (githubConnected) {
            syncGithubData(true);
          }
        } else if (urlUsername) {
          // Guest/visitor view — trigger a public background sync for the profile owner
          triggerPublicSync(urlUsername);
        }

      } catch (e) {
        console.error("Profile fetch failed", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [urlUsername, sessionLoading, isOwnProfile]);

  const triggerPublicSync = async (username: string) => {
    try {
      await fetch(getApiUrl(`/api/user/sync-github/${username}`), { method: "POST" });
      // Server responds immediately (fire-and-forget internally).
      // Wait a moment then re-fetch the profile so updated stats show.
      setTimeout(async () => {
        try {
          const res = await fetch(getApiUrl(`/api/user/profile/${username}`), { credentials: "include" });
          if (res.ok) {
            const { user } = await res.json();
            setProfile(prev => ({
              ...prev,
              streak: user.streak ?? prev.streak,
              totalCommits: user.totalCommits ?? prev.totalCommits,
              todayCommits: user.todayCommits ?? prev.todayCommits,
              bestRank: user.bestRank ?? prev.bestRank,
              contributionData: user.contributionData ?? prev.contributionData
            }));
          }
        } catch { /* silent — not critical */ }
      }, 3000);
    } catch { /* silent — sync is best-effort */ }
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const syncGithubData = async (silent = false) => {
    try {
      if (!silent) toast.info("Syncing GitHub data...");
      const res = await fetch(getApiUrl("/api/user/sync-github"), {
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
          bestRank: data.bestRank || prev.bestRank,
          contributionData: data.contributionData || []
        }));
        if (!silent) toast.success("GitHub data synced!");
      }
    } catch (e) {
      console.error("Sync failed", e);
    }
  };

  const publicUrl = `evergreeners.dev/${profile.username}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${publicUrl}`);
    setCopied(true);
    toast.success("Profile link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(getApiUrl("/api/user/profile"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...editedProfile, isPublic })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update profile");
      }
      setProfile(prev => ({ ...prev, ...editedProfile }));
      setIsEditing(false);
      toast.success("Profile updated!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublic = async () => {
    const newStatus = !isPublic;
    setIsPublic(newStatus);
    try {
      const res = await fetch(getApiUrl("/api/user/profile"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isPublic: newStatus })
      });
      const data = await res.json();
      if (data.anonymousName) {
        setProfile(prev => ({ ...prev, anonymousName: data.anonymousName }));
      }
      toast.success(newStatus ? "Profile is now public" : "Profile is now private");
    } catch {
      setIsPublic(!newStatus);
      toast.error("Failed to update visibility");
    }
  };

  const handleConnectGithub = async () => {
    try {
      await authClient.linkSocial({
        provider: "github",
        callbackURL: `${window.location.origin}/profile?gh=1`
      });
    } catch {
      try {
        await signIn.social({
          provider: "github",
          callbackURL: `${window.location.origin}/profile?gh=1`
        });
      } catch {
        toast.error("Failed to initiate GitHub connection");
      }
    }
  };

  // ── Early returns ──────────────────────────────────────────────────────────
  if (sessionLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound) return <NotFound />;

  if (isPrivate) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-4">
        {isUnauthenticatedGuest ? <PublicHeader /> : <Header />}
        <EyeOff className="w-12 h-12 text-muted-foreground mt-20" />
        <h1 className="text-2xl font-bold">Private Profile</h1>
        <p className="text-muted-foreground text-center max-w-sm">
          This adventurer has chosen to keep their progress private.
        </p>
        <Button onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")}>
          Go Home
        </Button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background custom-scrollbar">

      {/* Header: show minimal public one for guests, full app header for logged-in */}
      {isUnauthenticatedGuest ? <PublicHeader /> : <Header />}

      <main className="container pt-24 pb-32 md:pb-12 space-y-8">

        {/* ── Profile Hero ──────────────────────────────────────────────────── */}
        <section className="animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">

            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-secondary border border-border overflow-hidden">
                <img
                  src={profile.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {isOwnProfile && (
                <button
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 sm:gap-0">
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-bold">{profile.name}</h1>
                  <p className="text-muted-foreground">@{profile.username}</p>
                  {isOwnProfile && !isPublic && (
                    <p className="text-xs text-primary mt-1">
                      (Private • Playing as {profile.anonymousName || "..."})
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2">
                  {/* Edit button — own profile only */}
                  {isOwnProfile && (
                    <button
                      className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors"
                      onClick={() => setIsEditing(true)}
                      title="Edit profile"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {/* Share button — always shown */}
                  <button
                    className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors"
                    onClick={handleCopyLink}
                    title="Copy profile link"
                  >
                    {copied ? <Check className="w-4 h-4 text-primary" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {profile.bio && (
                <p className="text-sm text-muted-foreground mt-3 max-w-md text-center sm:text-left mx-auto sm:mx-0">
                  {profile.bio}
                </p>
              )}

              <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4 text-sm text-muted-foreground">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {profile.location}
                  </span>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <LinkIcon className="w-4 h-4" />
                    {profile.website.replace("https://", "").replace("http://", "")}
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> {profile.joinDate}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Grid ────────────────────────────────────────────────────── */}
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

                {/* Sync button — own profile only */}
                {isOwnProfile && (stat.label === "Total Commits" || stat.label === "Commits Today") && isGithubConnected && (
                  <button
                    onClick={(e) => { e.stopPropagation(); syncGithubData(); }}
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

        {/* ── Visibility Toggle — OWN PROFILE ONLY ─────────────────────────── */}
        {isOwnProfile && (
          <Section className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/30">
              <div className="flex items-center gap-3">
                {isPublic
                  ? <Eye className="w-5 h-5 text-primary" />
                  : <EyeOff className="w-5 h-5 text-muted-foreground" />}
                <div>
                  <p className="font-medium">{isPublic ? "Public Profile" : "Private Profile"}</p>
                  <p className="text-sm text-muted-foreground">
                    {isPublic
                      ? "Others can see your progress"
                      : `You appear as "${profile.anonymousName || "..."}" on leaderboards`}
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
        )}

        {/* ── GitHub Connection — OWN PROFILE ONLY ─────────────────────────── */}
        {isOwnProfile && (
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
                <Button variant="outline" size="sm" onClick={handleConnectGithub}>Connect</Button>
              )}
            </div>
          </Section>
        )}

        {/* ── Activity Grid ─────────────────────────────────────────────────── */}
        <Section title="Recent Activity" className="animate-fade-up" style={{ animationDelay: "0.25s" }}>
          <ActivityGrid data={profile.contributionData} weeks={57} />
        </Section>

        {/* ── Achievements ──────────────────────────────────────────────────── */}
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

        {/* ── Quick Actions — OWN PROFILE ONLY ─────────────────────────────── */}
        {isOwnProfile && (
          <Section title="Quick Actions" className="animate-fade-up" style={{ animationDelay: "0.35s" }}>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate("/settings")}
                className="p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-all duration-300 text-left"
              >
                <p className="font-medium">Settings</p>
                <p className="text-xs text-muted-foreground mt-1">Manage your account</p>
              </button>
              <button
                onClick={() => navigate("/leaderboard")}
                className="p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-all duration-300 text-left"
              >
                <p className="font-medium">Leaderboard</p>
                <p className="text-xs text-muted-foreground mt-1">See how you rank</p>
              </button>
            </div>
          </Section>
        )}

        {/* ── Join CTA — UNAUTHENTICATED GUESTS ONLY ───────────────────────── */}
        {isUnauthenticatedGuest && (
          <div className="animate-fade-up rounded-2xl border border-primary/30 bg-primary/5 p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Leaf className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Track your own consistency</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Join Evergreeners to build streaks, track commits, and climb the leaderboard — for free.
              </p>
            </div>
            <Link to="/signup">
              <Button className="shrink-0 gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}

      </main>

      {/* Edit profile — own profile only */}
      {isOwnProfile && (
        isMobile ? (
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
                <Button variant="outline" className="w-full mt-2" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
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
        )
      )}

      {/* Floating nav — authenticated users only */}
      {isAuthenticated && <FloatingNav />}
    </div>
  );
}
