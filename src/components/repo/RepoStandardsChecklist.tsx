import React from "react";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChecklistItem {
  name: string;
  description: string;
  present: boolean;
}

export interface RepoStandardsChecklistProps {
  items: ChecklistItem[];
}

export function RepoStandardsChecklist({ items }: RepoStandardsChecklistProps) {
  const presentCount = items.filter((item) => item.present).length;
  const totalCount = items.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold tracking-tight text-zinc-200 uppercase font-mono">
            Standards & Hygiene Checklist
          </h2>
        </div>
        <span className="text-xs font-mono px-2.5 py-0.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400">
          {presentCount}/{totalCount} Satisfied
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <div
            key={item.name}
            className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm flex items-start gap-3 transition-colors hover:border-zinc-800"
          >
            <div className="mt-0.5 shrink-0">
              {item.present ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-zinc-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-mono font-medium text-zinc-200 truncate">
                  {item.name}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0",
                    item.present
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-zinc-800/50 border-zinc-700/40 text-zinc-500"
                  )}
                >
                  {item.present ? "Present" : "Missing"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
