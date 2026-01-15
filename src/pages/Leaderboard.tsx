import { Header } from "@/components/Header";
import { FloatingNav } from "@/components/FloatingNav";
import { Section } from "@/components/Section";
import { Trophy, Medal, Flame, Crown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface LeaderboardEntry {
  rank: number;
  previousRank: number;
  username: string;
  avatar: string;
  streak: number;
  totalCommits: number;
  isCurrentUser?: boolean;
}

const leaderboardData: LeaderboardEntry[] = [
  { rank: 1, previousRank: 1, username: "sarah_codes", avatar: "https://avatars.githubusercontent.com/u/2?v=4", streak: 187, totalCommits: 5420 },
  { rank: 2, previousRank: 3, username: "dev_marcus", avatar: "https://avatars.githubusercontent.com/u/3?v=4", streak: 156, totalCommits: 4890 },
  { rank: 3, previousRank: 2, username: "codemaster_jin", avatar: "https://avatars.githubusercontent.com/u/4?v=4", streak: 142, totalCommits: 4567 },
  { rank: 4, previousRank: 5, username: "frontend_lisa", avatar: "https://avatars.githubusercontent.com/u/5?v=4", streak: 128, totalCommits: 4123 },
  { rank: 5, previousRank: 4, username: "rust_lover", avatar: "https://avatars.githubusercontent.com/u/6?v=4", streak: 115, totalCommits: 3890 },
  { rank: 6, previousRank: 8, username: "go_gopher", avatar: "https://avatars.githubusercontent.com/u/7?v=4", streak: 98, totalCommits: 3654 },
  { rank: 7, previousRank: 6, username: "pythonista_dev", avatar: "https://avatars.githubusercontent.com/u/8?v=4", streak: 92, totalCommits: 3421 },
  { rank: 8, previousRank: 7, username: "typescript_ninja", avatar: "https://avatars.githubusercontent.com/u/9?v=4", streak: 87, totalCommits: 3210 },
  { rank: 9, previousRank: 12, username: "react_queen", avatar: "https://avatars.githubusercontent.com/u/10?v=4", streak: 76, totalCommits: 2987 },
  { rank: 10, previousRank: 9, username: "backend_boss", avatar: "https://avatars.githubusercontent.com/u/11?v=4", streak: 71, totalCommits: 2845 },
  // ... more entries
  { rank: 24, previousRank: 28, username: "alexdev", avatar: "https://avatars.githubusercontent.com/u/1?v=4", streak: 47, totalCommits: 2847, isCurrentUser: true },
];

type FilterType = "streak" | "commits" | "weekly";

export default function Leaderboard() {
  const [filter, setFilter] = useState<FilterType>("streak");
  const currentUser = leaderboardData.find(e => e.isCurrentUser);

  const getRankChange = (current: number, previous: number) => {
    if (current < previous) return { icon: TrendingUp, class: "text-primary", text: `+${previous - current}` };
    if (current > previous) return { icon: TrendingDown, class: "text-destructive", text: `-${current - previous}` };
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
      
      <main className="container pt-24 pb-32 space-y-8">
        {/* Page Header */}
        <section className="animate-fade-in">
          <h1 className="text-3xl font-bold text-gradient flex items-center gap-3">
            <Trophy className="w-8 h-8" /> Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1">Top developers by consistency</p>
        </section>

        {/* Your Position */}
        {currentUser && (
          <Section className="animate-fade-up" style={{ animationDelay: "0.05s" }}>
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-primary overflow-hidden">
                      <img src={currentUser.avatar} alt={currentUser.username} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      #{currentUser.rank}
                    </div>
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
                      const change = getRankChange(currentUser.rank, currentUser.previousRank);
                      return (
                        <>
                          <change.icon className={cn("w-3 h-3", change.class)} />
                          <span className={change.class}>{change.text} this week</span>
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
        <div className="flex gap-2 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          {([
            { key: "streak", label: "Streak" },
            { key: "commits", label: "Commits" },
            { key: "weekly", label: "This Week" },
          ] as { key: FilterType; label: string }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
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
        <Section className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-end justify-center gap-4 h-48">
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-gray-400 overflow-hidden mb-2">
                <img src={leaderboardData[1].avatar} alt={leaderboardData[1].username} className="w-full h-full object-cover" />
              </div>
              <p className="text-sm font-medium truncate max-w-20">{leaderboardData[1].username.split('_')[0]}</p>
              <p className="text-xs text-muted-foreground">{leaderboardData[1].streak} days</p>
              <div className="w-20 h-24 bg-secondary/50 rounded-t-xl mt-2 flex items-center justify-center border-t border-x border-gray-400/30">
                <Medal className="w-8 h-8 text-gray-400" />
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center -mt-8">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-2 border-yellow-400 overflow-hidden mb-2 ring-4 ring-yellow-400/20">
                  <img src={leaderboardData[0].avatar} alt={leaderboardData[0].username} className="w-full h-full object-cover" />
                </div>
                <Crown className="w-6 h-6 text-yellow-400 absolute -top-3 left-1/2 -translate-x-1/2" />
              </div>
              <p className="text-sm font-medium truncate max-w-24">{leaderboardData[0].username.split('_')[0]}</p>
              <p className="text-xs text-primary font-bold">{leaderboardData[0].streak} days</p>
              <div className="w-24 h-32 bg-primary/20 rounded-t-xl mt-2 flex items-center justify-center border-t border-x border-primary/30">
                <Trophy className="w-10 h-10 text-yellow-400" />
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-amber-600 overflow-hidden mb-2">
                <img src={leaderboardData[2].avatar} alt={leaderboardData[2].username} className="w-full h-full object-cover" />
              </div>
              <p className="text-sm font-medium truncate max-w-20">{leaderboardData[2].username.split('_')[0]}</p>
              <p className="text-xs text-muted-foreground">{leaderboardData[2].streak} days</p>
              <div className="w-20 h-20 bg-secondary/50 rounded-t-xl mt-2 flex items-center justify-center border-t border-x border-amber-600/30">
                <Medal className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          </div>
        </Section>

        {/* Full Leaderboard */}
        <Section title="Rankings" className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="space-y-2">
            {leaderboardData.slice(3).map((entry, index) => {
              const change = getRankChange(entry.rank, entry.previousRank);
              return (
                <div 
                  key={entry.username}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:scale-[1.01]",
                    entry.isCurrentUser 
                      ? "border-primary/50 bg-primary/10" 
                      : "border-border bg-secondary/30 hover:bg-secondary/50"
                  )}
                  style={{ animationDelay: `${0.05 * index}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 text-center">
                      {getRankBadge(entry.rank)}
                    </div>
                    <div className="w-10 h-10 rounded-full border border-border overflow-hidden">
                      <img src={entry.avatar} alt={entry.username} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className={cn("font-medium", entry.isCurrentUser && "text-primary")}>
                        @{entry.username}
                        {entry.isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{entry.totalCommits.toLocaleString()} commits</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <change.icon className={cn("w-3 h-3", change.class)} />
                      <span className={cn("text-xs", change.class)}>{change.text}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-primary" />
                      <span className="font-bold">{entry.streak}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Load More */}
        <div className="text-center animate-fade-up" style={{ animationDelay: "0.25s" }}>
          <button className="px-6 py-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-all duration-300 text-sm font-medium">
            Load More
          </button>
        </div>
      </main>

      <FloatingNav />
    </div>
  );
}
