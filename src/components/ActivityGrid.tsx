import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ContributionDay {
  contributionCount: number;
  date: string;
}

interface ContributionWeek {
  contributionDays: ContributionDay[];
}

interface ActivityGridProps {
  data?: ContributionDay[] | number[]; // Handle both flattened array (current) and potential future structures
  loading?: boolean;
  weeks?: number;
}

import { useIsMobile } from "@/hooks/use-mobile";

export function ActivityGrid({ data, loading, weeks: weekCount }: ActivityGridProps) {
  const isMobile = useIsMobile();

  // Generate random fallback data if no real data is provided
  // Generate empty fallback data (0 contributions) if no real data is provided
  const getFallbackData = () => {
    const days: ContributionDay[] = [];
    const today = new Date();

    // Generate last 365 days (approx 1 year)
    for (let d = 365; d >= 0; d--) {
      days.push({
        contributionCount: 0,
        date: new Date(today.getTime() - d * 86400000).toISOString().split('T')[0]
      });
    }
    return days;
  };

  // Normalize data to ContributionDay[]
  let displayData: ContributionDay[] = [];

  if (Array.isArray(data) && data.length > 0) {
    // Check if it's already ContributionDay[] (has date field)
    let rawData: ContributionDay[] = [];
    if (typeof data[0] === 'object' && 'date' in (data[0] as any)) {
      rawData = data as ContributionDay[];
    } else if (typeof data[0] === 'number') {
      // Convert number[] to dummy ContributionDay[]
      const today = new Date();
      rawData = (data as number[]).map((count, i) => ({
        contributionCount: count,
        date: new Date(today.getTime() - (data.length - 1 - i) * 86400000).toISOString().split('T')[0]
      }));
    }
    // Server sends data as [Today, Yesterday, ... Oldest] (Newest First)
    // We want to display [Oldest ... Today] (Oldest First) for the graph
    displayData = [...rawData].reverse();
  } else {
    displayData = getFallbackData();
  }

  // Split into weeks
  const weeks: ContributionWeek[] = [];
  let currentWeek: ContributionDay[] = [];

  displayData.forEach((day, i) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || i === displayData.length - 1) {
      weeks.push({ contributionDays: currentWeek });
      currentWeek = [];
    }
  });

  // Responsive week count: Always force 16 on mobile. On desktop, use prop if provided, else default to 28.
  const countToUse = isMobile ? 16 : (weekCount || 28);
  const displayWeeks = weeks.slice(-countToUse);

  const getIntensityClass = (count: number) => {
    if (count === 0) return "bg-zinc-800/50 hover:bg-zinc-700/50";
    if (count <= 2) return "bg-primary/30 shadow-[0_0_5px_rgba(var(--primary),0.3)] hover:bg-primary/40";
    if (count <= 4) return "bg-primary/50 shadow-[0_0_8px_rgba(var(--primary),0.5)] hover:bg-primary/60";
    if (count <= 6) return "bg-primary/70 shadow-[0_0_12px_rgba(var(--primary),0.7)] hover:bg-primary/80";
    return "bg-primary shadow-[0_0_15px_rgba(var(--primary),0.9)] hover:bg-primary/90";
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm p-6">
      <div className="flex flex-col gap-4">
        <div className="overflow-x-auto pb-2 custom-scrollbar">
          <div className="flex gap-1.5 min-w-max mx-auto">
            {displayWeeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1.5">
                {week.contributionDays.map((day, dayIndex) => (
                  <TooltipProvider key={`${weekIndex}-${dayIndex}`} delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "w-3.5 h-3.5 rounded-sm transition-all duration-300",
                            getIntensityClass(day.contributionCount),
                            "border border-white/5"
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContentSide day={day} />
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            ))}
          </div>
        </div>


      </div>
    </div>
  );
}

function TooltipContentSide({ day }: { day: ContributionDay }) {
  const date = new Date(day.date);
  const formattedDate = date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <TooltipContent className="bg-zinc-900 border border-zinc-800 text-xs">
      <p className="font-medium text-white">
        {day.contributionCount === 0 ? "No contributions" : `${day.contributionCount} contributions`}
      </p>
      <p className="text-zinc-400">{formattedDate}</p>
    </TooltipContent>
  );
}
