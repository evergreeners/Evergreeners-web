import { Header } from "@/components/Header";
import { FloatingNav } from "@/components/FloatingNav";
import { Section } from "@/components/Section";
import { Flame, Calendar, Trophy, Zap, Shield, Award, Star } from "lucide-react";
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

const streakCalendar = Array.from({ length: 31 }, (_, i) => ({
  day: i + 1,
  active: i < 17 || Math.random() > 0.3, // First 17 days of current month active
}));

export default function Streaks() {
  const [selectedHistory, setSelectedHistory] = useState<StreakHistory | null>(null);
  const currentStreak = 47;
  const longestStreak = 63;

  return (
    <div className="min-h-screen bg-background custom-scrollbar">
      <Header />
      
      <main className="container pt-24 pb-32 space-y-8">
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

        {/* Streak Rules */}
        <Section title="Streak Rules" className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p>At least 1 meaningful GitHub contribution per day</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p>Commits, PRs, reviews, and issues all count</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p>Based on your timezone (configurable in settings)</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p>Streak breaks at midnight if no activity</p>
            </div>
          </div>
        </Section>

        {/* This Month Calendar */}
        <Section title="December 2024" className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <div className="grid grid-cols-7 gap-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <div key={i} className="text-center text-xs text-muted-foreground py-2">{day}</div>
            ))}
            {/* Empty cells for offset */}
            {Array.from({ length: 0 }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {streakCalendar.map((day) => (
              <div
                key={day.day}
                className={cn(
                  "aspect-square rounded-lg flex items-center justify-center text-sm transition-all duration-300 hover:scale-110 cursor-pointer",
                  day.active 
                    ? "bg-primary/20 text-primary border border-primary/30" 
                    : "bg-secondary/50 text-muted-foreground"
                )}
              >
                {day.day}
              </div>
            ))}
          </div>
        </Section>

        {/* Badges */}
        <Section title="Badges" className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {badges.map((badge) => (
              <div 
                key={badge.name}
                className={cn(
                  "flex flex-col items-center p-4 rounded-xl border transition-all duration-300 group cursor-pointer hover:scale-105",
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
                <span className="text-[10px] text-muted-foreground text-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {badge.description}
                </span>
              </div>
            ))}
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
                  selectedHistory?.id === streak.id && "ring-1 ring-primary"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Flame className={cn(
                      "w-5 h-5",
                      index === 0 ? "text-primary" : "text-muted-foreground"
                    )} />
                    <div>
                      <p className="font-medium">{streak.length} days</p>
                      <p className="text-xs text-muted-foreground">
                        {streak.startDate} - {streak.endDate}
                      </p>
                    </div>
                  </div>
                  {streak.reason && (
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                      Ended: {streak.reason}
                    </span>
                  )}
                </div>
                {selectedHistory?.id === streak.id && (
                  <div className="mt-4 pt-4 border-t border-border animate-fade-in">
                    <p className="text-sm text-muted-foreground">
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

        {/* Streak Protection */}
        <Section title="Streak Protection" className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <div className="p-4 rounded-xl border border-border bg-secondary/30">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Freeze Days Available: 2</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Use a freeze to protect your streak on days you can't code. 
                  You earn 1 freeze for every 30-day streak.
                </p>
              </div>
            </div>
          </div>
        </Section>
      </main>

      <FloatingNav />
    </div>
  );
}
