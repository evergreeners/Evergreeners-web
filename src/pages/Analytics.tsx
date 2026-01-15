import { Header } from "@/components/Header";
import { FloatingNav } from "@/components/FloatingNav";
import { Section } from "@/components/Section";
import { ActivityGrid } from "@/components/ActivityGrid";
import { InsightCard } from "@/components/InsightCard";
import { 
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Calendar, GitCommit, GitPullRequest, Clock } from "lucide-react";

// Mock data
const monthlyData = [
  { month: "Jan", commits: 87 },
  { month: "Feb", commits: 125 },
  { month: "Mar", commits: 98 },
  { month: "Apr", commits: 156 },
  { month: "May", commits: 178 },
  { month: "Jun", commits: 145 },
];

const weeklyCommits = [
  { day: "Mon", commits: 12 },
  { day: "Tue", commits: 18 },
  { day: "Wed", commits: 8 },
  { day: "Thu", commits: 22 },
  { day: "Fri", commits: 15 },
  { day: "Sat", commits: 5 },
  { day: "Sun", commits: 9 },
];

const hourlyActivity = [
  { hour: "6am", activity: 5 },
  { hour: "9am", activity: 45 },
  { hour: "12pm", activity: 30 },
  { hour: "3pm", activity: 55 },
  { hour: "6pm", activity: 40 },
  { hour: "9pm", activity: 25 },
  { hour: "12am", activity: 10 },
];

const languageData = [
  { name: "TypeScript", value: 45, color: "hsl(142, 71%, 45%)" },
  { name: "JavaScript", value: 25, color: "hsl(142, 71%, 35%)" },
  { name: "Python", value: 15, color: "hsl(142, 71%, 55%)" },
  { name: "Other", value: 15, color: "hsl(142, 71%, 25%)" },
];

const activityData = Array.from({ length: 365 }, () => 
  Math.random() > 0.25 ? Math.floor(Math.random() * 5) : 0
);

type TimeRange = "week" | "month" | "year";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");

  const stats = [
    { label: "Total Commits", value: "2,847", change: "+12%", trend: "up", icon: GitCommit },
    { label: "Pull Requests", value: "156", change: "+8%", trend: "up", icon: GitPullRequest },
    { label: "Active Days", value: "284", change: "-3%", trend: "down", icon: Calendar },
    { label: "Avg. Daily", value: "8.2", change: "+5%", trend: "up", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-background custom-scrollbar">
      <Header />
      
      <main className="container pt-24 pb-32 space-y-8">
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
        <Section title="Monthly Trend" className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0}/>
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
        <Section title="Weekly Distribution" className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
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
          {/* Hourly Pattern */}
          <Section title="Peak Hours" className="animate-fade-up" style={{ animationDelay: "0.25s" }}>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyActivity}>
                  <XAxis 
                    dataKey="hour" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 10 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="activity" 
                    stroke="hsl(142, 71%, 45%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(142, 71%, 45%)', strokeWidth: 0, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>

          {/* Languages */}
          <Section title="Languages" className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
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
                  className={`w-3 h-3 rounded-sm ${
                    level === 0 ? "bg-secondary" :
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

        {/* Insights */}
        <Section title="AI Insights" className="animate-fade-up space-y-3" style={{ animationDelay: "0.4s" }}>
          <InsightCard text="Your most productive day is Thursday. Consider scheduling complex tasks then." />
          <InsightCard text="You commit most frequently at 3 PM. Your afternoon focus sessions are working!" />
          <InsightCard text="TypeScript usage increased 15% this month. Great progress on type safety!" />
        </Section>
      </main>

      <FloatingNav />
    </div>
  );
}
