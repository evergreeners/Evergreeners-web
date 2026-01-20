import { Header } from "@/components/Header";
import { FloatingNav } from "@/components/FloatingNav";
import { StreakDisplay } from "@/components/StreakDisplay";
import { TodayStatus } from "@/components/TodayStatus";
import { WeeklyChart } from "@/components/WeeklyChart";
import { ActivityGrid } from "@/components/ActivityGrid";
import { GoalProgress } from "@/components/GoalProgress";
import { InsightCard } from "@/components/InsightCard";
import { StatItem } from "@/components/StatItem";
import { Section } from "@/components/Section";

// Mock data
const weeklyData = [
  { day: "Mon", value: 8 },
  { day: "Tue", value: 12 },
  { day: "Wed", value: 5 },
  { day: "Thu", value: 15 },
  { day: "Fri", value: 9 },
  { day: "Sat", value: 3 },
  { day: "Sun", value: 7 },
];

// Generate random activity data for contribution grid (12 weeks)
const activityData = Array.from({ length: 84 }, () =>
  Math.random() > 0.3 ? Math.floor(Math.random() * 5) : 0
);

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

export default function Index() {
  const { data: session } = useSession();
  const user = session?.user as any;

  useEffect(() => {
    if (localStorage.getItem("login_success") === "true") {
      toast.success("Welcome back!", {
        description: "Let's keep that streak alive.",
      });
      localStorage.removeItem("login_success");
    } else if (localStorage.getItem("signup_success") === "true") {
      toast.success("Welcome to Evergreeners!", {
        description: "Your journey starts now.",
      });
      localStorage.removeItem("signup_success");
    }
  }, []);
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container-fluid px-4 md:px-8 pt-24 pb-32 md:pb-12 space-y-8">
        {/* Hero Streak Section */}
        <section className="animate-fade-in">
          <StreakDisplay current={user?.streak || 0} longest={user?.longestStreak || 0} />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:items-start">
          {/* Main Content Column */}
          <div className="md:col-span-2 space-y-8">
            {/* Weekly Activity Chart */}
            <Section
              title="This Week"
              className="animate-fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              <WeeklyChart data={weeklyData} />
            </Section>

            {/* Contribution Grid */}
            <Section
              title="Last 12 Weeks"
              className="animate-fade-up"
              style={{ animationDelay: "0.25s" }}
            >
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
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8 md:sticky md:top-24 text-left">
            {/* Today's Status */}
            <Section className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
              <TodayStatus
                active={user?.yesterdayCommits > 0}
                commits={user?.yesterdayCommits || 0}
                lastActivity="2 hours ago"
              />
            </Section>

            {/* Stats Row */}
            <Section className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
              <div className="grid grid-cols-3 gap-4">
                <StatItem label="This Week" value={user?.weeklyCommits || 0} subtext="commits" />
                <StatItem label="Active Days" value="5/7" subtext="this week" />
                <StatItem label="Repos" value="3" subtext="touched" />
              </div>
            </Section>

            {/* Current Goal */}
            <Section
              title="Current Goal"
              className="animate-fade-up"
              style={{ animationDelay: "0.3s" }}
            >
              <GoalProgress
                title="Maintain 30-day streak"
                current={47}
                target={30}
              />
            </Section>

            {/* Insights */}
            <Section
              title="Insights"
              className="animate-fade-up space-y-3"
              style={{ animationDelay: "0.35s" }}
            >
              <InsightCard text="You code most consistently on Thursdays. Your productivity peaks mid-week." />
              <InsightCard text="You're 23% more active this month compared to last month. Keep it up!" />
            </Section>
          </div>
        </div>
      </main>

      <FloatingNav />
    </div>
  );
}
