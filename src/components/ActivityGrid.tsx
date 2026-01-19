import { cn } from "@/lib/utils";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ActivityGridProps {
  data: { date: string; count: number }[] | number[];
}

export function ActivityGrid({ data }: ActivityGridProps) {
  // Normalize data to object format if it's currently numbers (backward compatibility)
  const normalizedData = data.map((item) => {
    if (typeof item === 'number') {
      return { date: '', count: item, level: item };
    }
    return {
      date: item.date,
      count: item.count,
      level: item.count === 0 ? 0 : item.count <= 2 ? 1 : item.count <= 5 ? 2 : item.count <= 10 ? 3 : 4
    };
  });

  const getIntensityClass = (level: number) => {
    switch (level) {
      case 0: return "bg-secondary";
      case 1: return "bg-primary/25";
      case 2: return "bg-primary/50";
      case 3: return "bg-primary/75";
      case 4: return "bg-primary";
      default: return "bg-secondary";
    }
  };

  const weeks = [];
  for (let i = 0; i < normalizedData.length; i += 7) {
    weeks.push(normalizedData.slice(i, i + 7));
  }

  return (
    <div className="overflow-x-auto no-scrollbar pb-2">
      <div className="flex gap-1">
        <TooltipProvider>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <Tooltip key={`${weekIndex}-${dayIndex}`}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "w-3 h-3 rounded-sm transition-colors cursor-default",
                        getIntensityClass(day.level)
                      )}
                    />
                  </TooltipTrigger>
                  {day.date && (
                    <TooltipContent>
                      <p className="text-xs">
                        {day.count} contributions on {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </div>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
}
