import { Header } from "@/components/Header";
import { FloatingNav } from "@/components/FloatingNav";
import { Section } from "@/components/Section";
import { ActivityGrid } from "@/components/ActivityGrid";
import { InsightCard } from "@/components/InsightCard";
import { Loader } from "@/components/ui/loader";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Calendar, GitCommit, GitPullRequest, Clock, Info } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { format, subMonths, startOfMonth, parseISO, getDay } from "date-fns";
import { getApiUrl } from "@/lib/api-config";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type TimeRange = "week" | "month" | "year";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");

  // Fetch User Profile using React Query
  const { data: user, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const session = await authClient.getSession();
      if (!session.data?.session) throw new Error("No session");
      const url = getApiUrl("/api/user/profile");
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.data.session.token}` },
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      return data.user;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
    refetchOnWindowFocus: true,
  });

  // Process Data with useMemo
  const { stats, monthlyData, weeklyCommits, languageData, activityData, insights } = useMemo(() => {
    if (!user) {
      return {
        stats: [
          { label: "Commits", value: "0", change: "0%", trend: "up", icon: GitCommit, description: "" },
          { label: "Pull Requests", value: "0", change: "0%", trend: "up", icon: GitPullRequest, description: "" },
          { label: "Active Days", value: "0", change: "0%", trend: "down", icon: Calendar, description: "" },
          { label: "Avg. Daily", value: "0", change: "0%", trend: "up", icon: Clock, description: "" },
        ],
        monthlyData: [],
        weeklyCommits: [],
        languageData: [],
        activityData: [],
        insights: []
      };
    }

    const calendar = user.contributionData || [];
    // Ensure chronological order for processing
    const sortedCalendar = [...calendar].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Determine Start Date based on Range
    const now = new Date();
    let startDate = subMonths(now, 12);
    if (timeRange === 'week') startDate = new Date(now.setDate(now.getDate() - 7));
    if (timeRange === 'month') startDate = subMonths(new Date(), 1);

    // Filtered data for stats/charts
    const filteredData = sortedCalendar.filter((d: any) => new Date(d.date) >= startDate);

    // Calculate Stats
    const totalCommitsInRange = filteredData.reduce((acc: number, d: any) => acc + d.contributionCount, 0);
    const activeDaysInRange = filteredData.filter((d: any) => d.contributionCount > 0).length;
    const totalPRs = user.totalPullRequests || user.total_prs || 0;

    const daysCount = filteredData.length || 1;
    const avgDaily = (totalCommitsInRange / daysCount).toFixed(1);

    const newStats = [
      {
        label: "Commits",
        value: totalCommitsInRange.toLocaleString(),
        change: "",
        trend: "up",
        icon: GitCommit,
        description: "Total commits pushed to GitHub in this period."
      },
      {
        label: "Pull Requests",
        value: totalPRs.toLocaleString(),
        change: "",
        trend: "up",
        icon: GitPullRequest,
        description: "Total Pull Requests opened (All time)."
      },
      {
        label: "Active Days",
        value: activeDaysInRange.toString(),
        change: "",
        trend: "up",
        icon: Calendar,
        description: "Days with at least one contribution in this period."
      },
      {
        label: "Avg. Daily",
        value: avgDaily,
        change: "",
        trend: "up",
        icon: Clock,
        description: "Average commits per day in this period."
      },
    ];

    // Charts Data
    let newMonthlyData: any[] = [];
    if (timeRange === 'week' || timeRange === 'month') {
      newMonthlyData = filteredData.map((d: any) => ({
        month: format(parseISO(d.date), "MMM d"),
        commits: d.contributionCount
      }));
    } else {
      const monthly: Record<string, number> = {};
      const monthsInOrder: string[] = [];
      filteredData.forEach((d: any) => {
        const date = parseISO(d.date);
        const monthStr = format(date, "MMM");
        if (!monthsInOrder.includes(monthStr)) monthsInOrder.push(monthStr);
        monthly[monthStr] = (monthly[monthStr] || 0) + d.contributionCount;
      });
      newMonthlyData = monthsInOrder.map(m => ({
        month: m,
        commits: monthly[m]
      }));
    }

    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    filteredData.forEach((d: any) => {
      const date = parseISO(d.date);
      weekdayCounts[getDay(date)] += d.contributionCount;
    });

    const newWeeklyCommits = [
      { day: "Mon", commits: weekdayCounts[1] },
      { day: "Tue", commits: weekdayCounts[2] },
      { day: "Wed", commits: weekdayCounts[3] },
      { day: "Thu", commits: weekdayCounts[4] },
      { day: "Fri", commits: weekdayCounts[5] },
      { day: "Sat", commits: weekdayCounts[6] },
      { day: "Sun", commits: weekdayCounts[0] },
    ];

    // Languages
    let newLanguageData: any[] = [];
    if (user.languages || user.languages_data) {
      newLanguageData = (user.languages || user.languages_data).map((l: any) => ({
        name: l.name,
        value: l.value || l.size,
        color: l.color
      }));
    }

    // Activity Grid: Always show full year context
    const newActivityData = [...sortedCalendar].reverse();

    // Insights
    const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const maxDayIndex = weekdayCounts.indexOf(Math.max(...weekdayCounts));
    const bestDay = weekdayNames[maxDayIndex];

    const newInsights = [
      `Your most productive day in this period is ${bestDay}.`,
      `You were active on ${activeDaysInRange} days.`,
      `Averaging ${avgDaily} commits per day.`
    ];

    return {
      stats: newStats,
      monthlyData: newMonthlyData,
      weeklyCommits: newWeeklyCommits,
      languageData: newLanguageData,
      activityData: newActivityData,
      insights: newInsights
    };
  }, [user, timeRange]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader />
        <p className="text-muted-foreground animate-pulse">Loading analytics...</p>
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
          <TooltipProvider>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-all duration-300 group relative"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/50 text-muted-foreground transition-colors">
                        <Info className="w-3 h-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>{(stat as any).description}</p>
                    </TooltipContent>
                  </Tooltip>

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
          </TooltipProvider>
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
                  fillOpacity={1}
                  fill="url(#colorCommits)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* Weekly Distribution */}
        <Section title="Activity by Day" className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="h-64">
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

        {/* Two Column Charts: Languages & Insights */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Languages */}
          <Section title="Languages" className="animate-fade-up" style={{ animationDelay: "0.25s" }}>
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
                          <Cell key={`cell-${index}`} fill={entry.color || 'hsl(142, 71%, 45%)'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {languageData.map((lang: any) => (
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

          {/* AI Insights */}
          <Section title="AI Insights" className="animate-fade-up space-y-3" style={{ animationDelay: "0.3s" }}>
            <div className="grid gap-4">
              {insights.map((insight, i) => (
                <InsightCard
                  key={i}
                  title="Pattern Detected"
                  description={insight}
                  type="trend"
                />
              ))}
            </div>
          </Section>
        </div>

        {/* Year in Code */}
        <Section title="Year in Code" className="animate-fade-up" style={{ animationDelay: "0.35s" }}>
          <ActivityGrid data={activityData} weeks={57} />
        </Section>
      </main>

      <FloatingNav />
    </div>
  );
}
