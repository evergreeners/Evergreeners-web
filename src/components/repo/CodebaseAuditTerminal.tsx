import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Terminal, Cpu, Check, ShieldCheck, Layers, GitBranch } from "lucide-react";

export interface CodebaseAuditTerminalProps {
  repoName: string;
  isAnalyzing: boolean;
  onRunAudit: () => void;
}

const DIAGNOSTIC_STEPS = [
  "Connecting to repository metadata and file tree...",
  "Inspecting repository structure and hygiene files (.gitignore, license, CI)...",
  "Evaluating language distribution and module complexity...",
  "Analyzing recent commit cadence, author attribution, and velocity...",
  "Dispatching architectural heuristics to Gemini Flash model...",
  "Synthesizing dimensional scores and prioritized engineering recommendations...",
];

export function CodebaseAuditTerminal({
  repoName,
  isAnalyzing,
  onRunAudit,
}: CodebaseAuditTerminalProps) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      setActiveStep(0);
      interval = setInterval(() => {
        setActiveStep((prev) => (prev < DIAGNOSTIC_STEPS.length - 1 ? prev + 1 : prev));
      }, 700);
    } else {
      setActiveStep(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md overflow-hidden shadow-2xl font-mono">
      {/* Terminal Window Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/60">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-zinc-700/80" />
          <div className="w-3 h-3 rounded-full bg-zinc-700/80" />
          <div className="w-3 h-3 rounded-full bg-zinc-700/80" />
          <span className="ml-2 text-xs text-zinc-400 font-mono">
            evergreeners audit — {repoName}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              isAnalyzing ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
            }`}
          />
          <span>{isAnalyzing ? "DIAGNOSING" : "READY"}</span>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="p-6 sm:p-8 space-y-6">
        {isAnalyzing ? (
          <div className="space-y-4 py-4">
            <div className="text-xs text-emerald-400 flex items-center gap-2">
              <Cpu className="w-4 h-4 animate-spin" />
              <span>[DIAGNOSTIC PIPELINE ACTIVE]</span>
            </div>

            <div className="space-y-2.5 text-xs text-zinc-300">
              {DIAGNOSTIC_STEPS.slice(0, activeStep + 1).map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="text-zinc-600 select-none">
                    [{idx.toString().padStart(2, "0")}]
                  </span>
                  {idx < activeStep ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>{step}</span>
                    </span>
                  ) : (
                    <span className="text-zinc-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                      <span>{step}</span>
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 text-[11px] text-zinc-500 flex items-center gap-1">
              <span>Streaming token outputs</span>
              <span className="animate-pulse">_</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="text-xs text-zinc-500 select-none">
                # Architectural Audit Engine v2.5
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-100 font-mono">
                Initiate Codebase Diagnostic
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans max-w-xl">
                Run an in-depth architectural diagnosis of{" "}
                <span className="font-mono text-zinc-200">{repoName}</span>. Evaluates
                documentation rigor, testing hygiene, structural modularity, and detects
                concrete engineering debt.
              </p>
            </div>

            {/* Checklist of What Will Be Checked */}
            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl border border-zinc-800/60 bg-zinc-900/40 flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-medium text-zinc-200">Hygiene & Safety</p>
                  <p className="text-zinc-500">.gitignore, licenses, secrets, workflow security</p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-zinc-800/60 bg-zinc-900/40 flex items-center gap-3">
                <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-medium text-zinc-200">Modularity & Depth</p>
                  <p className="text-zinc-500">File hierarchy, separation of concerns, cohesion</p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-zinc-800/60 bg-zinc-900/40 flex items-center gap-3">
                <GitBranch className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-medium text-zinc-200">Commit Lineage</p>
                  <p className="text-zinc-500">Commit frequency, velocity, and author breakdown</p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-zinc-800/60 bg-zinc-900/40 flex items-center gap-3">
                <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-medium text-zinc-200">Actionable Fixes</p>
                  <p className="text-zinc-500">Prioritized engineering tasks with time estimates</p>
                </div>
              </div>
            </div>

            {/* Terminal Action Trigger */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-zinc-800/80">
              <div className="text-xs text-zinc-500">
                Command: <span className="text-zinc-300">$ npx audit --target={repoName}</span>
              </div>
              <Button
                onClick={onRunAudit}
                disabled={isAnalyzing}
                className="gap-2 bg-emerald-500 text-zinc-950 font-semibold hover:bg-emerald-400 border border-emerald-400 shadow-sm"
              >
                <Terminal className="w-4 h-4 text-zinc-950" />
                <span>Execute Architectural Diagnosis</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
