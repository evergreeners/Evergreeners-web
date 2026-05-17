import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { FloatingNav } from "@/components/FloatingNav";
import { useSession } from "@/lib/auth-client";
import { getApiUrl } from "@/lib/api-config";
import { toast } from "sonner";
import { Eye, Plus, Trash2, RefreshCw, Zap, Search, X, TrendingUp, TrendingDown, Minus, GitCommit, GitPullRequest, Flame, Users, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

interface WatchedUser {
  id: number;
  githubUsername: string;
  displayName: string | null;
  avatarUrl: string | null;
  addedAt: string;
  cachedStats: WatchedStats | null;
  lastRefreshed: string | null;
}

interface WatchedStats {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  followers: number;
  publicRepos: number;
  totalPRs: number;
  totalContributions: number;
  weeklyCommits: number;
  monthlyCommits: number;
  todayCommits: number;
  currentStreak: number;
  last30: { date: string; count: number }[];
  fetchedAt: string;
}

interface SearchResult { login: string; avatarUrl: string; }

function Sparkline({ data }: { data: { count: number }[] }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const w = 80, h = 28;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (d.count / max) * h;
    return `${x},${y}`;
  }).join(" ");
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

function WatchCard({
  entry, myWeekly, myStreak, onRemove, onRefresh, loading
}: {
  entry: WatchedUser;
  myWeekly: number;
  myStreak: number;
  onRemove: (u: string) => void;
  onRefresh: (u: string) => void;
  loading: boolean;
}) {
  const s = entry.cachedStats;
  const avatar = s?.avatarUrl || entry.avatarUrl || `https://ui-avatars.com/api/?name=${entry.githubUsername}&background=random`;
  const name = s?.name || entry.displayName || entry.githubUsername;
  const weekly = s?.weeklyCommits ?? 0;
  const streak = s?.currentStreak ?? 0;
  const threat = weekly > myWeekly * 1.3;
  const behind = myWeekly > weekly * 1.3;

  return (
    <div className={`relative rounded-2xl border p-4 transition-all duration-300 group ${
      threat ? "border-red-500/30 bg-red-500/5" :
      behind ? "border-emerald-500/30 bg-emerald-500/5" :
      "border-border bg-card"
    }`}>
      {threat && (
        <div className="absolute top-3 right-3 flex items-center gap-1 text-red-400 text-xs font-medium">
          <AlertTriangle className="w-3 h-3" /> Threat
        </div>
      )}
      {behind && !threat && (
        <div className="absolute top-3 right-3 flex items-center gap-1 text-emerald-400 text-xs font-medium">
          <TrendingUp className="w-3 h-3" /> Leading
        </div>
      )}

      <div className="flex items-start gap-3">
        <img src={avatar} alt={name} className="w-10 h-10 rounded-full border border-border shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{name}</p>
          <a
            href={`https://github.com/${entry.githubUsername}`}
            target="_blank" rel="noreferrer"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            @{entry.githubUsername}
          </a>
        </div>
      </div>

      {s ? (
        <>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-lg font-bold">{weekly}</span>
                <StatBadge value={weekly} compare={myWeekly} />
              </div>
              <p className="text-[10px] text-muted-foreground">wk commits</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-lg font-bold">{streak}</span>
                <StatBadge value={streak} compare={myStreak} />
              </div>
              <p className="text-[10px] text-muted-foreground">day streak</p>
            </div>
            <div className="text-center">
              <span className="text-lg font-bold">{s.todayCommits}</span>
              <p className="text-[10px] text-muted-foreground">today</p>
            </div>
          </div>
          <div className="mt-3 flex justify-center">
            <Sparkline data={s.last30.slice(-14)} />
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-1">
            {s.monthlyCommits} commits / 30 days
          </p>
        </>
      ) : (
        <div className="mt-4 text-center text-xs text-muted-foreground py-3">
          {loading ? "Fetching stats..." : "No stats yet — click refresh"}
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <Button
          size="sm" variant="ghost"
          className="flex-1 h-7 text-xs gap-1"
          onClick={() => onRefresh(entry.githubUsername)}
          disabled={loading}
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button
          size="sm" variant="ghost"
          className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onRemove(entry.githubUsername)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export default function TheEye() {
  const { data: session } = useSession();
  const sessionUser = session?.user as any;
  const token = (session?.session as any)?.token;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const [watchlist, setWatchlist] = useState<WatchedUser[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [refreshing, setRefreshing] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myWeekly = sessionUser?.weeklyCommits || 0;
  const myStreak = sessionUser?.streak || 0;

  // Load watchlist
  const loadWatchlist = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch(getApiUrl("/api/eye/watchlist"), {
        credentials: "include", headers: authHeaders
      });
      if (res.ok) {
        const data = await res.json();
        setWatchlist(data.watchlist || []);
        if (data.eyeInsight) {
          setAnalysis(data.eyeInsight);
          setShowAnalysis(true);
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoadingList(false); }
  }, [token]);

  useEffect(() => { if (sessionUser) loadWatchlist(); }, [sessionUser, loadWatchlist]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.length < 2) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(getApiUrl(`/api/eye/github-search/${encodeURIComponent(query)}`), {
          credentials: "include", headers: authHeaders
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        }
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 400);
  }, [query, token]);

  const addToWatchlist = async (username: string) => {
    setAdding(true);
    try {
      const res = await fetch(getApiUrl("/api/eye/watchlist"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ githubUsername: username }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message); return; }
      toast.success(`@${username} added to The Eye`);
      setQuery(""); setSearchResults([]);
      await loadWatchlist();
      await refreshStats(username);
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
    setRefreshingAll(true);
    try {
      await Promise.all(watchlist.map(entry => refreshStats(entry.githubUsername)));
      toast.success("All stats refreshed");
    } catch {
      toast.error("Failed to refresh some stats");
    } finally {
      setRefreshingAll(false);
    }
  };

  const runAnalysis = async () => {
    const withStats = watchlist.filter(e => e.cachedStats);
    if (withStats.length === 0) {
      toast.error("Refresh stats for at least one person first.");
      return;
    }
    setAnalyzing(true);
    setShowAnalysis(true);
    try {
      const res = await fetch(getApiUrl("/api/eye/analyze"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          watchlistStats: withStats.map(e => e.cachedStats),
          myStats: {
            username: sessionUser?.username || "you",
            weeklyCommits: myWeekly,
            streak: myStreak,
            totalCommits: sessionUser?.totalCommits || 0,
            totalPullRequests: sessionUser?.totalPullRequests || 0,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message); setShowAnalysis(false); return; }
      setAnalysis(data.analysis);
    } catch { toast.error("Analysis failed"); setShowAnalysis(false); }
    finally { setAnalyzing(false); }
  };

  const alreadyAdded = new Set(watchlist.map(e => e.githubUsername));

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <main className="w-full max-w-5xl mx-auto px-4 md:px-8 pt-24 pb-32 md:pb-12 space-y-8">

        {/* Hero */}
        <section className="animate-fade-in">
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card p-8 md:p-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 shrink-0">
                <Eye className="w-8 h-8 text-primary animate-pulse-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  The <span className="text-gradient">Eye</span>
                </h1>
                <p className="text-muted-foreground mt-1 max-w-xl">
                  Track competitors. Get AI intel. Stay hungry. Public GitHub activity only — no private data.
                </p>
              </div>
              {watchlist.length > 0 && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline" size="sm"
                    className="gap-2 border-border"
                    onClick={refreshAll}
                    disabled={refreshingAll}
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshingAll ? "animate-spin" : ""}`} /> 
                    {refreshingAll ? "Refreshing..." : "Refresh All"}
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={runAnalysis}
                    disabled={analyzing}
                  >
                    <Zap className="w-4 h-4" />
                    {analyzing ? "Analyzing..." : "AI Analysis"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Add User */}
        <section className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="relative">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search GitHub username to add to watchlist..."
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                />
                {query && (
                  <button onClick={() => { setQuery(""); setSearchResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {query && !searchResults.length && (
                <Button
                  onClick={() => addToWatchlist(query.trim())}
                  disabled={adding}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              )}
            </div>

            {/* Search dropdown */}
            {(searchResults.length > 0 || searching) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl z-20 overflow-hidden">
                {searching && (
                  <div className="p-3 text-sm text-muted-foreground text-center">Searching...</div>
                )}
                {searchResults.map(u => (
                  <button
                    key={u.login}
                    onClick={() => addToWatchlist(u.login)}
                    disabled={adding || alreadyAdded.has(u.login)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors text-left disabled:opacity-50"
                  >
                    <img src={u.avatarUrl} alt={u.login} className="w-8 h-8 rounded-full border border-border" />
                    <span className="font-medium text-sm">@{u.login}</span>
                    {alreadyAdded.has(u.login) && (
                      <span className="ml-auto text-xs text-muted-foreground">Already watching</span>
                    )}
                    {!alreadyAdded.has(u.login) && (
                      <Plus className="ml-auto w-4 h-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-2 ml-1">
            Watchlist: {watchlist.length}/15 · Only public GitHub activity is tracked
          </p>
        </section>

        {/* AI Analysis Panel */}
        {showAnalysis && (
          <section className="animate-fade-up">
            <div className="rounded-2xl border border-primary/30 bg-primary/5 overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors"
                onClick={() => setShowAnalysis(v => !v)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">AI Intelligence Report</p>
                    <p className="text-xs text-muted-foreground">Powered by Gemini</p>
                  </div>
                </div>
                {showAnalysis ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
              {showAnalysis && (
                <div className="px-5 pb-5">
                  {analyzing ? (
                    <div className="flex items-center gap-3 py-6 text-muted-foreground">
                      <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-sm">The Eye is scanning...</span>
                    </div>
                  ) : analysis ? (
                    <div className="prose prose-invert prose-sm max-w-none [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_ul]:space-y-1 [&_li]:text-sm [&_p]:text-sm [&_p]:text-muted-foreground">
                      <ReactMarkdown>{analysis}</ReactMarkdown>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Watchlist Grid */}
        <section className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
          {loadingList ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4 animate-pulse h-48" />
              ))}
            </div>
          ) : watchlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-secondary border border-border flex items-center justify-center mb-5">
                <Eye className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="font-semibold text-lg mb-2">The Eye sees nothing yet</h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                Add GitHub users to your watchlist above and The Eye will track their activity and compare it to yours.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {watchlist.map(entry => (
                <WatchCard
                  key={entry.id}
                  entry={entry}
                  myWeekly={myWeekly}
                  myStreak={myStreak}
                  onRemove={removeFromWatchlist}
                  onRefresh={refreshStats}
                  loading={refreshing[entry.githubUsername] || false}
                />
              ))}

              {/* My stats reference card */}
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={sessionUser?.image || `https://ui-avatars.com/api/?name=${sessionUser?.name || "You"}&background=random`}
                    alt="You"
                    className="w-10 h-10 rounded-full border border-primary/30"
                  />
                  <div>
                    <p className="font-semibold text-sm text-primary">You</p>
                    <p className="text-xs text-muted-foreground">@{sessionUser?.username || "me"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <span className="text-lg font-bold text-primary">{myWeekly}</span>
                    <p className="text-[10px] text-muted-foreground">wk commits</p>
                  </div>
                  <div className="text-center">
                    <span className="text-lg font-bold text-primary">{myStreak}</span>
                    <p className="text-[10px] text-muted-foreground">day streak</p>
                  </div>
                  <div className="text-center">
                    <span className="text-lg font-bold text-primary">{sessionUser?.todayCommits || 0}</span>
                    <p className="text-[10px] text-muted-foreground">today</p>
                  </div>
                </div>
                <p className="text-[10px] text-primary/60 text-center mt-3">← your baseline</p>
              </div>
            </div>
          )}
        </section>

        {/* Legend */}
        {watchlist.length > 0 && (
          <section className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-red-500/20 border border-red-500/30" />
              <span>Threat — outpacing you by 30%+</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500/30" />
              <span>Leading — you're ahead by 30%+</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>Trending up vs your baseline</span>
            </div>
          </section>
        )}
      </main>
      <FloatingNav />
    </div>
  );
}
