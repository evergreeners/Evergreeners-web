import { Header } from "@/components/Header";
import { FloatingNav } from "@/components/FloatingNav";
import { Section } from "@/components/Section";
import { Trophy, Medal, Flame, Crown, TrendingUp, TrendingDown, Minus, Loader2, GitCommit } from "lucide-react";
import { cn, triggerHaptic } from "@/lib/utils";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { getApiUrl } from "@/lib/api-config";

interface LeaderboardEntry {
  rank: number;
  previousRank: number;
  username: string;
  avatar: string | null;
  streak: number;
  totalCommits: number;
  weeklyCommits: number;
  yesterdayCommits: number;
  isCurrentUser?: boolean;
}

interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
  username?: string | null;
  streak?: number;
  totalCommits?: number;
  weeklyCommits?: number;
  yesterdayCommits?: number;
}

type FilterType = "streak" | "commits" | "weekly" | "yesterday";

export default function Leaderboard() {
  const [filter, setFilter] = useState<FilterType>("streak");
  const { data: session } = useSession();
  const user = session?.user as unknown as AuthUser;

  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/leaderboard"));
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      const data = await res.json();
      return data.leaderboard.map((entry: any) => ({
        ...entry,
        // Mock previous rank for now as we don't track history yet
        previousRank: entry.rank,
        // Ensure avatar fallback if null is handled in UI, or set default here
        avatar: entry.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.username)}&background=random`
      })) as LeaderboardEntry[];
    }
  });

  // Determine current user from the fetched leaderboard or session
  const currentUserEntry = leaderboardData?.find(e =>
    user && (e.username === user.username || (user.username && e.username === user.username))
  );

  const currentUser = currentUserEntry || (user ? {
    rank: 0, // Unranked
    previousRank: 0,
    username: user.username || "You",
    avatar: user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=random`,
    streak: user.streak || 0,
    totalCommits: user.totalCommits || 0,
    weeklyCommits: user.weeklyCommits || 0,
    yesterdayCommits: user.yesterdayCommits || 0,
    isCurrentUser: true
  } : null);


  const getRankChange = (current: number, previous: number) => {
    if (current < previous) return { icon: TrendingUp, class: "text-primary", text: `+${previous - current}` };
    if (current > previous) return { icon: TrendingDown, class: "text-destructive", text: `-${current - previous}` };
    return { icon: Minus, class: "text-muted-foreground", text: "0" };
  };

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

  // Sort based on filter (Client-side sorting of the top 50)
  const sortedData = leaderboardData ? [...leaderboardData].sort((a, b) => {
    if (filter === "streak") return b.streak - a.streak;
    if (filter === "commits") return b.totalCommits - a.totalCommits;
    if (filter === "weekly") return b.weeklyCommits - a.weeklyCommits;
    if (filter === "yesterday") return b.yesterdayCommits - a.yesterdayCommits;
    return b.streak - a.streak; // Default
  }) : [];

  const topThree = sortedData.slice(0, 3);
  const restOfLeaderboard = sortedData.slice(3);

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

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Your Position */}
            {currentUser && (
              <Section className="animate-fade-up" style={{ animationDelay: "0.05s" }}>
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full border-2 border-primary overflow-hidden">
                          <img src={currentUser.avatar || ""} alt={currentUser.username} className="w-full h-full object-cover" />
                        </div>
                        {currentUser.rank > 0 && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                            #{currentUser.rank}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Your Position</p>
                        <p className="text-sm text-muted-foreground">@{currentUser.username}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-primary" />
                        <span className="font-bold text-lg">{currentUser.streak} days</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        {(() => {
                          const weeklyCommits = currentUser.weeklyCommits || 0;
                          if (weeklyCommits > 0) {
                            return (
                              <>
                                <TrendingUp className="w-3 h-3 text-primary" />
                                <span className="text-primary">{weeklyCommits} this week</span>
                              </>
                            );
                          } else {
                            return (
                              <>
                                <Minus className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{weeklyCommits} this week</span>
                              </>
                            );
                          }
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
                { key: "yesterday", label: "Yesterday" }
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
            {topThree.length > 0 && (
              <Section className="animate-fade-up mt-8" style={{ animationDelay: "0.15s" }}>
                <div className="flex items-end justify-center gap-2 md:gap-4 h-80">
                  {/* 2nd Place */}
                  {topThree[1] && (
                    <div className="flex flex-col items-center z-10">
                      <div className="w-16 h-16 rounded-full border-2 border-gray-400 overflow-hidden mb-2">
                        <img src={topThree[1].avatar || ""} alt={topThree[1].username} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-sm font-medium truncate max-w-[80px] text-center">{topThree[1].username}</p>
                      <p className="text-xs text-muted-foreground">
                        {filter === "streak" && `${topThree[1].streak} days`}
                        {filter === "commits" && `${topThree[1].totalCommits} commits`}
                        {filter === "weekly" && `${topThree[1].weeklyCommits} this week`}
                        {filter === "yesterday" && `${topThree[1].yesterdayCommits} yesterday`}
                      </p>
                      <div className="w-20 h-24 bg-secondary/50 rounded-t-xl mt-2 flex items-center justify-center border-t border-x border-gray-400/30">
                        <Medal className="w-8 h-8 text-gray-400" />
                      </div>
                    </div>
                  )}

                  {/* 1st Place */}
                  {topThree[0] && (
                    <div className="flex flex-col items-center -mt-8 z-20">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full border-2 border-yellow-400 overflow-hidden mb-2 ring-4 ring-yellow-400/20">
                          <img src={topThree[0].avatar || ""} alt={topThree[0].username} className="w-full h-full object-cover" />
                        </div>
                        <Crown className="w-6 h-6 text-yellow-400 absolute -top-3 left-1/2 -translate-x-1/2" />
                      </div>
                      <p className="text-sm font-medium truncate max-w-[100px] text-center">{topThree[0].username}</p>
                      <p className="text-xs text-primary font-bold">
                        {filter === "streak" && `${topThree[0].streak} days`}
                        {filter === "commits" && `${topThree[0].totalCommits} commits`}
                        {filter === "weekly" && `${topThree[0].weeklyCommits} this week`}
                        {filter === "yesterday" && `${topThree[0].yesterdayCommits} yesterday`}
                      </p>
                      <div className="w-24 h-32 bg-primary/20 rounded-t-xl mt-2 flex items-center justify-center border-t border-x border-primary/30">
                        <Trophy className="w-10 h-10 text-yellow-400" />
                      </div>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {topThree[2] && (
                    <div className="flex flex-col items-center z-10">
                      <div className="w-16 h-16 rounded-full border-2 border-amber-600 overflow-hidden mb-2">
                        <img src={topThree[2].avatar || ""} alt={topThree[2].username} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-sm font-medium truncate max-w-[80px] text-center">{topThree[2].username}</p>
                      <p className="text-xs text-muted-foreground">
                        {filter === "streak" && `${topThree[2].streak} days`}
                        {filter === "commits" && `${topThree[2].totalCommits} commits`}
                        {filter === "weekly" && `${topThree[2].weeklyCommits} this week`}
                        {filter === "yesterday" && `${topThree[2].yesterdayCommits} yesterday`}
                      </p>
                      <div className="w-20 h-20 bg-secondary/50 rounded-t-xl mt-2 flex items-center justify-center border-t border-x border-amber-600/30">
                        <Medal className="w-8 h-8 text-amber-600" />
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Full Leaderboard */}
            <Section title="Rankings" className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <div className="space-y-2">
                {restOfLeaderboard.map((entry, index) => {
                  const change = getRankChange(entry.rank, entry.previousRank);
                  const isUser = user && (entry.username === user.username);

                  return (
                    <div
                      key={entry.username}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:scale-[1.01]",
                        isUser
                          ? "border-primary/50 bg-primary/10"
                          : "border-border bg-secondary/30 hover:bg-secondary/50"
                      )}
                      style={{ animationDelay: `${0.05 * index}s` }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 text-center flex-shrink-0">
                          {getRankBadge(entry.rank)}
                        </div>
                        <div className="w-10 h-10 rounded-full border border-border overflow-hidden flex-shrink-0">
                          <img src={entry.avatar || ""} alt={entry.username} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1 pr-2">
                          <p className={cn("font-medium truncate", isUser && "text-primary")}>
                            @{entry.username}
                            {isUser && <span className="ml-2 text-xs opacity-70">(You)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{entry.totalCommits.toLocaleString()} commits</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <change.icon className={cn("w-3 h-3", change.class)} />
                          <span className={cn("text-xs hidden sm:block", change.class)}>{change.text}</span>
                        </div>
                        <div className="flex items-center gap-1 min-w-[60px] justify-end">
                          {filter === "streak" && <Flame className="w-4 h-4 text-primary" />}
                          {filter === "commits" && <Trophy className="w-4 h-4 text-yellow-500" />}
                          {filter === "weekly" && <GitCommit className="w-4 h-4 text-green-500" />}
                          {filter === "yesterday" && <Flame className="w-4 h-4 text-orange-500" />}

                          <span className="font-bold">
                            {filter === "streak" && entry.streak}
                            {filter === "commits" && entry.totalCommits.toLocaleString()}
                            {filter === "weekly" && (entry.weeklyCommits || 0)}
                            {filter === "yesterday" && (entry.yesterdayCommits || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* Load More */}
            {/* Empty State */}
            {topThree.length === 0 && (
              <div className="text-center py-20 text-muted-foreground animate-fade-up">
                <p>No active leaders yet. Be the first to start a streak!</p>
              </div>
            )}

            {/* Load More - Only show if we likely have more data (limit is 50) */}
            {leaderboardData && leaderboardData.length >= 50 && (
              <div className="text-center animate-fade-up" style={{ animationDelay: "0.25s" }}>
                <button className="px-6 py-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-all duration-300 text-sm font-medium">
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <FloatingNav />
    </div>
  );
}
