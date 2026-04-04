import { Flame } from "lucide-react";

interface StreakDisplayProps {
  current: number;
  longest: number;
}

export function StreakDisplay({ current, longest }: StreakDisplayProps) {
  return (
    <div className="relative">
      <div className="flex flex-col items-center justify-center py-12">
        {/* Main streak number */}
        <div className="relative">
          <div className="relative flex items-center gap-4">
            <Flame className="w-12 h-12 text-primary" />
            <span className="text-8xl font-bold tracking-tight text-gradient">
              {current}
            </span>
          </div>
        </div>
        
        <p className="mt-4 text-lg text-muted-foreground">
          day streak
        </p>
        
        {/* Longest streak */}
        <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-foreground font-medium">{longest}</span>
          <span>longest streak</span>
        </div>
      </div>
    </div>
  );
}
