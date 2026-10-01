import React from "react";
import { GitCommit, ExternalLink } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

export interface CommitItem {
  sha?: string;
  node_id?: string;
  html_url?: string;
  commit?: {
    message?: string;
    author?: {
      name?: string;
      date?: string;
    };
  };
  author?: {
    login?: string;
    avatar_url?: string;
  };
}

export interface RecentCommitStreamProps {
  commits: CommitItem[];
}

export function RecentCommitStream({ commits }: RecentCommitStreamProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold tracking-tight text-zinc-200 uppercase font-mono">
            Recent Commit Stream
          </h2>
        </div>
        <span className="text-xs font-mono px-2.5 py-0.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400">
          {commits.length} {commits.length === 1 ? "Commit" : "Commits"}
        </span>
      </div>

      <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm divide-y divide-zinc-800/50 overflow-hidden">
        {commits.length > 0 ? (
          commits.map((c) => {
            const authorLogin =
              c.author?.login || c.commit?.author?.name || "contributor";
            const avatar = c.author?.avatar_url;
            const message = c.commit?.message?.split("\n")[0] || "Update";
            const sha = c.sha ? c.sha.slice(0, 7) : "";
            const dateStr = c.commit?.author?.date;

            return (
              <div
                key={c.sha || c.node_id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-900/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={authorLogin}
                      className="w-7 h-7 rounded-full border border-zinc-700/60 shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-xs font-mono text-zinc-400 shrink-0">
                      {authorLogin.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate font-mono">
                      {message}
                    </p>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">
                      by <span className="text-zinc-400">@{authorLogin}</span>
                      {dateStr && (
                        <>
                          {" "}
                          •{" "}
                          {formatDistanceToNow(parseISO(dateStr), {
                            addSuffix: true,
                          })}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {sha && (
                    <span className="text-xs font-mono px-2 py-1 rounded bg-zinc-900/80 border border-zinc-800 text-zinc-400">
                      {sha}
                    </span>
                  )}
                  {c.html_url && (
                    <a
                      href={c.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                      title="View commit on GitHub"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-sm font-mono text-zinc-500">
            No recent commit history retrieved.
          </div>
        )}
      </div>
    </div>
  );
}
