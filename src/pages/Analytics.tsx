import { Header } from "@/components/Header";
import { FloatingNav } from "@/components/FloatingNav";
import { Section } from "@/components/Section";
import { ActivityGrid } from "@/components/ActivityGrid";
import { InsightCard } from "@/components/InsightCard";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Calendar, GitCommit, GitPullRequest, Clock } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { format, subMonths, startOfMonth, parseISO, getDay } from "date-fns";
import { getApiUrl } from "@/lib/api-config";

type TimeRange = "week" | "month" | "year";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [loading, setLoading] = useState(true);

  // ... (stats, state definitions)

  const [stats, setStats] = useState([
    { label: "Total Commits", value: "0", change: "0%", trend: "up", icon: GitCommit },
    { label: "Pull Requests", value: "0", change: "0%", trend: "up", icon: GitPullRequest },
    { label: "Active Days", value: "0", change: "0%", trend: "down", icon: Calendar },
    { label: "Avg. Daily", value: "0", change: "0%", trend: "up", icon: Clock },
  ]);

  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [weeklyCommits, setWeeklyCommits] = useState<any[]>([]);
  const [languageData, setLanguageData] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<number[]>(Array(365).fill(0));
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const session = await authClient.getSession();
        if (!session.data?.session) return;

        const url = getApiUrl("/api/user/profile");
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${session.data.session.token}`
          },
          credentials: "include" // Ensure cookies are sent if needed by backend configuration
        });

        if (!res.ok) throw new Error("Failed to fetch profile");

        const { user } = await res.json();

        // 1. Process Stats
        const totalCommits = user.totalCommits || 0;
        const totalPRs = user.totalPullRequests || user.total_prs || 0;
        const activeDays = user.activeDays || 0;
        // Simple avg daily: total commits / 365 (cap at reasonable start date if needed)
        const avgDaily = (totalCommits / 365).toFixed(1);

        setStats([
          { label: "Total Commits", value: totalCommits.toLocaleString(), change: "+", trend: "up", icon: GitCommit },
          { label: "Pull Requests", value: totalPRs.toLocaleString(), change: "+", trend: "up", icon: GitPullRequest },
          { label: "Active Days", value: activeDays.toString(), change: "", trend: "up", icon: Calendar },
          { label: "Avg. Daily", value: avgDaily, change: "", trend: "up", icon: Clock },
        ]);

        // 2. Process Languages
        // languages_data is stored as array of objects {name, value, color} based on our lib/github.ts
        if (user.languages || user.languages_data) {
          const langs = (user.languages || user.languages_data).map((l: any) => ({
            name: l.name,
            value: l.value || l.size, // Handle different formats if any
            color: l.color
          }));
          setLanguageData(langs);
        }

        // 3. Process Contribution Data (Calendar)
        if (user.contributionData) {
          const calendar = user.contributionData; // Array of { date, contributionCount }

          // Activity Grid (map to 0-4 levels)
          // Assuming simplified levels: 0=0, 1=1-3, 2=4-6, 3=7-9, 4=10+
          const levels = calendar.map((d: any) => {
            const c = d.contributionCount;
            if (c === 0) return 0;
            if (c <= 3) return 1;
            if (c <= 6) return 2;
            if (c <= 9) return 3;
            return 4;
          });
          // Ensure 365 days
          setActivityData(levels.slice(-365));

          // Monthly Trend (Last 6 months)
          const monthly: Record<string, number> = {};
          const last6Months = Array.from({ length: 6 }, (_, i) => format(subMonths(new Date(), 5 - i), "MMM"));

          calendar.forEach((d: any) => {
            const date = parseISO(d.date);
            const monthStr = format(date, "MMM");
            if (last6Months.includes(monthStr)) {
              monthly[monthStr] = (monthly[monthStr] || 0) + d.contributionCount;
            }
          });

          const monthChartData = last6Months.map(m => ({
            month: m,
            commits: monthly[m] || 0
          }));
          setMonthlyData(monthChartData);

          // Weekly Distribution (Aggregate by Day of Week over the last 3 months to normalize?)
          // Or just last 7 days? The user prompt implies "Deep dive", so aggregation is better.
          // Let's aggregate ALL recent activity (e.g. last 90 days) by weekday.
          const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat
          const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const recentDays = calendar.slice(-90);

          recentDays.forEach((d: any) => {
            const date = parseISO(d.date);
            const dayIndex = getDay(date);
            weekdayCounts[dayIndex] += d.contributionCount;
          });

          // Reorder to Mon-Sun
          const weekChartData = [
            { day: "Mon", commits: weekdayCounts[1] },
            { day: "Tue", commits: weekdayCounts[2] },
            { day: "Wed", commits: weekdayCounts[3] },
            { day: "Thu", commits: weekdayCounts[4] },
            { day: "Fri", commits: weekdayCounts[5] },
            { day: "Sat", commits: weekdayCounts[6] },
            { day: "Sun", commits: weekdayCounts[0] },
          ];
          setWeeklyCommits(weekChartData);

          // Insights
          const maxDayIndex = weekdayCounts.indexOf(Math.max(...weekdayCounts));
          const bestDay = weekdayNames[maxDayIndex];

          const newInsights = [
            `Your most productive day is ${bestDay}.`,
            `You have maintained code activity on ${activeDays} days recently.`,
            totalPRs > 10 ? "Great job on your pull request contributions!" : "Try contributing to more open source projects via PRs."
          ];
          setInsights(newInsights);
        }

      } catch (e) {
        console.error("Fetch error", e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background custom-scrollbar">
      <Header />

      <main className="container pt-24 pb-32 md:pb-12 space-y-8">
        {/* Page Header */}
        <section className="animate-fade-in">
          <h1 className="text-3xl font-bold text-gradient">Analytics</h1>
          <p className="text-muted-foreground mt-1">Deep dive into your coding patterns</p>
        </section>

        {/* Time Range Selector */}
        <div className="flex gap-2 animate-fade-up" style={{ animationDelay: "0.05s" }}>
          {(["week", "month", "year"] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                timeRange === range
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <Section className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-all duration-300 group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold">{stat.value}</span>
                  <span className={cn(
                    "text-xs flex items-center gap-1",
                    stat.trend === "up" ? "text-primary" : "text-destructive"
                  )}>
                    {stat.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Monthly Trend */}
        <Section title="Monthly Trend (Commits)" className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="commits"
                  stroke="hsl(142, 71%, 45%)"
                  strokeWidth={2}
                  fill="url(#colorCommits)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* Weekly Distribution */}
        <Section title="Activity by Day (Last 90 Days)" className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyCommits}>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 12 }}
                />
                <Bar
                  dataKey="commits"
                  fill="hsl(142, 71%, 45%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* Two Column Charts */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Languages */}
          <Section title="Languages" className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
            {languageData.length > 0 ? (
              <>
                <div className="h-48 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={languageData}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {languageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {languageData.map((lang) => (
                    <div key={lang.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lang.color }} />
                      <span className="text-muted-foreground">{lang.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No language data available
              </div>
            )}
          </Section>

          {/* Insights */}
          <Section title="AI Insights" className="animate-fade-up space-y-3" style={{ animationDelay: "0.4s" }}>
            {insights.length > 0 ? (
              insights.map((text, i) => <InsightCard key={i} text={text} />)
            ) : (
              <InsightCard text="Keep coding to generate insights!" />
            )}
          </Section>

        </div>

        {/* Contribution Heatmap */}
        <Section title="Year in Code" className="animate-fade-up" style={{ animationDelay: "0.35s" }}>
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

      </main>

      <FloatingNav />
    </div>
  );
}
