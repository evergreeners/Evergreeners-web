import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  GitCommit,
  Flame,
  TrendingUp,
  BarChart3,
  Calendar,
  Briefcase,
  Coffee,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface WeekdayCommitData {
  day: string;
  commits: number;
}

export interface WeekdayDistributionChartProps {
  data: WeekdayCommitData[];
  timeRange?: "week" | "month" | "year";
  title?: string;
  className?: string;
}

export function WeekdayDistributionChart({
  data = [],
  timeRange = "month",
  title = "Activity Distribution",
  className,
}: WeekdayDistributionChartProps) {
  const [viewMode, setViewMode] = useState<"pillars" | "wave">("pillars");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const safeData = useMemo(() => {
    if (data && data.length > 0) return data;
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day) => ({ day, commits: 0 }));
  }, [data]);

  const totalCommits = useMemo(() => {
    return safeData.reduce((acc, curr) => acc + (curr.commits || 0), 0);
  }, [safeData]);

  const maxValue = useMemo(() => {
    const max = Math.max(...safeData.map((d) => d.commits || 0));
    return max > 0 ? max : 1;
  }, [safeData]);

  const peakDay = useMemo(() => {
    let max = -1;
    let found: WeekdayCommitData | null = null;
    for (const item of safeData) {
      if ((item.commits || 0) > max) {
        max = item.commits || 0;
        found = item;
      }
    }
    return max > 0 ? found : null;
  }, [safeData]);

  // Weekday (Mon-Fri) vs Weekend (Sat-Sun) distribution
  const { weekdayCommits, weekendCommits, weekdayPct, weekendPct } = useMemo(() => {
    let weekdaySum = 0;
    let weekendSum = 0;
    safeData.forEach((d) => {
      if (d.day === "Sat" || d.day === "Sun") {
        weekendSum += d.commits || 0;
      } else {
        weekdaySum += d.commits || 0;
      }
    });
    const total = weekdaySum + weekendSum;
    const wPct = total > 0 ? Math.round((weekdaySum / total) * 100) : 0;
    const ePct = total > 0 ? Math.round((weekendSum / total) * 100) : 0;
    return {
      weekdayCommits: weekdaySum,
      weekendCommits: weekendSum,
      weekdayPct: wPct,
      weekendPct: ePct,
    };
  }, [safeData]);

  const activeDaysCount = useMemo(() => {
    return safeData.filter((d) => (d.commits || 0) > 0).length;
  }, [safeData]);

  const timeRangeLabel = useMemo(() => {
    if (timeRange === "week") return "Past 7 Days";
    if (timeRange === "month") return "Past Month";
    return "Past Year";
  }, [timeRange]);

  const peakPercentage = useMemo(() => {
    if (!peakDay || totalCommits === 0) return 0;
    return Math.round((peakDay.commits / totalCommits) * 100);
  }, [peakDay, totalCommits]);

  return (
    <div
      role="region"
      aria-label="Weekday commit distribution chart"
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm p-6 transition-all duration-300",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-zinc-800/50">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-semibold text-base text-zinc-100 tracking-tight">
              {title}
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
              {totalCommits} {totalCommits === 1 ? "commit" : "commits"} • {timeRangeLabel}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {totalCommits > 0 ? (
              <>
                {peakDay ? (
                  <>
                    <span className="text-zinc-200 font-medium">{peakDay.day}</span> is your
                    power day ({peakPercentage}% of output) •{" "}
                  </>
                ) : null}
                <span className="text-emerald-400 font-medium">{weekdayPct}% Weekdays</span> vs{" "}
                <span className="text-zinc-300 font-medium">{weekendPct}% Weekends</span>
              </>
            ) : (
              `No commit activity recorded in the ${timeRangeLabel.toLowerCase()}`
            )}
          </p>
        </div>

        {/* View Switcher: Pillars vs Wave */}
        <div className="flex items-center self-start sm:self-auto bg-zinc-900/40 border border-zinc-800/50 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode("pillars")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
              viewMode === "pillars"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Pillars</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("wave")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
              viewMode === "wave"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Wave</span>
          </button>
        </div>
      </div>

      {/* Main Chart Body */}
      <div className="pt-6 pb-2 min-h-[220px] flex flex-col justify-end">
        <AnimatePresence mode="wait">
          {viewMode === "pillars" ? (
            <motion.div
              key="pillars-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-48 select-none"
            >
              {safeData.map((item, index) => {
                const isPeak =
                  peakDay &&
                  item.commits === peakDay.commits &&
                  peakDay.commits > 0;
                const isHovered = hoveredIndex === index;
                const hasCommits = item.commits > 0;
                const heightPercent = hasCommits
                  ? Math.max(Math.round((item.commits / maxValue) * 100), 14)
                  : 0;
                const itemPct = totalCommits > 0 ? Math.round((item.commits / totalCommits) * 100) : 0;
                const isWeekend = item.day === "Sat" || item.day === "Sun";

                return (
                  <div
                    key={item.day}
                    tabIndex={0}
                    role="graphics-symbol"
                    aria-label={`${item.day}: ${item.commits} commits (${itemPct}%)`}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onFocus={() => setHoveredIndex(index)}
                    onBlur={() => setHoveredIndex(null)}
                    className="relative flex flex-col items-center justify-end h-full group focus:outline-none"
                  >
                    {/* Floating Value / Peak Pill */}
                    <AnimatePresence>
                      {(isHovered || isPeak) && (
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 2, scale: 0.9 }}
                          transition={{ duration: 0.15 }}
                          className={cn(
                            "absolute -top-7 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold whitespace-nowrap shadow-lg pointer-events-none",
                            isPeak
                              ? "bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(34,197,94,0.35)]"
                              : "bg-zinc-800 border border-zinc-700 text-zinc-100"
                          )}
                        >
                          {isPeak ? (
                            <Flame className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                          ) : (
                            <GitCommit className="w-2.5 h-2.5 text-emerald-400" />
                          )}
                          <span>
                            {item.commits} {isPeak ? "PEAK" : ""} ({itemPct}%)
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Pillar Track Slot */}
                    <div
                      className={cn(
                        "w-full max-w-[56px] h-36 rounded-xl border p-1 flex flex-col justify-end items-center relative overflow-hidden transition-all duration-300",
                        isPeak
                          ? "bg-zinc-900/40 border-emerald-500/40"
                          : "bg-zinc-900/20 border-zinc-800/40 group-hover:border-emerald-500/30 group-hover:bg-zinc-900/40"
                      )}
                    >
                      {/* Subtle Horizontal Guide Ticks */}
                      <div className="absolute top-[25%] left-1 right-1 border-t border-zinc-800/30 pointer-events-none" />
                      <div className="absolute top-[50%] left-1 right-1 border-t border-zinc-800/30 pointer-events-none" />
                      <div className="absolute top-[75%] left-1 right-1 border-t border-zinc-800/30 pointer-events-none" />

                      {/* Active Dynamic Bar */}
                      {hasCommits ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{
                            height: `${heightPercent}%`,
                            opacity:
                              hoveredIndex !== null && !isHovered ? 0.45 : 1,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 240,
                            damping: 22,
                            delay: index * 0.04,
                          }}
                          className={cn(
                            "w-full rounded-lg relative overflow-hidden flex flex-col justify-start items-center transition-shadow duration-300",
                            isPeak
                              ? "bg-gradient-to-t from-emerald-950 via-emerald-600 to-emerald-400 shadow-[0_0_20px_rgba(34,197,94,0.45)]"
                              : "bg-gradient-to-t from-emerald-950/90 via-emerald-600/90 to-emerald-400/90 shadow-[0_0_12px_rgba(34,197,94,0.25)]",
                            isHovered && "shadow-[0_0_24px_rgba(74,222,128,0.6)] brightness-110"
                          )}
                        >
                          {/* Illuminated Top Cap Line */}
                          <div
                            className={cn(
                              "w-full h-1.5 shrink-0 rounded-t-md bg-emerald-200 shadow-[0_0_8px_#4ade80,0_0_14px_rgba(74,222,128,0.9)]",
                              isPeak && "bg-emerald-100"
                            )}
                          />

                          {/* Inner Vertical Gloss Streak */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                        </motion.div>
                      ) : (
                        /* Zero-Value Rest Day Indicator */
                        <div className="my-1.5 flex flex-col items-center">
                          <div className="w-5 h-1 rounded-full bg-zinc-800 border border-zinc-700/50 group-hover:bg-zinc-700 transition-colors" />
                        </div>
                      )}
                    </div>

                    {/* X-Axis Day & Percentage Labels */}
                    <div className="mt-2 flex flex-col items-center gap-0.5">
                      <span
                        className={cn(
                          "text-xs font-mono transition-colors",
                          isPeak
                            ? "text-emerald-400 font-bold"
                            : "text-zinc-400 group-hover:text-zinc-200"
                        )}
                      >
                        {item.day}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {itemPct}%
                      </span>
                      {isWeekend && (
                        <span className="text-[9px] text-zinc-600 font-mono">
                          WKD
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            /* Wave (Distribution Spline Curve) View */
            <motion.div
              key="wave-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="h-48 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={safeData}
                  margin={{ top: 15, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="distGlowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.45} />
                      <stop offset="60%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#047857" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    stroke="#52525b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#27272a" }}
                    tick={{ fill: "#a1a1aa", fontFamily: "monospace" }}
                  />
                  <YAxis
                    stroke="#52525b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    tick={{ fill: "#71717a", fontFamily: "monospace" }}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload as WeekdayCommitData;
                      const pct = totalCommits > 0 ? Math.round((item.commits / totalCommits) * 100) : 0;
                      return (
                        <div className="rounded-xl border border-emerald-500/30 bg-zinc-950/90 backdrop-blur-md px-3 py-2 shadow-xl shadow-black/60">
                          <p className="text-xs text-zinc-400 font-mono">
                            {item.day} Distribution
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <GitCommit className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="font-mono text-sm font-bold text-emerald-300">
                              {item.commits} {item.commits === 1 ? "commit" : "commits"}
                            </span>
                          </div>
                          {totalCommits > 0 && (
                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                              {pct}% of all activity in {timeRangeLabel.toLowerCase()}
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="commits"
                    stroke="#4ade80"
                    strokeWidth={3}
                    fill="url(#distGlowGrad)"
                    dot={{
                      r: 4,
                      fill: "#22c55e",
                      stroke: "#09090b",
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 6,
                      fill: "#4ade80",
                      stroke: "#ffffff",
                      strokeWidth: 2,
                      className: "animate-pulse",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-3 border-t border-zinc-800/50">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-900/20 border border-zinc-800/40">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
              Power Day
            </p>
            <p className="text-sm font-bold font-mono text-zinc-200">
              {peakDay ? `${peakDay.day} (${peakDay.commits})` : "None"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-900/20 border border-zinc-800/40">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Briefcase className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
              Mon – Fri
            </p>
            <p className="text-sm font-bold font-mono text-zinc-200">
              {weekdayCommits} <span className="text-xs font-normal text-zinc-500">({weekdayPct}%)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-900/20 border border-zinc-800/40">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Coffee className="w-3.5 h-3.5 text-orange-300" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
              Sat – Sun
            </p>
            <p className="text-sm font-bold font-mono text-zinc-200">
              {weekendCommits} <span className="text-xs font-normal text-zinc-500">({weekendPct}%)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-900/20 border border-zinc-800/40">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
              Active Days
            </p>
            <p className="text-sm font-bold font-mono text-zinc-200">
              {activeDaysCount} / 7 <span className="text-xs font-normal text-zinc-500">days</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
