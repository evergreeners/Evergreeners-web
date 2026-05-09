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

// SVG sparkline — same proven approach as the watch card Sparkline in EyeSection
function MiniActivity({ days, compact = false }: { days: number[]; compact?: boolean }) {
  if (!days || days.length === 0) return null;
  const filtered = compact ? days.slice(-12) : days.slice(-20);
  if (filtered.every(d => d === 0)) return null;
  const max = Math.max(...filtered, 1);
  const w = compact ? 48 : 72;
  const h = 22;
  const pts = filtered.map((d, i) => `${(i / (filtered.length - 1)) * w},${h - (d / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} style={{ flexShrink: 0, opacity: 0.8 }}>
      <polyline fill="none" stroke="hsl(142 71% 45%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
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
      <div className="relative shrink-0">
        <img src={user.avatarUrl} alt={user.login}
          className="w-10 h-10 rounded-full border border-white/10 shrink-0 object-cover" />
        {user.recentActivity >= 50 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.5)]">
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
          <span className={`text-[10px] font-bold uppercase tracking-wider ${activityColor(user.recentActivity)}`}>
            {activityLabel(user.recentActivity)}
          </span>
          <span className="text-[10px] text-muted-foreground/60">•</span>
          <span className="text-[10px] text-muted-foreground font-medium">
            {user.recentActivity} in 30d
          </span>
        </div>
      </div>

      {/* Sparkline — Bold and Vibrant */}
      <div className="shrink-0">
        <MiniActivity days={user.activityDays} compact={inline} />
      </div>

      <button onClick={(e) => { e.stopPropagation(); setConfirmUser(user); }} disabled={adding === user.login}
        className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 hover:border-primary/40 transition-all shrink-0 disabled:opacity-50">
        {adding === user.login ? (
          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
      </button>
    </div>
  );

  return (
    <div className="space-y-2.5 relative">
      {inline ? (
        <div className="space-y-1.5">
          {suggestions.slice(0, 10).map(u => renderItem(u))}
        </div>
      ) : (
        <>
          {suggestions.slice(0, 8).map(u => renderItem(u, true))}
          {suggestions.length > 8 && (
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
        </>
      )}

      {/* Confirmation Dialog — Unified Liquid Glass */}
      <AlertDialog open={!!confirmUser} onOpenChange={o => !o && setConfirmUser(null)}>
        <AlertDialogContent className="bg-[#080808]/95 backdrop-blur-[40px] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden p-0 max-w-sm z-[150] animate-in fade-in zoom-in-95 duration-200">
          <div className="relative h-28 bg-gradient-to-br from-primary/30 to-transparent">
            <div className="absolute inset-0 bg-grid-white/[0.03]" />
            <div className="absolute -bottom-10 left-8">
              <div className="relative">
                <img src={confirmUser?.avatarUrl} className="w-20 h-20 rounded-2xl border-4 border-[#080808] shadow-2xl object-cover" />
                {confirmUser?.recentActivity && confirmUser.recentActivity >= 50 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 border-4 border-[#080808] flex items-center justify-center shadow-lg">
                    <Zap className="w-3 h-3 text-white fill-white" />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="px-8 pt-14 pb-10">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-bold tracking-tight">
                Watch @{confirmUser?.login}?
              </AlertDialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 ${activityColor(confirmUser?.recentActivity || 0)}`}>
                  {activityLabel(confirmUser?.recentActivity || 0)}
                </span>
                <span className="text-[10px] text-muted-foreground font-bold">
                  {confirmUser?.recentActivity} CONTRIBUTIONS
                </span>
              </div>
              <AlertDialogDescription className="text-muted-foreground leading-relaxed mt-4 text-sm">
                Add this high-performing dev to your competitive watchlist to track their daily momentum.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="mt-8 flex flex-col gap-3">
              <AlertDialogAction 
                onClick={() => { if (confirmUser) addUser(confirmUser.login); setConfirmUser(null); }}
                className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest hover:bg-primary/90 shadow-[0_10px_25px_-5px_rgba(34,197,94,0.4)] transition-all active:scale-[0.97]"
              >
                Confirm Watch
              </AlertDialogAction>
              <AlertDialogCancel className="w-full h-14 rounded-2xl bg-white/[0.04] border-white/5 hover:bg-white/[0.08] text-muted-foreground font-bold transition-all text-sm">
                Cancel
              </AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
