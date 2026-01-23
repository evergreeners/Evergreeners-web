import { cn } from "@/lib/utils";

interface StatItemProps {
  label: string;
  value: string | number;
  subtext?: string;
  className?: string;
}

export function StatItem({ label, value, subtext, className }: StatItemProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className="text-2xl font-semibold text-foreground mt-1">
        {value}
      </span>
      {subtext && (
        <span className="text-xs text-muted-foreground mt-0.5">
          {subtext}
        </span>
      )}
    </div>
  );
}
