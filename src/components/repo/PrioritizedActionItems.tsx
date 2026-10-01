import React from "react";
import { Clock, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionItem {
  title: string;
  description: string;
  priority?: "high" | "medium" | "low" | string;
  timeEstimate?: string;
}

export interface PrioritizedActionItemsProps {
  items: ActionItem[];
}

export function PrioritizedActionItems({ items }: PrioritizedActionItemsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-mono font-semibold text-zinc-200 uppercase tracking-wider">
            Prioritized Action Items
          </h3>
        </div>
        <span className="text-xs text-zinc-500 font-mono">
          High leverage engineering fixes
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.length > 0 ? (
          items.map((item, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm space-y-2 flex flex-col justify-between hover:border-zinc-800 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={cn(
                      "text-[10px] font-mono px-2 py-0.5 rounded-full border",
                      item.priority === "high"
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : item.priority === "medium"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400"
                    )}
                  >
                    {item.priority?.toUpperCase() || "TODO"}
                  </span>
                  {item.timeEstimate && (
                    <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      {item.timeEstimate}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-zinc-200 font-mono">
                  {item.title}
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-8 text-center text-sm font-mono text-zinc-500">
            No pending action items identified. Codebase architecture is in prime shape.
          </div>
        )}
      </div>
    </div>
  );
}
