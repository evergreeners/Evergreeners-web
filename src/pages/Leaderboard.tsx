import { Header } from "@/components/Header";
import { FloatingNav } from "@/components/FloatingNav";
import { Section } from "@/components/Section";
import { Trophy, Medal, Flame, Crown, GitCommit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, triggerHaptic } from "@/lib/utils";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { getApiUrl } from "@/lib/api-config";

interface LeaderboardEntry {
  rank: number;
  previousRank: number;
  tabRank?: number;
  username: string;
  avatar: string | null;
  streak: number;
  totalCommits: number;
  weeklyCommits: number;
  yesterdayCommits: number;
  bestRank?: number;
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
  const [visibleCount, setVisibleCount] = useState(5);
  const { data: session } = useSession();
  const user = session?.user as unknown as AuthUser;

  const { data: leaderboardData, isLoading, isFetching } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/leaderboard"));
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      const data = await res.json();
      return data.leaderboard.map((entry: any) => ({
        ...entry,
        previousRank: entry.rank,
        avatar: entry.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.username)}&background=random`
      })) as LeaderboardEntry[];
    },
    // Data is prefetched on login, so it should be available immediately
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Only show loading if we don't have any data at all (first load before prefetch)
  // If we have cached data, show it while refetching in background
  const shouldShowLoader = isLoading && !leaderboardData;


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
    bestRank: (user as any)?.bestRank,
    isCurrentUser: true
  } : null);


  // Metric shown for the active tab only (no cross-tab info)
  const getTabMeta = (entry: LeaderboardEntry) => {
    switch (filter) {
      case "commits":
        return { icon: Trophy, iconClass: "text-yellow-500", value: entry.totalCommits.toLocaleString(), label: `${entry.totalCommits.toLocaleString()} commits` };
      case "weekly":
        return { icon: GitCommit, iconClass: "text-green-500", value: (entry.weeklyCommits || 0).toLocaleString(), label: `${(entry.weeklyCommits || 0).toLocaleString()} this week` };
      case "yesterday":
        return { icon: Flame, iconClass: "text-orange-500", value: (entry.yesterdayCommits || 0).toLocaleString(), label: `${(entry.yesterdayCommits || 0).toLocaleString()} yesterday` };
      default:
        return { icon: Flame, iconClass: "text-primary", value: entry.streak.toLocaleString(), label: `${entry.streak.toLocaleString()} days` };
    }
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

  // Sort based on filter (Client-side sorting), then keep only the top 15
  // Streak/This Week/Yesterday only rank users with activity; other tabs show everyone.
  const sortedData = leaderboardData
    ? [...leaderboardData]
      .filter(entry => {
        if (filter === "streak") return entry.streak > 0;
        if (filter === "weekly") return entry.weeklyCommits > 0;
        if (filter === "yesterday") return entry.yesterdayCommits > 0;
        return true;
      })
      .sort((a, b) => {
        if (filter === "streak") return b.streak - a.streak;
        if (filter === "commits") return b.totalCommits - a.totalCommits;
        if (filter === "weekly") return b.weeklyCommits - a.weeklyCommits;
        if (filter === "yesterday") return b.yesterdayCommits - a.yesterdayCommits;
        return b.streak - a.streak; // Default
      })
      .map((entry, index) => ({ ...entry, tabRank: index + 1 }))
      .slice(0, 15) as LeaderboardEntry[]
    : [];

  const topThree = sortedData.slice(0, 3);
  const restOfLeaderboard = sortedData.slice(3);

  // User's rank within the active tab (0 = unranked)
  const userTabRank = currentUser ? sortedData.findIndex(e => e.username === currentUser.username) + 1 : 0;

  return (
    <div className="min-h-screen bg-background custom-scrollbar">
      <Header />

      <main className="container pt-24 pb-32 md:pb-12 space-y-8">
        {shouldShowLoader ? (
          <>
            {/* Skeleton for Your Position */}
            <div className="animate-fade-up" style={{ animationDelay: "0.05s" }}>
              <Section>
                <Skeleton className="h-24 w-full" />
              </Section>
            </div>

            {/* Skeleton for Filter Tabs */}
            <div className="flex gap-2 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-24" />
              ))}
            </div>

            {/* Skeleton for Top 3 Podium */}
            <Section className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
              <div className="flex items-end justify-center gap-2 md:gap-4 h-80">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col items-center">
                    <Skeleton className="w-16 h-16 rounded-full mb-2" />
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-3 w-16 mb-2" />
                    <Skeleton className={`w-20 rounded-t-xl ${i === 2 ? 'h-32' : 'h-24'}`} />
                  </div>
                ))}
              </div>
            </Section>

            {/* Skeleton for Leaderboard List */}
            <Section title="Rankings" className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </Section>
          </>
        ) : (
          <>
            {/* Your Position */}
            {currentUser && (
              <Section className="animate-fade-up" style={{ animationDelay: "0.05s" }}>
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/10">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 text-center flex-shrink-0">
                        {userTabRank > 0 ? (
                          <span className="text-2xl font-bold text-primary">#{userTabRank}</span>
                        ) : (
                          <span className="text-2xl font-bold text-muted-foreground/50">—</span>
                        )}
                      </div>
                      <div className="relative flex-shrink-0">
                        <div className={cn("w-12 h-12 rounded-full border-2 overflow-hidden", currentUser.bestRank === 1 ? "border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.4)]" : "border-primary")}>
                          <img src={currentUser.avatar || ""} alt={currentUser.username} className="w-full h-full object-cover" />
                        </div>
                        {currentUser.bestRank === 1 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg border border-background z-10">
                            <span className="text-[8px]">🐐</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium">Your Position</p>
                        <p className="text-sm text-muted-foreground truncate">@{currentUser.username}</p>
                        {userTabRank === 0 && (
                          <p className="text-sm font-medium text-muted-foreground">You're not in the top 15</p>
                        )}
                      </div>
                    </div>
                    {(() => {
                      const { icon: PosIcon, iconClass, label } = getTabMeta(currentUser);
                      return (
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <PosIcon className={cn("w-4 h-4", iconClass)} />
                            <span className="font-bold text-lg">{label}</span>
                          </div>
                        </div>
                      );
                    })()}
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
                    setVisibleCount(5);
                    triggerHaptic();
                  }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap border",
                    filter === tab.key
                      ? "glass-nav bg-primary/10 border-primary/20 text-foreground"
                      : "border-transparent bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
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
                      <div className="relative mb-2">
                        <div className={cn("w-16 h-16 rounded-full border-2 overflow-hidden", topThree[1].bestRank === 1 ? "border-yellow-500/50 shadow-[0_0_12px_rgba(234,179,8,0.4)]" : "border-gray-400")}>
                          <img src={topThree[1].avatar || ""} alt={topThree[1].username} className="w-full h-full object-cover" />
                        </div>
                        {topThree[1].bestRank === 1 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg border-2 border-background z-10">
                            <span className="text-[10px]">🐐</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate max-w-[80px] text-center">{topThree[1].username}</p>
                      <p className="text-xs text-muted-foreground">{getTabMeta(topThree[1]).label}</p>
                      <div className="w-20 h-24 bg-secondary/50 rounded-t-xl mt-2 flex items-center justify-center border-t border-x border-gray-400/30">
                        <Medal className="w-8 h-8 text-gray-400" />
                      </div>
                    </div>
                  )}

                  {/* 1st Place */}
                  {topThree[0] && (
                    <div className="flex flex-col items-center -mt-8 z-20">
                      <div className="relative mb-2">
                        <div className="w-20 h-20 rounded-full border-2 border-yellow-400 overflow-hidden ring-4 ring-yellow-400/20">
                          <img src={topThree[0].avatar || ""} alt={topThree[0].username} className="w-full h-full object-cover" />
                        </div>
                        <Crown className="w-6 h-6 text-yellow-400 absolute -top-3 left-1/2 -translate-x-1/2" />
                        {topThree[0].bestRank === 1 && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg border-2 border-background z-10 animate-pulse-slow">
                            <span className="text-[12px]">🐐</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate max-w-[100px] text-center">{topThree[0].username}</p>
                      <p className="text-xs text-primary font-bold">{getTabMeta(topThree[0]).label}</p>
                      <div className="w-24 h-32 bg-primary/20 rounded-t-xl mt-2 flex items-center justify-center border-t border-x border-primary/30">
                        <Trophy className="w-10 h-10 text-yellow-400" />
                      </div>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {topThree[2] && (
                    <div className="flex flex-col items-center z-10">
                      <div className="relative mb-2">
                        <div className={cn("w-16 h-16 rounded-full border-2 overflow-hidden", topThree[2].bestRank === 1 ? "border-yellow-500/50 shadow-[0_0_12px_rgba(234,179,8,0.4)]" : "border-amber-600")}>
                          <img src={topThree[2].avatar || ""} alt={topThree[2].username} className="w-full h-full object-cover" />
                        </div>
                        {topThree[2].bestRank === 1 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg border-2 border-background z-10">
                            <span className="text-[10px]">🐐</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate max-w-[80px] text-center">{topThree[2].username}</p>
                      <p className="text-xs text-muted-foreground">{getTabMeta(topThree[2]).label}</p>
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
                {(filter === "streak" ? restOfLeaderboard : restOfLeaderboard.slice(0, visibleCount)).map((entry, index) => {
                  const isUser = user && (entry.username === user.username);
                  const { icon: RowIcon, iconClass, value, label } = getTabMeta(entry);

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
                          {getRankBadge(entry.tabRank || 0)}
                        </div>
                        <div className="relative flex-shrink-0">
                          <div className={cn("w-10 h-10 rounded-full border overflow-hidden", entry.bestRank === 1 ? "border-yellow-500/50 shadow-[0_0_8px_rgba(234,179,8,0.4)]" : "border-border")}>
                            <img src={entry.avatar || ""} alt={entry.username} className="w-full h-full object-cover" />
                          </div>
                          {entry.bestRank === 1 && (
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-600 rounded-full flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.4)] border border-background z-10">
                              <span className="text-[6px]">🐐</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 pr-2">
                          <p className={cn("font-medium truncate", isUser && "text-primary")}>
                            @{entry.username}
                            {isUser && <span className="ml-2 text-xs opacity-70">(You)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{label}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <RowIcon className={cn("w-4 h-4", iconClass)} />
                        <span className="font-bold">{value}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* View More - show next 5 (only on tabs that show the top 15) */}
              {filter !== "streak" && restOfLeaderboard.length > visibleCount && (
                <div className="text-center mt-4 animate-fade-up" style={{ animationDelay: "0.25s" }}>
                  <button
                    onClick={() => {
                      setVisibleCount(c => c + 5);
                      triggerHaptic();
                    }}
                    className="px-6 py-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-all duration-300 text-sm font-medium"
                  >
                    View More
                  </button>
                </div>
              )}

              {/* End note - once the full top 15 is revealed */}
              {(filter === "streak" ? sortedData.length > 0 : visibleCount >= restOfLeaderboard.length) && (
                <div className="text-center mt-6 px-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
                  <p className="text-sm text-muted-foreground">
                    {filter === "streak"
                      ? "Only active streaks make this list — and if you're not on it, yours is just waiting to be lit. Every legend up here started with a single day. Keep the flame alive, and soon they'll be looking up at you."
                      : filter === "weekly"
                        ? "Wondering why you're not on this list? Everyone here shipped at least one commit this week. No commits, no spot — drop one before Sunday and you could be next."
                        : filter === "yesterday"
                          ? "Wondering why you're not on this list? Everyone here shipped a commit yesterday. No commits yesterday, no spot — make one today and you could be next."
                          : "These are the top 15 on the platform — but there's a whole community out there pushing every day. Keep committing, stay consistent, and your spot on this list could be next."}
                  </p>
                </div>
              )}
            </Section>

            {/* Empty State */}
            {topThree.length === 0 && (
              <div className="text-center py-20 text-muted-foreground animate-fade-up">
                <p>No one's on the leaderboard yet. Join and be the first!</p>
              </div>
            )}
          </>
        )}
      </main>

      <FloatingNav />
    </div>
  );
}
