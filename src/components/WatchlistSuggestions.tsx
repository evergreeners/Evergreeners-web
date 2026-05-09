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

// Mini sparkline bar chart for 30-day activity
function MiniActivity({ days }: { days: number[] }) {
  if (!days || days.length === 0) return null;
  const max = Math.max(...days, 1);
  // Show last 20 days to keep it compact
  const displayDays = days.slice(-20);
  return (
    <div className="flex items-end gap-[2px] h-5 px-1">
      {displayDays.map((d, i) => (
        <div
          key={i}
          className="w-[2px] rounded-full transition-all duration-500"
          style={{
            height: `${Math.max((d / max) * 100, 15)}%`,
            backgroundColor: d === 0
              ? "hsl(0 0% 100% / 0.05)"
              : d >= 5 ? "hsl(142 71% 45%)" : "hsl(142 71% 45% / 0.4)",
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

  const activityLabel = (count: number) => {
    if (count >= 100) return "Beast Mode";
    if (count >= 50) return "High Activity";
    if (count >= 20) return "Active";
    if (count >= 10) return "Regular";
    return "Low Activity";
  };

  const activityColor = (count: number) => {
    if (count >= 100) return "text-orange-400";
    if (count >= 50) return "text-emerald-400";
    if (count >= 20) return "text-primary";
    return "text-muted-foreground";
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-2xl bg-white/[0.03] h-14 animate-pulse border border-white/[0.05]" />
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  // ── Shared Item Component ──
  const renderItem = (user: Suggestion, isCard = false) => (
    <div key={user.login}
      className={`group flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 
        ${isCard 
          ? "bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] hover:bg-white/[0.06] hover:border-primary/30" 
          : "hover:bg-white/[0.04]"}`}
    >
      <div className="relative">
        <img src={user.avatarUrl} alt={user.login}
          className="w-10 h-10 rounded-full border border-white/10 shrink-0 object-cover" />
        {user.recentActivity >= 50 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
            <Zap className="w-2.5 h-2.5 text-white fill-white" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold truncate leading-tight">@{user.login}</p>
          {user.mutual && <UserCheck className="w-3 h-3 text-primary shrink-0" />}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[10px] font-medium uppercase tracking-wider ${activityColor(user.recentActivity)}`}>
            {activityLabel(user.recentActivity)}
          </span>
          <span className="text-[10px] text-muted-foreground/60">•</span>
          <span className="text-[10px] text-muted-foreground">
            {user.recentActivity} in 30d
          </span>
        </div>
      </div>

      <div className="hidden sm:block opacity-40 group-hover:opacity-100 transition-opacity">
        <MiniActivity days={user.activityDays} />
      </div>

      <button onClick={() => setConfirmUser(user)} disabled={adding === user.login}
        className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 hover:border-primary/40 transition-all shrink-0 disabled:opacity-50">
        {adding === user.login ? (
          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
      </button>
    </div>
  );

  if (inline) {
    return <div className="space-y-1.5">{suggestions.slice(0, 10).map(u => renderItem(u))}</div>;
  }

  const preview = suggestions.slice(0, 8);
  const hasMore = suggestions.length > 8;

  return (
    <div className="space-y-2.5">
      {preview.map(u => renderItem(u, true))}

      {hasMore && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <button className="w-full flex items-center justify-center gap-2 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-all rounded-2xl border border-white/5 hover:border-primary/20 hover:bg-primary/5 mt-1">
              <ChevronDown className="w-3.5 h-3.5" />
              View {suggestions.length - 8} more suggestions
            </button>
          </DialogTrigger>
          <DialogContent className="bg-[#050505]/95 backdrop-blur-[40px] border border-white/10 rounded-[2rem] sm:rounded-3xl max-h-[85vh] overflow-hidden p-0 sm:max-w-3xl shadow-2xl">
            <DialogHeader className="px-8 pt-8 pb-6 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold tracking-tight">Suggested to Watch</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Analyzing active coders you follow on GitHub
                  </p>
                </div>
              </div>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[60vh] px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-3 custom-scrollbar">
              {suggestions.map(u => renderItem(u, true))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Dialog — Liquid Glass Redux */}
      <AlertDialog open={!!confirmUser} onOpenChange={o => !o && setConfirmUser(null)}>
        <AlertDialogContent className="bg-[#080808]/90 backdrop-blur-[32px] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden p-0 max-w-sm">
          <div className="relative h-24 bg-gradient-to-br from-primary/20 to-transparent">
            <div className="absolute inset-0 bg-grid-white/[0.02]" />
            <div className="absolute -bottom-8 left-6">
              <img src={confirmUser?.avatarUrl} className="w-16 h-16 rounded-2xl border-4 border-[#080808] shadow-xl object-cover" />
            </div>
          </div>
          
          <div className="px-6 pt-12 pb-8">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold tracking-tight">
                Watch @{confirmUser?.login}?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground leading-relaxed mt-2">
                This user is currently in <span className="text-primary font-bold">{activityLabel(confirmUser?.recentActivity || 0)}</span> with {confirmUser?.recentActivity} contributions in 30 days.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="mt-6 flex flex-col gap-2">
              <AlertDialogAction 
                onClick={() => { if (confirmUser) addUser(confirmUser.login); setConfirmUser(null); }}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-[0_8px_20px_-4px_hsl(142_71%_45%/0.4)] transition-all active:scale-[0.98]"
              >
                Start Watching
              </AlertDialogAction>
              <AlertDialogCancel className="w-full h-12 rounded-xl bg-white/[0.03] border-white/5 hover:bg-white/[0.08] text-muted-foreground transition-all">
                Maybe later
              </AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
