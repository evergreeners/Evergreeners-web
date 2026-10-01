import React from "react";
import { Terminal, CheckCircle2, AlertTriangle } from "lucide-react";

export interface ArchitectInsightsProps {
  architectRead?: string;
  strengths?: string[];
  risks?: string[];
}

export function ArchitectInsights({
  architectRead,
  strengths = [],
  risks = [],
}: ArchitectInsightsProps) {
  return (
    <div className="space-y-4">
      {/* The Architect's Read */}
      {architectRead && (
        <div className="p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm space-y-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-sm text-zinc-100 font-mono">
              The Architect's Read
            </h3>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed font-sans">
            {architectRead}
          </p>
        </div>
      )}

      {/* Strengths & Risks Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Core Strengths */}
        <div className="p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Core Strengths
            </h4>
          </div>
          {strengths.length > 0 ? (
            <ul className="space-y-2">
              {strengths.map((str, i) => (
                <li
                  key={i}
                  className="text-xs text-zinc-300 font-mono flex items-start gap-2"
                >
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-500 font-mono">No strengths noted.</p>
          )}
        </div>

        {/* Risks & Gaps */}
        <div className="p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Gaps & Technical Debt
            </h4>
          </div>
          {risks.length > 0 ? (
            <ul className="space-y-2">
              {risks.map((risk, i) => (
                <li
                  key={i}
                  className="text-xs text-zinc-300 font-mono flex items-start gap-2"
                >
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-500 font-mono">No architectural risks detected.</p>
          )}
        </div>
      </div>
    </div>
  );
}
