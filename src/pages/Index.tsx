
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
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { getApiUrl } from "@/lib/api-config";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Goal {
  id: number;
  title: string;
  type: string;
  current: number;
  target: number;
  completed: boolean;
  dueDate?: string;
}

interface UserProfile {
  streak: number;
  longestStreak: number;
  todayCommits: number;
  weeklyCommits: number;
  activeDays: number;
  totalProjects: number;
  contributionData: any[];
  yesterdayCommits: number; // For TodayStatus fallback logic compatibility
  [key: string]: any;
}

export default function Index() {
  const { data: session } = useSession();
  const sessionUser = session?.user as any;

  // Use React Query for caching and instant data on navigation
  const { data: profile } = useQuery({
    queryKey: ['dashboardProfile'],
    queryFn: async () => {
      // Even if we have initial data, we might want to fetch fresh
      const url = getApiUrl('/api/user/profile');
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch fresh profile");
      const data = await res.json();
      return data.user;
    },
    // Use session data as initial placeholder to render immediately
    initialData: sessionUser ? {
      streak: sessionUser.streak || 0,
      longestStreak: sessionUser.longestStreak || 0,
      todayCommits: sessionUser.todayCommits || 0,
      weeklyCommits: sessionUser.weeklyCommits || 0,
      activeDays: sessionUser.activeDays || 0,
      totalProjects: sessionUser.totalProjects || 0,
      contributionData: sessionUser.contributionData || [],
      yesterdayCommits: sessionUser.yesterdayCommits || 0,
      ...sessionUser
    } : undefined,
    staleTime: 0, // Always consider data stale to force background refresh (Syncing)
    refetchOnMount: true, // Refetch when component mounts (visiting page)
    refetchOnWindowFocus: true, // Refetch when window gains focus
    placeholderData: (previousData) => previousData, // Keep showing previous data while fetching new data
    enabled: !!sessionUser, // Only fetch if we have a session
  });

  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);

  // Fetch goals separately (could also be a query, but keeping simple for now)
  useEffect(() => {
    if (sessionUser) {
      const fetchGoals = async () => {
        try {
          const res = await fetch(getApiUrl("/api/goals"), {
            credentials: "include"
          });
          if (res.ok) {
            const data = await res.json();
            setGoals(data.goals || []);
          }
        } catch (e) {
          console.error("Failed to fetch goals", e);
        } finally {
          setIsLoadingGoals(false);
        }
      };
      fetchGoals();
    }
  }, [sessionUser]);

  // Handle welcome toasts
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

  // Parse contribution data for weekly chart
  const weeklyChartData = useMemo(() => {
    // We strictly need the profile to be loaded
    if (!profile?.contributionData || !Array.isArray(profile.contributionData) || profile.contributionData.length === 0) {
      // Fallback: Return empty/zeros with correct labels
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const today = new Date().getDay(); // 0 = Sun
      // We want last 7 days ending today
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const d = (today - i + 7) % 7;
        result.push({ day: days[d], value: 0 });
      }
      return result;
    }

    // user.contributionData is ordered [Today, Yesterday, ...] (Desceding Date)
    // We want the chart to show [6 days ago, ..., Today] (Ascending Date)
    // So we take the first 7 items (which are the most recent 7 days) and REVERSE them.
    const last7Days = profile.contributionData.slice(0, 7).reverse();

    return last7Days.map((d: any) => {
      // If d.date is "YYYY-MM-DD", new Date(d.date) might be UTC or local depending on parsing.
      // Usually strings like "2024-01-23" are parsed as UTC midnight.
      // To get the day name correctly, we should trust the date string more than timezone offset if possible,
      // but standard Date parsing usually works fine for "Day of week" unless we are on the edge.
      const date = new Date(d.date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }); // Force UTC to avoid timezone shifting date
      return {
        day: dayName,
        value: d.contributionCount
      };
    });
  }, [profile?.contributionData]);

  const activeDaysCount = profile?.activeDays || 0;
  const currentGoal = goals.find(g => !g.completed);

  // Generate dynamic insights
  const insights = useMemo(() => {
    if (!profile) return [];

    const arr = [];
    if (profile.streak > 5) {
      arr.push(`You're on a ${profile.streak}-day streak! Consistency is key.`);
    }
    if (profile.weeklyCommits > 10) {
      arr.push(`You've made ${profile.weeklyCommits} commits this week. Great work!`);
    } else if (profile.weeklyCommits === 0) {
      arr.push("No commits this week yet. Ready to start?");
    }

    if (currentGoal) {
      const percent = Math.round((currentGoal.current / currentGoal.target) * 100);
      if (percent >= 50) {
        arr.push(`You're halfway through your '${currentGoal.title}' goal!`);
      }
    }

    // Fallback insight
    if (arr.length === 0) {
      arr.push("Connect GitHub to see personalized insights about your coding habits.");
      arr.push("Start a new goal to track your progress.");
    }

    return arr.slice(0, 2); // Return top 2
  }, [profile, currentGoal]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden custom-scrollbar">
      <Header />

      <main className="w-full max-w-[1600px] mx-auto px-4 md:px-8 pt-24 pb-32 md:pb-12 space-y-8">
        {/* Hero Streak Section */}
        <section className="animate-fade-in">
          <StreakDisplay current={profile?.streak || 0} longest={Math.max(profile?.streak || 0, profile?.longestStreak || 0)} />
        </section>

        <div className="flex flex-col md:grid md:grid-cols-3 gap-8 md:items-start">
          {/* Main Content Column - Charts & History */}
          <div className="md:col-span-2 space-y-8 order-2 md:order-1">
            {/* Weekly Activity Chart */}
            <Section
              title="This Week"
              className="animate-fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              <WeeklyChart data={weeklyChartData} />
            </Section>

            {/* Contribution Grid */}
            <Section
              title="Activity History"
              className="animate-fade-up"
              style={{ animationDelay: "0.25s" }}
            >
              <ActivityGrid data={profile?.contributionData} loading={!profile} weeks={46} />
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

          {/* Sidebar Column - Stats & Goals */}
          <div className="space-y-8 md:sticky md:top-24 text-left order-1 md:order-2">
            {/* Today's Status */}
            <Section className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
              <TodayStatus
                active={(profile?.todayCommits || 0) > 0}
                commits={profile?.todayCommits || 0}
                lastActivity="Recently"
              />
            </Section>

            {/* Stats Row */}
            <Section className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
              <div className="grid grid-cols-3 gap-4">
                <StatItem
                  label="This Week"
                  value={profile?.weeklyCommits || 0}
                  subtext="commits"
                  className="items-center text-center md:items-start md:text-left"
                />
                <StatItem
                  label="Active Days"
                  value={`${activeDaysCount}/7`}
                  subtext="this week"
                  className="items-center text-center md:items-start md:text-left"
                />
                <StatItem
                  label="Repos"
                  value={profile?.totalProjects || 0}
                  subtext="touched"
                  className="items-center text-center md:items-start md:text-left"
                />
              </div>
            </Section>

            {/* Current Goal */}
            <Section
              title="Current Goal"
              className="animate-fade-up"
              style={{ animationDelay: "0.3s" }}
            >
              {currentGoal ? (
                <div onClick={() => window.location.href = '/goals'} className="cursor-pointer hover:opacity-80 transition-opacity">
                  <GoalProgress
                    title={currentGoal.title}
                    current={currentGoal.current}
                    target={currentGoal.target}
                  />
                  <p className="text-xs text-muted-foreground mt-2 text-right">View all goals &rarr;</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                  <p className="mb-3 text-sm">No active goals</p>
                  <Link to="/goals">
                    <Button size="sm" variant="outline" className="gap-2">
                      <Plus className="w-4 h-4" /> Set a Goal
                    </Button>
                  </Link>
                </div>
              )}
            </Section>

            {/* Insights */}
            <Section
              title="Insights"
              className="animate-fade-up space-y-3"
              style={{ animationDelay: "0.35s" }}
            >
              {insights.map((text, i) => (
                <InsightCard key={i} text={text} type={i === 0 ? "trend" : "achievement"} />
              ))}
            </Section>
          </div>
        </div>
      </main>

      <FloatingNav />
    </div>
  );
}
