import { AcademyHeader } from "@/components/AcademyHeader";
import { FloatingNav } from "@/components/FloatingNav";
import { Section } from "@/components/Section";
import { Trophy, Medal, GitPullRequest, BookOpen, Loader2, Crown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { getApiUrl } from "@/lib/api-config";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  status: string;
  lessonsCompleted: number;
  totalLessons: number;
  prScore: number | null;
  joinedAt: string | null;
}

const medalStyles = ["bg-amber-400/20 text-amber-400 border-amber-400/40", "bg-zinc-300/20 text-zinc-300 border-zinc-300/40", "bg-amber-700/20 text-amber-700 border-amber-700/40"];

function rankBadge(rank: number) {
  if (rank <= 3) {
    const icon = rank === 1 ? <Crown className="w-3.5 h-3.5" /> : <Medal className="w-3.5 h-3.5" />;
    return <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs ${medalStyles[rank - 1]}`}>{icon}</div>;
  }
  return <div className="w-8 h-8 rounded-full border border-border bg-secondary/30 flex items-center justify-center font-mono text-xs font-bold text-muted-foreground">{rank}</div>;
}

export default function AcademyLeaderboard() {
  const { data: session } = useSession();

  const { data: lbData, isLoading } = useQuery<{ success: boolean; leaderboard: LeaderboardEntry[] }>({
    queryKey: ['academyLeaderboard'],
    queryFn: async () => {
      const res = await fetch(getApiUrl('/api/academy/leaderboard'));
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
  });

  const entries = lbData?.leaderboard ?? [];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden custom-scrollbar relative">
      <style>{`
        .cyber-background {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background-color: #050505;
          background-image:
            radial-gradient(circle at center, transparent 30%, #000 90%),
            linear-gradient(rgba(74, 222, 128, 0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(74, 222, 128, 0.07) 1px, transparent 1px),
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size:
            100% 100%,
            60px 60px,
            60px 60px,
            20px 20px,
            20px 20px;
          animation: cyber-move 20s linear infinite;
          z-index: 0;
          pointer-events: none;
        }
        @keyframes cyber-move {
          0%   { background-position: 0 0, 0 0, 0 0, 0 0, 0 0; }
          100% { background-position: 0 0, 60px 60px, 60px 60px, 40px 40px, 40px 40px; }
        }
      `}</style>

      <div className="cyber-background" />
      <AcademyHeader />

      <main className="w-full max-w-3xl mx-auto px-4 md:px-8 pt-24 pb-32 md:pb-12 space-y-8 relative z-10">
        <Section
          title="Cohort Leaderboard"
          subtitle="Ranked by lessons completed, then capstone PR review score."
          className="text-center"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mt-4">
            <Trophy className="w-4 h-4" /> Top students in this cohort
          </div>
        </Section>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading leaderboard...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center space-y-3">
            <p className="text-sm text-muted-foreground">No students yet — the first cohort fills after enrollment opens.</p>
            <Link to="/academy" className="inline-flex text-sm font-semibold text-primary hover:underline">
              Back to the Academy →
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-primary/20 bg-card overflow-hidden">
            {entries.map((entry, idx) => {
              const initials = (entry.name || entry.username || "?").split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
              const isGraduated = entry.status === "graduated";
              const percent = Math.round((entry.lessonsCompleted / entry.totalLessons) * 100);
              const isMe = session?.user?.id === entry.id;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 px-4 py-3.5 ${idx !== entries.length - 1 ? "border-b border-border" : ""} ${isMe ? "bg-primary/5" : ""}`}
                >
                  {rankBadge(entry.rank)}

                  <Avatar className="w-10 h-10 border border-primary/20 shrink-0">
                    {entry.image ? <AvatarImage src={entry.image} alt={entry.name} /> : null}
                    <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">{initials || "?"}</AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold truncate">{entry.name}</span>
                      {entry.username && <span className="text-xs text-muted-foreground truncate">@{entry.username}</span>}
                      {isGraduated && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                          <Crown className="w-3 h-3" /> Graduated
                        </span>
                      )}
                      {isMe && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-foreground bg-secondary/40 border border-border px-2 py-0.5 rounded-full">You</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <BookOpen className="w-3 h-3 text-primary shrink-0" />
                      <Progress value={percent} className="h-1.5 flex-1" />
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">{entry.lessonsCompleted}/{entry.totalLessons}</span>
                    </div>
                  </div>

                  {entry.prScore != null && (
                    <div className="flex flex-col items-center shrink-0">
                      <span className="flex items-center gap-1 text-sm font-bold font-mono text-primary">
                        <GitPullRequest className="w-3.5 h-3.5" /> {entry.prScore}/10
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">PR grade</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <FloatingNav />
    </div>
  );
}