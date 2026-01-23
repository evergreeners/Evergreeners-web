import { cn } from "@/lib/utils";

interface WeeklyChartProps {
  data: { day: string; value: number }[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end justify-between gap-2 h-24">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center gap-2 flex-1">
          <div className="w-full flex items-end justify-center h-16">
            <div
              className={cn(
                "w-full max-w-16 rounded-t-md transition-all duration-300",
                item.value > 0 ? "bg-primary" : "bg-secondary"
              )}
              style={{
                height: `${item.value > 0 ? (item.value / maxValue) * 100 : 8}%`,
                minHeight: item.value > 0 ? "8px" : "4px",
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{item.day}</span>
        </div>
      ))}
    </div>
  );
}
