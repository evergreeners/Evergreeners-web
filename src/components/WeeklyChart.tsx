import React, { useState, useMemo, useEffect, useRef } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface WeeklyChartDataPoint {
  day: string;
  value: number;
  date?: string;
  fullDate?: string;
  dayNumber?: number | string;
  isToday?: boolean;
}

export interface WeeklyChartProps {
  data: WeeklyChartDataPoint[];
  weeklyTotal?: number;
  activeDays?: number;
  className?: string;
}

export function WeeklyChart({
  data = [],
  weeklyTotal,
  activeDays: activeDaysProp,
  className,
}: WeeklyChartProps) {
  const [viewMode, setViewMode] = useState<"pillars" | "wave">("pillars");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [refillKey, setRefillKey] = useState(0);
  const lastRefillTime = useRef(Date.now());

  // Trigger fluid refill animation on page reload and when returning from another tab
  useEffect(() => {
    const triggerRefill = () => {
      const now = Date.now();
      if (now - lastRefillTime.current > 1200) {
        lastRefillTime.current = now;
        setRefillKey((prev) => prev + 1);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        triggerRefill();
      }
    };

    const handleFocus = () => {
      triggerRefill();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Fallback if data is empty or missing
  const safeData: WeeklyChartDataPoint[] = useMemo(() => {
    if (data && data.length > 0) return data;
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day) => ({
      day,
      value: 0,
    }));
  }, [data]);

  // Calculations
  const calculatedTotal = useMemo(
    () => safeData.reduce((sum, item) => sum + (item.value || 0), 0),
    [safeData]
  );
  const totalCommits = weeklyTotal !== undefined ? weeklyTotal : calculatedTotal;

  const activeDaysCount = useMemo(() => {
    if (activeDaysProp !== undefined) return activeDaysProp;
    return safeData.filter((item) => (item.value || 0) > 0).length;
  }, [activeDaysProp, safeData]);

  const maxValue = useMemo(() => {
    const max = Math.max(...safeData.map((d) => d.value || 0));
    return max > 0 ? max : 1;
  }, [safeData]);

  const peakDay = useMemo(() => {
    let max = -1;
    let found: WeeklyChartDataPoint | null = null;
    for (const item of safeData) {
      if ((item.value || 0) > max) {
        max = item.value || 0;
        found = item;
      }
    }
    return max > 0 ? found : null;
  }, [safeData]);

  const dailyAvg = useMemo(() => {
    return safeData.length > 0
      ? (totalCommits / safeData.length).toFixed(1)
      : "0";
  }, [totalCommits, safeData.length]);

  return (
    <div
      role="region"
      aria-label="Weekly activity chart"
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm p-6 transition-all duration-300",
        className
      )}
    >
      {/* Header with Title, Live Badge & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-zinc-800/50">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-semibold text-base text-zinc-100 tracking-tight">
              Weekly Velocity
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
              {totalCommits} {totalCommits === 1 ? "commit" : "commits"}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {totalCommits > 0 ? (
              <>
                <span className="text-emerald-400 font-medium">
                  {activeDaysCount} of 7
                </span>{" "}
                active days
                {peakDay ? (
                  <>
                    {" "}
                    • Peak shipping on{" "}
                    <span className="text-zinc-200 font-medium">
                      {peakDay.day}
                    </span>{" "}
                    ({peakDay.value})
                  </>
                ) : null}
              </>
            ) : (
              "No commits recorded yet for this week • Keep pushing!"
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
                  item.value === peakDay.value &&
                  peakDay.value > 0;
                const isHovered = hoveredIndex === index;
                const hasCommits = item.value > 0;
                const heightPercent = hasCommits
                  ? Math.max(Math.round((item.value / maxValue) * 100), 14)
                  : 0;

                return (
                  <div
                    key={index}
                    tabIndex={0}
                    role="graphics-symbol"
                    aria-label={`${item.day}: ${item.value} commits`}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onFocus={() => setHoveredIndex(index)}
                    onBlur={() => setHoveredIndex(null)}
                    className="relative flex flex-col items-center justify-end h-full group focus:outline-none"
                  >
                    {/* Floating Value Pill (Always for Peak or on Hover) */}
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
                            {item.value} {isPeak ? "PEAK" : ""}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Pillar Track Slot */}
                    <div
                      className={cn(
                        "w-full max-w-[56px] h-36 rounded-xl border p-1 flex flex-col justify-end items-center relative overflow-hidden transition-all duration-300",
                        item.isToday
                          ? "bg-zinc-900/40 border-emerald-500/40"
                          : "bg-zinc-900/20 border-zinc-800/40 group-hover:border-emerald-500/30 group-hover:bg-zinc-900/40"
                      )}
                    >
                      {/* Subtle Horizontal Guide Ticks */}
                      <div className="absolute top-[25%] left-1 right-1 border-t border-zinc-800/30 pointer-events-none" />
                      <div className="absolute top-[50%] left-1 right-1 border-t border-zinc-800/30 pointer-events-none" />
                      <div className="absolute top-[75%] left-1 right-1 border-t border-zinc-800/30 pointer-events-none" />

                      {/* Active Dynamic Bar (Fluid Energy Column) */}
                      {hasCommits ? (
                        <motion.div
                          key={`fluid-${refillKey}-${index}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{
                            height: `${heightPercent}%`,
                            opacity:
                              hoveredIndex !== null && !isHovered ? 0.45 : 1,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 130,
                            damping: 15,
                            mass: 0.85,
                            delay: index * 0.055,
                          }}
                          className={cn(
                            "w-full rounded-lg relative overflow-hidden flex flex-col justify-start items-center transition-shadow duration-300",
                            isPeak
                              ? "bg-gradient-to-t from-emerald-950 via-emerald-600 to-emerald-400 shadow-[0_0_20px_rgba(34,197,94,0.45)]"
                              : "bg-gradient-to-t from-emerald-950/90 via-emerald-600/90 to-emerald-400/90 shadow-[0_0_12px_rgba(34,197,94,0.25)]",
                            isHovered && "shadow-[0_0_24px_rgba(74,222,128,0.6)] brightness-110"
                          )}
                        >
                          {/* Liquid Surface Meniscus & Wave Shimmer */}
                          <div
                            className={cn(
                              "w-full h-2.5 shrink-0 rounded-t-md relative overflow-hidden bg-gradient-to-r from-emerald-200 via-emerald-300 to-emerald-200 shadow-[0_0_10px_#4ade80,0_0_16px_rgba(74,222,128,0.8)]",
                              isPeak && "from-emerald-100 via-emerald-200 to-emerald-100 shadow-[0_0_12px_#86efac,0_0_20px_rgba(134,239,172,0.9)]"
                            )}
                          >
                            {/* Meniscus specular gloss line */}
                            <div className="absolute inset-x-0 top-0 h-[1px] bg-white/90" />
                            {/* Subtle liquid surface wave meniscus */}
                            <svg className="absolute inset-0 w-full h-full opacity-50 pointer-events-none" viewBox="0 0 40 10" preserveAspectRatio="none">
                              <path d="M0 5 Q 10 1, 20 5 T 40 5 L 40 10 L 0 10 Z" fill="rgba(255,255,255,0.4)" />
                            </svg>
                          </div>

                          {/* Rising Energy Fluid Bubbles & Shimmer */}
                          <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <span
                              className="absolute bottom-2 left-2 w-1 h-1 rounded-full bg-emerald-200/70 animate-bounce"
                              style={{ animationDuration: '2.2s', animationDelay: `${index * 0.15}s` }}
                            />
                            <span
                              className="absolute bottom-6 right-2 w-1.5 h-1.5 rounded-full bg-emerald-200/50 animate-pulse"
                              style={{ animationDuration: '1.8s', animationDelay: `${index * 0.25}s` }}
                            />
                            {/* Inner Vertical Gloss Streak */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                          </div>
                        </motion.div>
                      ) : (
                        /* Zero-Value / Rest Day Indicator */
                        <div className="my-1.5 flex flex-col items-center">
                          <div className="w-5 h-1 rounded-full bg-zinc-800 border border-zinc-700/50 group-hover:bg-zinc-700 transition-colors" />
                        </div>
                      )}
                    </div>

                    {/* X-Axis Day & Date Labels */}
                    <div className="mt-2 flex flex-col items-center gap-0.5">
                      <span
                        className={cn(
                          "text-xs font-mono transition-colors",
                          item.isToday
                            ? "text-emerald-400 font-bold"
                            : "text-zinc-400 group-hover:text-zinc-200"
                        )}
                      >
                        {item.day}
                      </span>
                      {item.dayNumber !== undefined && (
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {item.dayNumber}
                        </span>
                      )}
                      {item.isToday && (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-mono font-semibold bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 tracking-wider">
                          TODAY
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            /* Wave (Velocity Spline Curve) View */
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
                    <linearGradient id="velocityGlowGrad" x1="0" y1="0" x2="0" y2="1">
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
                      const item = payload[0].payload as WeeklyChartDataPoint;
                      return (
                        <div className="rounded-xl border border-emerald-500/30 bg-zinc-950/90 backdrop-blur-md px-3 py-2 shadow-xl shadow-black/60">
                          <p className="text-xs text-zinc-400 font-mono">
                            {item.fullDate || item.day}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <GitCommit className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="font-mono text-sm font-bold text-emerald-300">
                              {item.value} {item.value === 1 ? "commit" : "commits"}
                            </span>
                          </div>
                          {totalCommits > 0 && (
                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                              {Math.round(((item.value || 0) / totalCommits) * 100)}% of this week
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#4ade80"
                    strokeWidth={3}
                    fill="url(#velocityGlowGrad)"
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
            <GitCommit className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
              Total Commits
            </p>
            <p className="text-sm font-bold font-mono text-zinc-200">
              {totalCommits}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-900/20 border border-zinc-800/40">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
              Active Cadence
            </p>
            <p className="text-sm font-bold font-mono text-zinc-200">
              {activeDaysCount} / 7 <span className="text-xs font-normal text-zinc-500">days</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-900/20 border border-zinc-800/40">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
              Peak Velocity
            </p>
            <p className="text-sm font-bold font-mono text-zinc-200 truncate">
              {peakDay ? `${peakDay.day} (${peakDay.value})` : "None"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-900/20 border border-zinc-800/40">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
              Daily Avg
            </p>
            <p className="text-sm font-bold font-mono text-zinc-200">
              {dailyAvg} <span className="text-xs font-normal text-zinc-500">/ day</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
