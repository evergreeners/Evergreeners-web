import { useState, useEffect, useCallback, useRef } from "react";
import { getApiUrl } from "@/lib/api-config";
import { toast } from "sonner";
import {
  Eye, Plus, Trash2, RefreshCw, Zap, Search, X,
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  ChevronDown, ChevronUp, Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ReactMarkdown from "react-markdown";
import { WatchlistSuggestions } from "@/components/WatchlistSuggestions";

// ── Types ──────────────────────────────────────────────────────

interface WatchedStats {
  login: string; name: string | null; avatarUrl: string; bio: string | null;
  followers: number; publicRepos: number; totalPRs: number; totalContributions: number;
  weeklyCommits: number; monthlyCommits: number; todayCommits: number;
  currentStreak: number; last30: { date: string; count: number }[]; fetchedAt: string;
}
interface WatchedUser {
  id: number; githubUsername: string; displayName: string | null; avatarUrl: string | null;
  addedAt: string; cachedStats: WatchedStats | null; lastRefreshed: string | null;
}
interface SearchResult { login: string; avatarUrl: string; }

// ── Helpers ────────────────────────────────────────────────────

const ANALYSIS_KEY = "eye_analysis";
const ANALYSIS_TS_KEY = "eye_analysis_ts";

function loadSavedAnalysis(): { text: string; ts: string } | null {
  const text = localStorage.getItem(ANALYSIS_KEY);
  const ts = localStorage.getItem(ANALYSIS_TS_KEY);
  if (text && ts) return { text, ts };
  return null;
}

function saveAnalysis(text: string) {
  localStorage.setItem(ANALYSIS_KEY, text);
  localStorage.setItem(ANALYSIS_TS_KEY, new Date().toISOString());
}

function Sparkline({ data }: { data: { count: number }[] }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const w = 80, h = 28;
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - (d.count / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline fill="none" stroke="hsl(142 71% 45%)" strokeWidth="1.5" points={pts} />
    </svg>
  );
}

function StatBadge({ value, compare }: { value: number; compare: number }) {
  if (compare === 0) return null;
  const diff = ((value - compare) / compare) * 100;
  if (Math.abs(diff) < 5) return <Minus className="w-3 h-3 text-muted-foreground" />;
  if (diff > 0) return <TrendingUp className="w-3 h-3 text-emerald-400" />;
  return <TrendingDown className="w-3 h-3 text-red-400" />;
}

// ── Watch Card (clean — no delete button) ──────────────────────

function WatchCard({ entry, myWeekly, myStreak }: {
  entry: WatchedUser; myWeekly: number; myStreak: number;
}) {
  const s = entry.cachedStats;
  const avatar = s?.avatarUrl || entry.avatarUrl || `https://ui-avatars.com/api/?name=${entry.githubUsername}&background=random`;
  const name = s?.name || entry.displayName || entry.githubUsername;
  const weekly = s?.weeklyCommits ?? 0;
  const streak = s?.currentStreak ?? 0;
  const threat = weekly > myWeekly * 1.3;
  const leading = myWeekly > weekly * 1.3;

  return (
    <div className={`relative rounded-2xl border p-4 transition-all duration-300 ${
      threat ? "border-red-500/30 bg-red-500/5" :
      leading ? "border-emerald-500/30 bg-emerald-500/5" :
      "border-border bg-card"
    }`}>
      <div className="flex items-start gap-3">
        <img src={avatar} alt={name} className="w-9 h-9 rounded-full border border-border shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate leading-tight">{name}</p>
          <a href={`https://github.com/${entry.githubUsername}`} target="_blank" rel="noreferrer"
            className="text-[11px] text-muted-foreground hover:text-primary transition-colors">
            @{entry.githubUsername}
          </a>
        </div>
      </div>

      {s ? (
        <>
          <div className="grid grid-cols-3 gap-1 mt-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-0.5">
                <span className="text-base font-bold">{weekly}</span>
                <StatBadge value={weekly} compare={myWeekly} />
              </div>
              <p className="text-[9px] text-muted-foreground">wk commits</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-0.5">
                <span className="text-base font-bold">{streak}</span>
                <StatBadge value={streak} compare={myStreak} />
              </div>
              <p className="text-[9px] text-muted-foreground">streak</p>
            </div>
            <div className="text-center">
              <span className="text-base font-bold">{s.todayCommits}</span>
              <p className="text-[9px] text-muted-foreground">today</p>
            </div>
          </div>
          <div className="mt-2 flex justify-center">
            <Sparkline data={s.last30.slice(-14)} />
          </div>
          <p className="text-[9px] text-muted-foreground text-center">{s.monthlyCommits} commits / 30 days</p>
        </>
      ) : (
        <div className="mt-3 text-center text-xs text-muted-foreground py-2">
          Use Refresh All to load stats
        </div>
      )}

      {/* Status badge at bottom */}
      {s && (
        <div className="mt-3 flex justify-center">
          {threat ? (
            <div className="flex items-center gap-1.5 text-red-400 text-[11px] font-semibold bg-red-500/10 rounded-lg px-3 py-1">
              <AlertTriangle className="w-3 h-3" /> Threat — outpacing you
            </div>
          ) : leading ? (
            <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold bg-emerald-500/10 rounded-lg px-3 py-1">
              <TrendingUp className="w-3 h-3" /> You're leading
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] bg-secondary/50 rounded-lg px-3 py-1">
              <Minus className="w-3 h-3" /> Neck and neck
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Manage Watchlist Sheet ──────────────────────────────────────

function ManageWatchlistSheet({ watchlist, onAdd, onRemove, adding, authToken, onRefreshList }: {
  watchlist: WatchedUser[];
  onAdd: (username: string) => Promise<void>;
  onRemove: (username: string) => void;
  adding: boolean;
  authToken?: string;
  onRefreshList: () => void;
}) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};

  const alreadyAdded = new Set(watchlist.map(e => e.githubUsername));

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.length < 2) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(getApiUrl(`/api/eye/github-search/${encodeURIComponent(query)}`), {
          credentials: "include", headers: authHeaders
        });
        if (res.ok) setSearchResults((await res.json()).users || []);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 400);
  }, [query, authToken]);

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <button className="inline-flex items-center gap-2 h-8 px-4 rounded-xl text-sm font-medium transition-all duration-300 bg-[hsl(0_0%_0%/0.5)] backdrop-blur-[20px] border border-border/50 text-foreground hover:border-primary/40 hover:bg-white/[0.03]">
            <Settings2 className="w-3 h-3 text-muted-foreground" /> Manage
          </button>
        </SheetTrigger>
        <SheetContent className="bg-background border-border w-full sm:max-w-md flex flex-col h-full overflow-hidden">
          <SheetHeader className="shrink-0">
            <SheetTitle className="text-left">Manage Watchlist</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto mt-6 space-y-5 pr-1 custom-scrollbar">
            {/* Search & Add */}
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text" value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search GitHub username…"
                className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              />
              {query && (
                <button onClick={() => { setQuery(""); setSearchResults([]); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {(searchResults.length > 0 || searching) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-2xl z-20 overflow-hidden">
                  {searching && <div className="p-3 text-xs text-muted-foreground text-center">Searching…</div>}
                  {searchResults.map(u => (
                    <button key={u.login} onClick={async () => { await onAdd(u.login); setQuery(""); setSearchResults([]); }}
                      disabled={adding || alreadyAdded.has(u.login)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition-colors text-left disabled:opacity-50">
                      <img src={u.avatarUrl} alt={u.login} className="w-7 h-7 rounded-full border border-border" />
                      <span className="font-medium text-sm">@{u.login}</span>
                      {alreadyAdded.has(u.login)
                        ? <span className="ml-auto text-[11px] text-muted-foreground">Watching</span>
                        : <Plus className="ml-auto w-4 h-4 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {query && !searchResults.length && !searching && (
              <Button size="sm" className="w-full gap-1.5" onClick={async () => { await onAdd(query.trim()); setQuery(""); }}
                disabled={adding}>
                <Plus className="w-4 h-4" /> Add @{query.trim()}
              </Button>
            )}

            <p className="text-xs text-muted-foreground">{watchlist.length}/15 slots used</p>

            {/* Current watchlist */}
            <div className="space-y-2">
              {watchlist.map(entry => (
                <div key={entry.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                  <img
                    src={entry.avatarUrl || `https://ui-avatars.com/api/?name=${entry.githubUsername}&background=random`}
                    alt={entry.githubUsername}
                    className="w-8 h-8 rounded-full border border-border shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.displayName || entry.githubUsername}</p>
                    <p className="text-[11px] text-muted-foreground">@{entry.githubUsername}</p>
                  </div>
                  <Button
                    size="sm" variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => setRemoveTarget(entry.githubUsername)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}

              {watchlist.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No one on your watchlist yet. Search above to add someone.
                </p>
              )}
            </div>

            {/* Suggestions — mobile only (desktop has sidebar) */}
            <div className="md:hidden mt-4 pt-4 border-t border-border pb-8">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Suggested to Watch</p>
              <WatchlistSuggestions 
                authToken={authToken} 
                inline 
                onAdded={onRefreshList}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Remove confirmation dialog — Premium Glass Style */}
      <AlertDialog open={!!removeTarget} onOpenChange={o => !o && setRemoveTarget(null)}>
        <AlertDialogContent className="bg-[#080808]/90 backdrop-blur-[32px] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden p-0 max-w-sm animate-in fade-in zoom-in-95">
          <div className="relative h-20 bg-gradient-to-br from-destructive/20 to-transparent">
            <div className="absolute inset-0 bg-grid-white/[0.01]" />
          </div>
          
          <div className="px-6 pt-6 pb-8">
            <AlertDialogHeader>
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-xl font-bold tracking-tight">
                Remove @{removeTarget}?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground leading-relaxed mt-2">
                This user will be removed from your active tracking. You'll lose their current activity history in your dashboard.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="mt-8 flex flex-col gap-2">
              <AlertDialogAction 
                onClick={() => { if (removeTarget) onRemove(removeTarget); setRemoveTarget(null); }}
                className="w-full h-12 rounded-xl bg-destructive text-destructive-foreground font-bold hover:bg-destructive/90 shadow-[0_8px_20px_-4px_hsl(346_84%_49%/0.4)] transition-all active:scale-[0.98]"
              >
                Remove User
              </AlertDialogAction>
              <AlertDialogCancel className="w-full h-12 rounded-xl bg-white/[0.03] border-white/5 hover:bg-white/[0.08] text-muted-foreground transition-all">
                Keep Watching
              </AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Main EyeSection ────────────────────────────────────────────

interface EyeSectionProps {
  myWeekly: number; myStreak: number; myTodayCommits: number;
  myTotalCommits: number; myTotalPRs: number;
  myUsername: string; myAvatar: string; authToken?: string;
  refreshTrigger?: number;
}

export function EyeSection({
  myWeekly, myStreak, myTodayCommits, myTotalCommits, myTotalPRs, myUsername, myAvatar, authToken, refreshTrigger
}: EyeSectionProps) {
  const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};

  const [watchlist, setWatchlist] = useState<WatchedUser[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [refreshing, setRefreshing] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);

  // Analysis state — persisted in localStorage
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisTs, setAnalysisTs] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisCollapsed, setAnalysisCollapsed] = useState(false);

  // Load saved analysis on mount
  useEffect(() => {
    const saved = loadSavedAnalysis();
    if (saved) {
      setAnalysis(saved.text);
      setAnalysisTs(saved.ts);
    }
  }, []);

  const loadWatchlist = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch(getApiUrl("/api/eye/watchlist"), { credentials: "include", headers: authHeaders });
      if (res.ok) setWatchlist((await res.json()).watchlist || []);
    } catch (e) { console.error(e); }
    finally { setLoadingList(false); }
  }, [authToken]);

  useEffect(() => { loadWatchlist(); }, [loadWatchlist, refreshTrigger]);

  const addToWatchlist = async (username: string) => {
    setAdding(true);
    try {
      const res = await fetch(getApiUrl("/api/eye/watchlist"), {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ githubUsername: username }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message); return; }
      toast.success(`@${username} added to The Eye`);
      await loadWatchlist();
    } catch { toast.error("Failed to add user"); }
    finally { setAdding(false); }
  };

  const removeFromWatchlist = async (username: string) => {
    try {
      await fetch(getApiUrl(`/api/eye/watchlist/${username}`), {
        method: "DELETE", credentials: "include", headers: authHeaders
      });
      setWatchlist(prev => prev.filter(e => e.githubUsername !== username));
      toast.success(`@${username} removed`);
    } catch { toast.error("Failed to remove"); }
  };

  const refreshStats = async (username: string) => {
    setRefreshing(prev => ({ ...prev, [username]: true }));
    try {
      const res = await fetch(getApiUrl(`/api/eye/stats/${username}`), {
        credentials: "include", headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message); return; }
      setWatchlist(prev => prev.map(e =>
        e.githubUsername === username ? { ...e, cachedStats: data.stats, lastRefreshed: new Date().toISOString() } : e
      ));
    } catch { toast.error("Failed to refresh stats"); }
    finally { setRefreshing(prev => ({ ...prev, [username]: false })); }
  };

  const refreshAll = async () => {
    await Promise.all(watchlist.map(e => refreshStats(e.githubUsername)));
    toast.success("All stats refreshed");
  };

  const runAnalysis = async () => {
    const withStats = watchlist.filter(e => e.cachedStats);
    if (withStats.length === 0) { toast.error("Refresh stats first."); return; }
    setAnalyzing(true); setAnalysisCollapsed(false);
    try {
      const res = await fetch(getApiUrl("/api/eye/analyze"), {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          watchlistStats: withStats.map(e => e.cachedStats),
          myStats: { username: myUsername, weeklyCommits: myWeekly, streak: myStreak, totalCommits: myTotalCommits, totalPullRequests: myTotalPRs },
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message); return; }
      setAnalysis(data.analysis);
      setAnalysisTs(new Date().toISOString());
      saveAnalysis(data.analysis);
    } catch { toast.error("Analysis failed"); }
    finally { setAnalyzing(false); }
  };

  const timeSince = (iso: string) => {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.round(hrs / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header row — centered on mobile */}
      <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground order-2 sm:order-1">
          Track competitors' public activity · {watchlist.length}/15 slots
        </p>
        <div className="flex gap-2 order-1 sm:order-2">
          <ManageWatchlistSheet
            watchlist={watchlist}
            onAdd={addToWatchlist}
            onRemove={removeFromWatchlist}
            adding={adding}
            authToken={authToken}
            onRefreshList={loadWatchlist}
          />
          {watchlist.length > 0 && (
            <>
              <button 
                onClick={refreshAll}
                className="inline-flex items-center gap-2 h-8 px-4 rounded-xl text-sm font-medium transition-all duration-300 bg-secondary/30 backdrop-blur-[10px] border border-border/50 hover:border-primary/40"
              >
                <RefreshCw className="w-3 h-3 text-muted-foreground" /> Refresh All
              </button>
              <button
                onClick={runAnalysis} disabled={analyzing}
                className="inline-flex items-center gap-2 h-8 px-4 rounded-xl text-sm font-medium transition-all duration-300 bg-[hsl(0_0%_0%/0.5)] backdrop-blur-[20px] border border-primary/30 text-primary hover:border-primary/60 hover:shadow-[0_0_16px_hsl(142_71%_45%/0.15)] disabled:opacity-60 disabled:pointer-events-none"
              >
                <Zap className="w-3 h-3" />
                {analyzing ? "Analyzing…" : "AI Intel"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* AI Analysis — persisted & collapsible */}
      {(analysis || analyzing) && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 overflow-hidden">
          <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition-colors"
            onClick={() => setAnalysisCollapsed(v => !v)}>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">AI Intelligence Report</p>
                <p className="text-[11px] text-muted-foreground">
                  {analyzing ? "Generating…" : analysisTs ? `Generated ${timeSince(analysisTs)}` : "Gemini 2.5 Flash"}
                </p>
              </div>
            </div>
            {analysisCollapsed
              ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
              : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
          </button>
          {!analysisCollapsed && (
            <div className="px-4 pb-4">
              {analyzing ? (
                <div className="flex items-center gap-3 py-4 text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm">The Eye is scanning your competition…</span>
                </div>
              ) : analysis ? (
                <div className="prose prose-invert prose-sm max-w-none [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_ul]:space-y-1 [&_li]:text-sm [&_p]:text-sm [&_p]:text-muted-foreground [&_p]:leading-relaxed">
                  <ReactMarkdown>{analysis}</ReactMarkdown>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Cards grid */}
      {loadingList ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2].map(i => <div key={i} className="rounded-2xl border border-border bg-card h-44 animate-pulse" />)}
        </div>
      ) : watchlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-2xl">
          <Eye className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="font-medium text-sm">The Eye sees nothing yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mb-4">
            Add GitHub users to your watchlist to start tracking their public activity.
          </p>
          <ManageWatchlistSheet
            watchlist={watchlist}
            onAdd={addToWatchlist}
            onRemove={removeFromWatchlist}
            adding={adding}
            authToken={authToken}
            onRefreshList={loadWatchlist}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* My reference card */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-3">
              <img src={myAvatar} alt="You" className="w-9 h-9 rounded-full border border-primary/30" />
              <div>
                <p className="font-semibold text-sm text-primary">You</p>
                <p className="text-[11px] text-muted-foreground">@{myUsername || "me"}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[
                { v: myWeekly, l: "wk commits" },
                { v: myStreak, l: "streak" },
                { v: myTodayCommits, l: "today" },
              ].map(({ v, l }) => (
                <div key={l} className="text-center">
                  <span className="text-base font-bold text-primary">{v}</span>
                  <p className="text-[9px] text-muted-foreground">{l}</p>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-primary/50 text-center mt-2">← your baseline for comparison</p>
          </div>

          {watchlist.map(entry => (
            <WatchCard
              key={entry.id} entry={entry}
              myWeekly={myWeekly} myStreak={myStreak}
            />
          ))}
        </div>
      )}

      {watchlist.length > 0 && (
        <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground pt-1">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-red-500/20 border border-red-500/30" /><span>Threat — outpacing you 30%+</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20 border border-emerald-500/30" /><span>Leading — you're ahead 30%+</span></div>
          <div className="flex items-center gap-1.5"><TrendingUp className="w-3 h-3 text-emerald-400" /><span>Above your baseline</span></div>
          <div className="flex items-center gap-1.5"><TrendingDown className="w-3 h-3 text-red-400" /><span>Below your baseline</span></div>
        </div>
      )}
    </div>
  );
}
