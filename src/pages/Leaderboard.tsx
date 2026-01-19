import { Header } from "@/components/Header";
import { FloatingNav } from "@/components/FloatingNav";
import { Section } from "@/components/Section";
import { Trophy, Medal, Flame, Crown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn, triggerHaptic } from "@/lib/utils";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const getBaseURL = (url: string) => {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.includes("localhost") || url.includes("127.0.0.1")) return `http://${url}`;
  return `https://${url}`;
};

interface LeaderboardUser {
  id: string;
  username: string;
  name: string;
  image: string;
  streak: number;
  totalCommits: number;
  todayCommits: number;
  yesterdayCommits: number;
  weeklyCommits: number;
}

interface LeaderboardEntry {
  rank: number;
  user: LeaderboardUser;
}

type FilterType = "streak" | "commits" | "weekly";

export default function Leaderboard() {
  const [filter, setFilter] = useState<FilterType>("streak");
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<{ rank: number; user: LeaderboardUser } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLoading(true);
      try {
        const baseUrl = getBaseURL(import.meta.env.VITE_API_URL || "http://localhost:3000");
        const res = await fetch(`${baseUrl}/api/leaderboard?filter=${filter}`, {
          credentials: "include"
        });
        if (!res.ok) throw new Error("Failed to fetch leaderboard");
        const data = await res.json();
        setLeaderboardUsers(data.users);
        setCurrentUserRank(data.currentUserRank);
      } catch (error) {
        console.error(error);
        toast.error("Could not load leaderboard");
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeaderboard();
  }, [filter]);

  const getCommitTrend = (today: number, yesterday: number) => {
    if (today > yesterday) return { icon: TrendingUp, class: "text-primary", text: `+${today - yesterday}` };
    if (today < yesterday) return { icon: TrendingDown, class: "text-destructive", text: `${today - yesterday}` };
    return { icon: Minus, class: "text-muted-foreground", text: "0" };
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background custom-scrollbar">
      <Header />

      <main className="container pt-24 pb-32 md:pb-12 space-y-8">
        {/* Page Header */}
        <section className="animate-fade-in">
          <h1 className="text-3xl font-bold text-gradient flex items-center gap-3">
            <Trophy className="w-8 h-8" /> Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1">Top developers by consistency</p>
        </section>

        {/* Your Position */}
        {!isLoading && currentUserRank && (
          <Section className="animate-fade-up" style={{ animationDelay: "0.05s" }}>
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-primary overflow-hidden">
                      <img
                        src={currentUserRank.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserRank.user.name || "User")}&background=random`}
                        alt={currentUserRank.user.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      #{currentUserRank.rank}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Your Position</p>
                    <p className="text-sm text-muted-foreground">@{currentUserRank.user.username || "anonymous"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-primary" />
                    <span className="font-bold text-lg">{currentUserRank.user.streak} days</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {(() => {
                      const trend = getCommitTrend(currentUserRank.user.todayCommits, currentUserRank.user.yesterdayCommits);
                      return (
                        <>
                          <trend.icon className={cn("w-3 h-3", trend.class)} />
                          <span className={trend.class}>{trend.text} today</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 animate-fade-up overflow-x-auto no-scrollbar pb-1" style={{ animationDelay: "0.1s" }}>
          {([
            { key: "streak", label: "Streak" },
            { key: "commits", label: "Commits" },
            { key: "weekly", label: "This Week" },
          ] as { key: FilterType; label: string }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setFilter(tab.key);
                triggerHaptic();
              }}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap",
                filter === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        {!isLoading && leaderboardUsers.length >= 3 && (
          <Section className="animate-fade-up mt-8" style={{ animationDelay: "0.15s" }}>
            <div className="flex items-end justify-center gap-2 md:gap-4 h-80">
              {/* 2nd Place */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-2 border-gray-400 overflow-hidden mb-2">
                  <img src={leaderboardUsers[1].image || `https://ui-avatars.com/api/?name=${encodeURIComponent(leaderboardUsers[1].name || "Account")}&background=random`} alt={leaderboardUsers[1].username} className="w-full h-full object-cover" />
                </div>
                <p className="text-sm font-medium truncate max-w-[80px] text-center">{leaderboardUsers[1].username || "anonymous"}</p>
                <p className="text-xs text-muted-foreground">{leaderboardUsers[1].streak} days</p>
                <div className="w-20 h-24 bg-secondary/50 rounded-t-xl mt-2 flex items-center justify-center border-t border-x border-gray-400/30">
                  <Medal className="w-8 h-8 text-gray-400" />
                </div>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center -mt-8">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-2 border-yellow-400 overflow-hidden mb-2 ring-4 ring-yellow-400/20">
                    <img src={leaderboardUsers[0].image || `https://ui-avatars.com/api/?name=${encodeURIComponent(leaderboardUsers[0].name || "Top 1")}&background=random`} alt={leaderboardUsers[0].username} className="w-full h-full object-cover" />
                  </div>
                  <Crown className="w-6 h-6 text-yellow-400 absolute -top-3 left-1/2 -translate-x-1/2" />
                </div>
                <p className="text-sm font-medium truncate max-w-[100px] text-center">{leaderboardUsers[0].username || "anonymous"}</p>
                <p className="text-xs text-primary font-bold">{leaderboardUsers[0].streak} days</p>
                <div className="w-24 h-32 bg-primary/20 rounded-t-xl mt-2 flex items-center justify-center border-t border-x border-primary/30">
                  <Trophy className="w-10 h-10 text-yellow-400" />
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-2 border-amber-600 overflow-hidden mb-2">
                  <img src={leaderboardUsers[2].image || `https://ui-avatars.com/api/?name=${encodeURIComponent(leaderboardUsers[2].name || "Account")}&background=random`} alt={leaderboardUsers[2].username} className="w-full h-full object-cover" />
                </div>
                <p className="text-sm font-medium truncate max-w-[80px] text-center">{leaderboardUsers[2].username || "anonymous"}</p>
                <p className="text-xs text-muted-foreground">{leaderboardUsers[2].streak} days</p>
                <div className="w-20 h-20 bg-secondary/50 rounded-t-xl mt-2 flex items-center justify-center border-t border-x border-amber-600/30">
                  <Medal className="w-8 h-8 text-amber-600" />
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* Full Leaderboard */}
        <Section title="Rankings" className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="space-y-2">
            {isLoading ? (
              <div className="py-20 text-center text-muted-foreground">Loading ranks...</div>
            ) : leaderboardUsers.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">No users found</div>
            ) : (
              leaderboardUsers.slice(3).map((user, index) => {
                const globalRank = index + 4;
                const trend = getCommitTrend(user.todayCommits, user.yesterdayCommits);
                const isMe = user.id === currentUserRank?.user.id;
                return (
                  <div
                    key={user.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:scale-[1.01]",
                      isMe
                        ? "border-primary/50 bg-primary/10"
                        : "border-border bg-secondary/30 hover:bg-secondary/50"
                    )}
                    style={{ animationDelay: `${0.05 * index}s` }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 text-center flex-shrink-0">
                        {getRankBadge(globalRank)}
                      </div>
                      <div className="w-10 h-10 rounded-full border border-border overflow-hidden flex-shrink-0">
                        <img
                          src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=random`}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 pr-2">
                        <p className={cn("font-medium truncate", isMe && "text-primary")}>
                          @{user.username || "anonymous"}
                          {isMe && <span className="ml-2 text-xs opacity-70">(You)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user.totalCommits.toLocaleString()} commits</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <trend.icon className={cn("w-3 h-3", trend.class)} />
                        <span className={cn("text-xs hidden sm:block", trend.class)}>{trend.text}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-primary" />
                        <span className="font-bold">{user.streak}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Section>
      </main>

      <FloatingNav />
    </div>
  );
}
