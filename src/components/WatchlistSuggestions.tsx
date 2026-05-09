import { useState, useEffect } from "react";
import { getApiUrl } from "@/lib/api-config";
import { toast } from "sonner";
import { Plus, ChevronDown, UserCheck, Users, Zap } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Suggestion {
  login: string;
  avatarUrl: string;
  mutual: boolean;
  recentActivity: number;
  activityDays: number[];
}

interface WatchlistSuggestionsProps {
  authToken?: string;
  onAdded?: () => void;
  /** Renders inline without "See more" (for embedding in sheets on mobile) */
  inline?: boolean;
}

// Mini sparkline bar chart for 14-day activity
function MiniActivity({ days }: { days: number[] }) {
  if (!days || days.length === 0) return null;
  const max = Math.max(...days, 1);
  return (
    <div className="flex items-end gap-[2px] h-4">
      {days.map((d, i) => (
        <div
          key={i}
          className="w-[3px] rounded-sm transition-all"
          style={{
            height: `${Math.max((d / max) * 100, 8)}%`,
            backgroundColor: d === 0
              ? "hsl(0 0% 100% / 0.06)"
              : `hsl(142 71% 45% / ${0.25 + (d / max) * 0.75})`,
          }}
        />
      ))}
    </div>
  );
}

export function WatchlistSuggestions({ authToken, onAdded, inline }: WatchlistSuggestionsProps) {
  const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmUser, setConfirmUser] = useState<Suggestion | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(getApiUrl("/api/eye/suggestions"), {
          credentials: "include", headers: authHeaders,
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, [authToken]);

  const addUser = async (username: string) => {
    setAdding(username);
    try {
      const res = await fetch(getApiUrl("/api/eye/watchlist"), {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ githubUsername: username }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message); return; }
      toast.success(`@${username} added to The Eye`);
      setSuggestions(prev => prev.filter(s => s.login !== username));
      onAdded?.();
    } catch { toast.error("Failed to add"); }
    finally { setAdding(null); }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-xl bg-secondary/30 h-12 animate-pulse" />
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  // ── Inline mode (mobile manage sheet) — compact list ──
  const renderInlineItem = (user: Suggestion) => (
    <div key={user.login}
      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/50 transition-colors">
      <img src={user.avatarUrl} alt={user.login}
        className="w-8 h-8 rounded-full border border-border shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate leading-tight">@{user.login}</p>
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          {user.mutual && <><UserCheck className="w-3 h-3 text-primary" /> Mutual · </>}
          {user.recentActivity > 0 ? `${user.recentActivity} contributions` : "Low activity"}
        </p>
      </div>
      <MiniActivity days={user.activityDays} />
      <button onClick={() => setConfirmUser(user)} disabled={adding === user.login}
        className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors shrink-0 disabled:opacity-50">
        {adding === user.login ? (
          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
      </button>
    </div>
  );

  if (inline) {
    return <div className="space-y-1">{suggestions.map(renderInlineItem)}</div>;
  }

  // ── Desktop: single-column list with activity sparkline ──
  const renderRow = (user: Suggestion) => (
    <div key={user.login}
      className="group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 bg-[hsl(0_0%_0%/0.35)] backdrop-blur-[12px] border border-[hsl(0_0%_100%/0.05)] hover:border-primary/25 hover:bg-[hsl(0_0%_0%/0.5)]"
    >
      <img src={user.avatarUrl} alt={user.login}
        className="w-9 h-9 rounded-full border border-[hsl(0_0%_100%/0.08)] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate leading-tight">@{user.login}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {user.mutual && (
            <span className="flex items-center gap-0.5 text-[10px] text-primary">
              <UserCheck className="w-3 h-3" />
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">
            {user.recentActivity > 0 ? `${user.recentActivity}` : "0"} / 14d
          </span>
        </div>
      </div>
      <MiniActivity days={user.activityDays} />
      <button onClick={() => setConfirmUser(user)} disabled={adding === user.login}
        className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 hover:border-primary/40 transition-all shrink-0 opacity-60 group-hover:opacity-100 disabled:opacity-40">
        {adding === user.login ? (
          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <Plus className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );

  const preview = suggestions.slice(0, 8);
  const hasMore = suggestions.length > 8;

  return (
    <div className="space-y-2">
      {preview.map(renderRow)}

      {hasMore && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <button className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors rounded-xl hover:bg-primary/5">
              <ChevronDown className="w-3.5 h-3.5" />
              See all {suggestions.length} suggestions
            </button>
          </DialogTrigger>
          <DialogContent className="bg-[hsl(0_0%_5%/0.85)] backdrop-blur-[32px] border border-[hsl(0_0%_100%/0.08)] rounded-t-3xl sm:rounded-2xl max-h-[75vh] overflow-hidden p-0 sm:max-w-2xl data-[state=open]:slide-in-from-bottom-4">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-[hsl(0_0%_100%/0.06)]">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-primary" />
                Suggested to Watch
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Sorted by recent activity · {suggestions.length} people you follow
              </p>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[60vh] px-4 py-3 space-y-2 custom-scrollbar">
              {suggestions.map(user => (
                <div key={user.login}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-[hsl(0_0%_0%/0.3)] backdrop-blur-sm border border-[hsl(0_0%_100%/0.04)] hover:border-primary/20 transition-all group">
                  <img src={user.avatarUrl} alt={user.login}
                    className="w-10 h-10 rounded-full border border-[hsl(0_0%_100%/0.08)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">@{user.login}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {user.mutual && (
                        <span className="flex items-center gap-0.5 text-[10px] text-primary">
                          <UserCheck className="w-3 h-3" /> Mutual
                        </span>
                      )}
                      {user.recentActivity > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          {user.mutual && <span className="text-muted-foreground/30">·</span>}
                          <Zap className="w-2.5 h-2.5 text-primary" />
                          {user.recentActivity} contributions (14d)
                        </span>
                      )}
                      {!user.mutual && user.recentActivity === 0 && (
                        <span className="text-[10px] text-muted-foreground/60">Low activity</span>
                      )}
                    </div>
                  </div>
                  <MiniActivity days={user.activityDays} />
                  <button onClick={() => setConfirmUser(user)} disabled={adding === user.login}
                    className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all shrink-0 disabled:opacity-50">
                    {adding === user.login ? (
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Dialog — Liquid Glass Style */}
      <AlertDialog open={!!confirmUser} onOpenChange={o => !o && setConfirmUser(null)}>
        <AlertDialogContent className="bg-[hsl(0_0%_5%/0.85)] backdrop-blur-[32px] border border-[hsl(0_0%_100%/0.08)] sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <img src={confirmUser?.avatarUrl} className="w-6 h-6 rounded-full" />
              Watch @{confirmUser?.login}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will add them to your competitive watchlist. They have made <span className="text-primary font-medium">{confirmUser?.recentActivity} contributions</span> in the last 14 days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-border hover:bg-white/5 transition-colors">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => { if (confirmUser) addUser(confirmUser.login); setConfirmUser(null); }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(142_71%_45%/0.2)]"
            >
              Add to Watchlist
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
