import { Flame } from "lucide-react";
import "./StreakDisplay.css";

interface StreakDisplayProps {
  current: number;
  longest: number;
}

export function StreakDisplay({ current, longest }: StreakDisplayProps) {
  return (
    <div className="relative">
      <div className="flex flex-col items-center justify-center py-12">
        {/* Main streak number - holographic 3D effect */}
        <div className="streak-card-6" aria-hidden="true">
          <div className="streak-card-6__holo">
            <div className="streak-card-6__layer streak-card-6__layer--back">{current}</div>
            <div className="streak-card-6__layer streak-card-6__layer--mid">{current}</div>
            <div className="streak-card-6__layer streak-card-6__layer--front">{current}</div>
          </div>
        </div>

        <p className="mt-4 text-lg text-muted-foreground flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
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