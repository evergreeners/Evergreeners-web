import React from "react";
import { Button } from "@/components/ui/button";
import {
  FolderGit2,
  GitBranch,
  Star,
  GitFork,
  Eye,
  AlertCircle,
  Layers,
  ShieldCheck,
  Tag,
  ExternalLink,
  Terminal,
  Cpu,
} from "lucide-react";

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  Go: "#00ADD8",
  Rust: "#dea584",
  PHP: "#4F5D95",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Shell: "#89e051",
  Dart: "#00B4AB",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
};

export interface RepoHeroCardProps {
  repoInfo: any;
  languages?: Record<string, number>;
  isAnalyzing: boolean;
  onRunAudit: () => void;
}

export function RepoHeroCard({
  repoInfo,
  languages = {},
  isAnalyzing,
  onRunAudit,
}: RepoHeroCardProps) {
  const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0);
  const languageStats =
    totalBytes > 0
      ? Object.entries(languages).map(([name, bytes]) => ({
          name,
          percentage: Math.round((bytes / totalBytes) * 100),
          color: LANGUAGE_COLORS[name] || "#a1a1aa",
        }))
      : [];

  return (
    <section className="rounded-2xl border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm p-6 sm:p-8 space-y-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-3xl">
          <div className="flex items-center gap-3 flex-wrap">
            <FolderGit2 className="w-7 h-7 text-emerald-400" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 font-mono">
              {repoInfo.name}
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-400">
              {repoInfo.private ? "Private" : "Public"}
            </span>
            {repoInfo.default_branch && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-md border border-zinc-800/80 bg-zinc-900/40 text-zinc-400 flex items-center gap-1">
                <GitBranch className="w-3 h-3 text-zinc-400" />
                {repoInfo.default_branch}
              </span>
            )}
          </div>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            {repoInfo.description || "No description provided for this repository."}
          </p>

          {/* Topics */}
          {Array.isArray(repoInfo.topics) && repoInfo.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {repoInfo.topics.map((t: string) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-secondary/60 border border-border/40 text-zinc-300"
                >
                  <Tag className="w-2.5 h-2.5 text-zinc-500" />
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {repoInfo.html_url && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-2 border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:text-white hover:bg-zinc-800"
            >
              <a href={repoInfo.html_url} target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4" />
                GitHub
              </a>
            </Button>
          )}

          <Button
            onClick={onRunAudit}
            disabled={isAnalyzing}
            size="sm"
            className="gap-2 bg-emerald-500 text-zinc-950 font-semibold hover:bg-emerald-400 border border-emerald-400 shadow-sm"
          >
            {isAnalyzing ? (
              <>
                <Cpu className="w-4 h-4 animate-spin text-zinc-950" />
                <span>Auditing Codebase...</span>
              </>
            ) : (
              <>
                <Terminal className="w-4 h-4 text-zinc-950" />
                <span>Run Codebase Audit</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800/60 bg-zinc-900/40 text-xs font-mono text-zinc-300">
          <Star className="w-3.5 h-3.5 text-amber-400" />
          <span>{repoInfo.stargazers_count ?? 0}</span>
          <span className="text-zinc-500">stars</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800/60 bg-zinc-900/40 text-xs font-mono text-zinc-300">
          <GitFork className="w-3.5 h-3.5 text-zinc-400" />
          <span>{repoInfo.forks_count ?? 0}</span>
          <span className="text-zinc-500">forks</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800/60 bg-zinc-900/40 text-xs font-mono text-zinc-300">
          <Eye className="w-3.5 h-3.5 text-zinc-400" />
          <span>{repoInfo.watchers_count ?? 0}</span>
          <span className="text-zinc-500">watchers</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800/60 bg-zinc-900/40 text-xs font-mono text-zinc-300">
          <AlertCircle className="w-3.5 h-3.5 text-zinc-400" />
          <span>{repoInfo.open_issues_count ?? 0}</span>
          <span className="text-zinc-500">issues</span>
        </div>

        {repoInfo.size !== undefined && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800/60 bg-zinc-900/40 text-xs font-mono text-zinc-300">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span>
              {repoInfo.size > 1024
                ? `${(repoInfo.size / 1024).toFixed(1)} MB`
                : `${repoInfo.size} KB`}
            </span>
          </div>
        )}

        {repoInfo.license && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800/60 bg-zinc-900/40 text-xs font-mono text-zinc-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{repoInfo.license.spdx_id || repoInfo.license.name}</span>
          </div>
        )}
      </div>

      {/* Languages Segmented Progress Bar */}
      {languageStats.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-zinc-800/50">
          <div className="w-full h-2 rounded-full overflow-hidden flex bg-zinc-900 border border-zinc-800/50">
            {languageStats.map((l) => (
              <div
                key={l.name}
                style={{
                  width: `${l.percentage}%`,
                  backgroundColor: l.color,
                }}
                className="h-full first:rounded-l-full last:rounded-r-full"
                title={`${l.name}: ${l.percentage}%`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-mono text-zinc-400">
            {languageStats.slice(0, 6).map((l) => (
              <div key={l.name} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: l.color }}
                />
                <span className="text-zinc-300">{l.name}</span>
                <span className="text-zinc-500">{l.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
