import React, { useEffect, useState } from "react";
import { TreePine, ExternalLink, RefreshCw, X, Globe, Check } from "lucide-react";
import { getApiUrl } from "@/lib/api-config";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

interface OrgInviteBannerProps {
  username?: string | null;
}

export const OrgInviteBanner: React.FC<OrgInviteBannerProps> = ({ username }) => {
  const { data: session } = useSession();
  const [membershipStatus, setMembershipStatus] = useState<"pending" | "active" | "none" | "not_connected" | "not_configured" | "unknown">("unknown");
  const [isPublicMember, setIsPublicMember] = useState(false);
  const [orgName, setOrgName] = useState("evergreeners");
  const [inviteUrl, setInviteUrl] = useState("https://github.com/orgs/evergreeners/invitation");
  const [peopleUrl, setPeopleUrl] = useState("https://github.com/orgs/evergreeners/people");
  const [isResending, setIsResending] = useState(false);
  const [isPublicizing, setIsPublicizing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check persistent storage for previous dismissal or confirmed public status
    if (
      localStorage.getItem("org_banner_dismissed") === "true" ||
      localStorage.getItem("org_public_confirmed") === "true" ||
      sessionStorage.getItem("org_banner_dismissed") === "true"
    ) {
      setIsDismissed(true);
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(getApiUrl("/api/user/org-membership-status"), {
          credentials: "include",
          headers: {
            ...(session?.session?.token ? { Authorization: `Bearer ${session.session.token}` } : {})
          }
        });
        if (!res.ok) {
          setMembershipStatus("unknown");
          return;
        }
        const data = await res.json();
        setMembershipStatus(data.status);
        setIsPublicMember(Boolean(data.isPublicMember));
        if (data.org) setOrgName(data.org);
        if (data.invitationUrl) setInviteUrl(data.invitationUrl);
        if (data.peopleUrl) setPeopleUrl(data.peopleUrl);
      } catch {
        setMembershipStatus("unknown");
      }
    };

    if (session?.user) {
      checkStatus();
    }
  }, [session]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      const res = await fetch(getApiUrl("/api/user/invite-org"), {
        method: "POST",
        credentials: "include",
        headers: {
          ...(session?.session?.token ? { Authorization: `Bearer ${session.session.token}` } : {})
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Invitation dispatched!", {
          description: `Check your notifications at github.com/orgs/${orgName}/invitation`
        });
        setMembershipStatus("pending");
      } else {
        toast.error("Failed to resend invitation", {
          description: data.message || "Please try again later."
        });
      }
    } catch {
      toast.error("Network error while requesting invitation");
    } finally {
      setIsResending(false);
    }
  };

  const handleMakePublic = async () => {
    setIsPublicizing(true);
    try {
      const res = await fetch(getApiUrl("/api/user/org-publicize"), {
        method: "POST",
        credentials: "include",
        headers: {
          ...(session?.session?.token ? { Authorization: `Bearer ${session.session.token}` } : {})
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsPublicMember(true);
        toast.success("Membership is now public! 🎉", {
          description: `Your profile now displays the @${orgName} organization badge.`
        });
      } else {
        // If automatic publicize requires manual user action on GitHub
        window.open(peopleUrl, "_blank", "noopener,noreferrer");
        toast.info("Opened GitHub Members Directory", {
          description: "Click your username in the list and change visibility from 'Private' to 'Public'."
        });
      }
    } catch {
      window.open(peopleUrl, "_blank", "noopener,noreferrer");
      toast.info("Please set visibility on GitHub", {
        description: "Change visibility from 'Private' to 'Public' on the GitHub page."
      });
    } finally {
      setIsPublicizing(false);
    }
  };

  const handleConfirmPublic = async () => {
    setIsConfirming(true);
    try {
      localStorage.setItem("org_public_confirmed", "true");
      localStorage.setItem("org_banner_dismissed", "true");
      sessionStorage.setItem("org_banner_dismissed", "true");
      setIsPublicMember(true);
      setIsDismissed(true);

      // Best effort backend sync with force cache-bust
      fetch(getApiUrl("/api/user/org-confirm-public"), {
        method: "POST",
        credentials: "include",
        headers: {
          ...(session?.session?.token ? { Authorization: `Bearer ${session.session.token}` } : {})
        }
      }).catch(() => {});

      toast.success("Membership confirmed as Public! 🎉", {
        description: `Your Evergreeners community badge is now recognized on @${orgName}.`
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("org_banner_dismissed", "true");
    sessionStorage.setItem("org_banner_dismissed", "true");
  };

  // If dismissed or membership is active AND public, hide banner
  if (isDismissed) {
    return null;
  }

  const userWithHandle = session?.user as { username?: string } | undefined;
  const displayHandle = username || userWithHandle?.username || "you";

  // CASE 1: Pending invitation (needs acceptance)
  if (membershipStatus === "pending") {
    return (
      <div className="relative overflow-hidden glass-nav rounded-2xl border border-primary/20 bg-primary/10 p-4 sm:p-5 mb-6 shadow-xl shadow-black/40 backdrop-blur-2xl animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 pr-8 sm:pr-0">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0">
              <TreePine className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground tracking-tight">
                  Join the Evergreeners GitHub Organization
                </h4>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary border border-primary/30 tracking-wide uppercase">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                An invitation to join <strong className="text-foreground">@{orgName}</strong> was dispatched to your GitHub account (<strong className="text-foreground">@{displayHandle}</strong>). Accept it to complete your onboarding quest, plant your seedling, and earn the First Seedling badge!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
            <button
              onClick={handleResend}
              disabled={isResending}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-primary/20 bg-secondary/80 hover:bg-secondary text-foreground hover:text-primary transition-all duration-300 disabled:opacity-50"
              title="Resend invitation"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
              <span>Resend</span>
            </button>

            <a
              href={inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Accept Invitation</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-lg transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // CASE 2: Active member, but visibility is still Private on GitHub
  if (membershipStatus === "active" && !isPublicMember) {
    return (
      <div className="relative overflow-hidden glass-nav rounded-2xl border border-primary/20 bg-primary/10 p-4 sm:p-5 mb-6 shadow-xl shadow-black/40 backdrop-blur-2xl animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 pr-8 sm:pr-0">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground tracking-tight">
                  Make Your Organization Membership Public
                </h4>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary border border-primary/30 tracking-wide uppercase">
                  Community Badge
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                You're in <strong className="text-foreground">@{orgName}</strong>! GitHub marks new memberships Private by default. Set it to <strong className="text-primary font-medium">Public</strong> so your Evergreeners badge displays on your GitHub profile and you appear on the community directory.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
            <button
              onClick={handleConfirmPublic}
              disabled={isConfirming}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all duration-300 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              title="Confirm that your membership is now public on GitHub"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isConfirming ? "Confirming..." : "I've Made it Public"}</span>
            </button>

            <a
              href={peopleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Set on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-lg transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return null;
};

export default OrgInviteBanner;
