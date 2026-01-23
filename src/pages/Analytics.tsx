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
  const [userData, setUserData] = useState<any>(null);

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
  const [activityData, setActivityData] = useState<any[]>([]);
  const [insights, setInsights] = useState<string[]>([]);

  // 1. Fetch Data Effect
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
          credentials: "include"
        });

        if (!res.ok) throw new Error("Failed to fetch profile");

        const { user } = await res.json();
        setUserData(user);
      } catch (e) {
        console.error("Fetch error", e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // 2. Process Data Effect (depends on userData & timeRange)
  useEffect(() => {
    if (!userData) return;

    // A. Contribution Data Filtering
    const calendar = userData.contributionData || [];
    const sortedCalendar = [...calendar].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Determine Start Date based on Range
    const now = new Date();
    let startDate = subMonths(now, 12);
    if (timeRange === 'week') startDate = new Date(now.setDate(now.getDate() - 7));
    if (timeRange === 'month') startDate = subMonths(new Date(), 1);

    // Filtered data for stats/charts
    const filteredData = sortedCalendar.filter((d: any) => new Date(d.date) >= startDate);

    // B. Calculate Stats
    const totalCommitsInRange = filteredData.reduce((acc: number, d: any) => acc + d.contributionCount, 0);
    const activeDaysInRange = filteredData.filter((d: any) => d.contributionCount > 0).length;
    const totalPRs = userData.totalPullRequests || userData.total_prs || 0;

    const daysCount = filteredData.length || 1;
    const avgDaily = (totalCommitsInRange / daysCount).toFixed(1);

    setStats([
      { label: "Commits", value: totalCommitsInRange.toLocaleString(), change: "", trend: "up", icon: GitCommit },
      { label: "Pull Requests", value: totalPRs.toLocaleString(), change: "", trend: "up", icon: GitPullRequest },
      { label: "Active Days", value: activeDaysInRange.toString(), change: "", trend: "up", icon: Calendar },
      { label: "Avg. Daily", value: avgDaily, change: "", trend: "up", icon: Clock },
    ]);

    // C. Charts Data
    if (timeRange === 'week' || timeRange === 'month') {
      const dailyTrend = filteredData.map((d: any) => ({
        month: format(parseISO(d.date), "MMM d"),
        commits: d.contributionCount
      }));
      setMonthlyData(dailyTrend);
    } else {
      const monthly: Record<string, number> = {};
      const monthsInOrder: string[] = [];
      filteredData.forEach((d: any) => {
        const date = parseISO(d.date);
        const monthStr = format(date, "MMM");
        if (!monthsInOrder.includes(monthStr)) monthsInOrder.push(monthStr);
        monthly[monthStr] = (monthly[monthStr] || 0) + d.contributionCount;
      });
      const trendData = monthsInOrder.map(m => ({
        month: m,
        commits: monthly[m]
      }));
      setMonthlyData(trendData);
    }

    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    filteredData.forEach((d: any) => {
      const date = parseISO(d.date);
      weekdayCounts[getDay(date)] += d.contributionCount;
    });

    setWeeklyCommits([
      { day: "Mon", commits: weekdayCounts[1] },
      { day: "Tue", commits: weekdayCounts[2] },
      { day: "Wed", commits: weekdayCounts[3] },
      { day: "Thu", commits: weekdayCounts[4] },
      { day: "Fri", commits: weekdayCounts[5] },
      { day: "Sat", commits: weekdayCounts[6] },
      { day: "Sun", commits: weekdayCounts[0] },
    ]);

    // Languages
    if (userData.languages || userData.languages_data) {
      const langs = (userData.languages || userData.languages_data).map((l: any) => ({
        name: l.name,
        value: l.value || l.size,
        color: l.color
      }));
      setLanguageData(langs);
    }

    // Activity Grid: Always show full year context
    // ActivityGrid expects Newest -> Oldest to render Left -> Right properly (it internally reverses to Oldest->Newest)
    setActivityData([...sortedCalendar].reverse());

    // Insights
    const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const maxDayIndex = weekdayCounts.indexOf(Math.max(...weekdayCounts));
    const bestDay = weekdayNames[maxDayIndex];

    setInsights([
      `Your most productive day in this period is ${bestDay}.`,
      `You were active on ${activeDaysInRange} days.`,
      `Averaging ${avgDaily} commits per day.`
    ]);

  }, [userData, timeRange]);

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
