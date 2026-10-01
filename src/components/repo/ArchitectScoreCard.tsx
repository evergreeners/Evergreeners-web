import React from "react";
import { Button } from "@/components/ui/button";
import { Terminal, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CategoryScores {
  documentation?: number;
  architecture?: number;
  testing?: number;
  maintenance?: number;
}

export interface ArchitectScoreCardProps {
  score: number;
  readiness?: string;
  categoryScores?: CategoryScores;
  isAnalyzing: boolean;
  onReRunAudit: () => void;
}

export function ArchitectScoreCard({
  score,
  readiness = "Analyzed",
  categoryScores = {},
  isAnalyzing,
  onReRunAudit,
}: ArchitectScoreCardProps) {
  const categories = [
    {
      label: "Documentation & Setup",
      value: categoryScores.documentation ?? 75,
    },
    {
      label: "Architecture & Modularity",
      value: categoryScores.architecture ?? 75,
    },
    {
      label: "Testing & CI Coverage",
      value: categoryScores.testing ?? 60,
    },
    {
      label: "Maintenance & Hygiene",
      value: categoryScores.maintenance ?? 80,
    },
  ];

  const getScoreColor = (val: number) => {
    if (val >= 80) return "text-emerald-400 bg-emerald-500";
    if (val >= 60) return "text-amber-400 bg-amber-500";
    return "text-red-400 bg-red-500";
  };

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {/* Overall Score */}
      <div className="p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            Codebase Health
          </span>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            {readiness}
          </span>
        </div>

        <div className="my-4">
          <div className="text-5xl font-bold font-mono text-zinc-100 tracking-tight">
            {score}
            <span className="text-2xl text-zinc-500 font-normal">/100</span>
          </div>
          <p className="text-xs text-zinc-400 mt-2 font-mono">
            Multidimensional composite score evaluating docs, architecture, tests, and hygiene.
          </p>
        </div>

        <Button
          onClick={onReRunAudit}
          disabled={isAnalyzing}
          variant="outline"
          size="sm"
          className="w-full gap-2 border-zinc-800 bg-zinc-900/40 text-xs font-mono text-zinc-300 hover:text-white hover:bg-zinc-800"
        >
          {isAnalyzing ? (
            <>
              <Cpu className="w-3.5 h-3.5 animate-spin text-zinc-400" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              <span>Re-run Audit</span>
            </>
          )}
        </Button>
      </div>

      {/* Category Breakdown */}
      <div className="md:col-span-2 p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm space-y-4">
        <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 block">
          Dimension Scores
        </span>

        <div className="grid sm:grid-cols-2 gap-4">
          {categories.map((cat) => {
            const colorClass = getScoreColor(cat.value);
            const textColor = colorClass.split(" ")[0];
            const barBgColor = colorClass.split(" ")[1];

            return (
              <div key={cat.label} className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-300">{cat.label}</span>
                  <span className={cn("font-bold", textColor)}>
                    {cat.value}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      barBgColor
                    )}
                    style={{
                      width: `${Math.min(Math.max(cat.value, 0), 100)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
