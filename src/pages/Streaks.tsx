import { Header } from "@/components/Header";
import { FloatingNav } from "@/components/FloatingNav";
import { Section } from "@/components/Section";
import { Flame, Calendar, Trophy, Zap, Shield, Award, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface StreakHistory {
  id: number;
  startDate: string;
  endDate: string;
  length: number;
  reason?: string;
}

const streakHistory: StreakHistory[] = [
  { id: 1, startDate: "Dec 1", endDate: "Now", length: 47, reason: undefined },
  { id: 2, startDate: "Oct 15", endDate: "Nov 28", length: 44, reason: "Vacation" },
  { id: 3, startDate: "Sep 1", endDate: "Oct 12", length: 41, reason: "Sick day" },
  { id: 4, startDate: "Jul 5", endDate: "Aug 20", length: 46, reason: "Travel" },
  { id: 5, startDate: "May 1", endDate: "Jun 30", length: 61, reason: "Conference" },
];

const badges = [
  { name: "First Week", icon: Zap, earned: true, description: "Complete 7-day streak" },
  { name: "Consistent", icon: Star, earned: true, description: "30-day streak" },
  { name: "Unstoppable", icon: Flame, earned: true, description: "60-day streak" },
  { name: "Legend", icon: Trophy, earned: false, description: "100-day streak" },
  { name: "Immortal", icon: Shield, earned: false, description: "365-day streak" },
  { name: "Champion", icon: Award, earned: false, description: "Top 10 leaderboard" },
];

export default function Streaks() {
  const [selectedHistory, setSelectedHistory] = useState<StreakHistory | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentStreak = 47;
  const longestStreak = 63;

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const isCurrentMonth = (date: Date) => {
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="min-h-screen bg-background custom-scrollbar">
      <Header />

      <main className="w-full max-w-[1600px] mx-auto px-4 pt-24 pb-32 md:px-8 md:pb-12 space-y-8">
        {/* Hero Section */}
        <section className="animate-fade-in text-center py-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 blur-3xl bg-primary/30 rounded-full scale-150 animate-pulse-slow" />
            <div className="relative">
              <div className="flex items-center justify-center gap-4">
                <Flame className="w-16 h-16 text-primary animate-pulse-slow" />
                <span className="text-9xl font-bold text-gradient">{currentStreak}</span>
              </div>
              <p className="text-xl text-muted-foreground mt-4">day streak</p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{longestStreak}</p>
              <p className="text-sm text-muted-foreground">longest streak</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">5</p>
              <p className="text-sm text-muted-foreground">total streaks</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Calendar */}
            <Section className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
              <div className="p-6 md:p-8 rounded-2xl border border-border bg-card/30 backdrop-blur-sm w-full">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 pl-2">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={prevMonth}
                      className="p-3 rounded-xl hover:bg-secondary transition-all hover:scale-105 active:scale-95"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={nextMonth}
                      className="p-3 rounded-xl hover:bg-secondary transition-all hover:scale-105 active:scale-95"
                      aria-label="Next month"
                      disabled={isCurrentMonth(currentDate)}
                    >
                      <ChevronRight className={cn(
                        "w-5 h-5",
                        isCurrentMonth(currentDate) ? "text-muted-foreground/30" : "text-muted-foreground"
                      )} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 md:gap-4">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                    <div key={i} className="text-center text-sm font-semibold text-muted-foreground/70 py-3 uppercase tracking-wider">{day}</div>
                  ))}

                  {/* Calendar Days generation */}
                  {(() => {
                    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
                    const totalSlots = 42; // 6 rows * 7 columns (fixed height)

                    const days = [];
                    const today = new Date();
                    const isTodayInView = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

                    // Empty cells for offset (Previous month days could technically go here for completeness, but keeping empty for now as simple offset)
                    for (let i = 0; i < firstDayOfMonth; i++) {
                      days.push(<div key={`empty-prev-${i}`} className="w-full aspect-square md:h-24 md:w-full" />);
                    }

                    // Actual days
                    for (let i = 1; i <= daysInMonth; i++) {
                      // Deterministic "random" for demo purposes based on date
                      const seed = currentDate.getFullYear() * 10000 + (currentDate.getMonth() + 1) * 100 + i;
                      const randomActive = (Math.sin(seed) * 10000) % 1 > 0.3;

                      const isPast = currentDate < today || (isTodayInView && i <= today.getDate());
                      const isActive = isPast && randomActive;
                      const isToday = isTodayInView && i === today.getDate();

                      days.push(
                        <div
                          key={i}
                          className={cn(
                            "w-full aspect-square md:h-24 flex items-center justify-center rounded-2xl text-lg font-medium transition-all duration-300 relative group border",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(0,255,0,0.3)] border-primary/20 scale-100"
                              : "bg-secondary/30 text-muted-foreground/60 border-transparent hover:border-border/50",
                            !isActive && !isToday && "hover:bg-secondary/60 hover:scale-[1.02] cursor-pointer",
                            isToday && !isActive && "ring-2 ring-primary bg-secondary/40 text-foreground shadow-sm",
                            isToday && isActive && "ring-4 ring-primary ring-offset-4 ring-offset-background"
                          )}
                        >
                          {i}
                          {isActive && (
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      );
                    }

                    // Fill remaining slots to maintain height
                    const remainingSlots = totalSlots - (firstDayOfMonth + daysInMonth);
                    for (let i = 1; i <= remainingSlots; i++) {
                      days.push(
                        <div key={`empty-next-${i}`} className="w-full aspect-square md:h-24 flex items-center justify-center">
                          <span className="text-muted-foreground/10 text-lg">{i}</span>
                        </div>
                      );
                    }

                    return days;
                  })()}
                </div>
              </div>
            </Section>

            {/* Badges */}
            <Section title="Badges" className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {badges.map((badge) => (
                  <div
                    key={badge.name}
                    className={cn(
                      "flex flex-col items-center p-4 rounded-xl border transition-all duration-300 group cursor-pointer hover:scale-105 hover:shadow-lg",
                      badge.earned
                        ? "border-primary/30 bg-primary/10"
                        : "border-border bg-secondary/30 opacity-50"
                    )}
                  >
                    <badge.icon className={cn(
                      "w-8 h-8 mb-2",
                      badge.earned ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className="text-xs font-medium text-center">{badge.name}</span>
                    <span className="text-[10px] text-muted-foreground text-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 bg-background/95 p-1 rounded shadow-sm border border-border z-10 whitespace-nowrap">
                      {badge.description}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-8">
            {/* Streak Rules */}
            <Section title="Streak Rules" className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
              <div className="p-5 rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
                <div className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <p>At least 1 meaningful GitHub contribution per day</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <p>Commits, PRs, reviews, and issues all count</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <p>Based on your timezone (configurable in settings)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <p>Streak breaks at midnight if no activity</p>
                  </div>
                </div>
              </div>
            </Section>

            {/* Streak Protection */}
            <Section title="Streak Protection" className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <div className="p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-500">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Freeze Days: 2</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Use a freeze to protect your streak on days you can't code.
                      You earn 1 freeze for every 30-day streak.
                    </p>
                  </div>
                </div>
              </div>
            </Section>

            {/* Streak History */}
            <Section title="Streak History" className="animate-fade-up" style={{ animationDelay: "0.25s" }}>
              <div className="space-y-3">
                {streakHistory.map((streak, index) => (
                  <div
                    key={streak.id}
                    onClick={() => setSelectedHistory(selectedHistory?.id === streak.id ? null : streak)}
                    className={cn(
                      "p-4 rounded-xl border transition-all duration-300 cursor-pointer",
                      index === 0
                        ? "border-primary/50 bg-primary/10"
                        : "border-border bg-secondary/30 hover:bg-secondary/50",
                      selectedHistory?.id === streak.id && "ring-1 ring-primary shadow-lg"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", index === 0 ? "bg-primary/20" : "bg-secondary")}>
                          <Flame className={cn(
                            "w-4 h-4",
                            index === 0 ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{streak.length} days</p>
                          <p className="text-xs text-muted-foreground">
                            {streak.startDate} - {streak.endDate}
                          </p>
                        </div>
                      </div>
                      {streak.reason && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-secondary text-muted-foreground/70">
                          {streak.reason}
                        </span>
                      )}
                    </div>
                    {selectedHistory?.id === streak.id && (
                      <div className="mt-4 pt-4 border-t border-border animate-fade-in">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          You maintained consistent activity during this period.
                          {streak.reason
                            ? ` The streak ended due to ${streak.reason.toLowerCase()}.`
                            : " Keep going!"}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </div>
      </main>

      <FloatingNav />
    </div>
  );
}
