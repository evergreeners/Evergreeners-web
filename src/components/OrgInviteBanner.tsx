import React, { useEffect, useState } from "react";
import { TreePine, ExternalLink, RefreshCw, X, CheckCircle2 } from "lucide-react";
import { getApiUrl } from "@/lib/api-config";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

interface OrgInviteBannerProps {
  username?: string | null;
}

export const OrgInviteBanner: React.FC<OrgInviteBannerProps> = ({ username }) => {
  const { data: session } = useSession();
  const [membershipStatus, setMembershipStatus] = useState<"pending" | "active" | "none" | "not_connected" | "not_configured" | "unknown">("unknown");
  const [orgName, setOrgName] = useState("evergreeners");
  const [inviteUrl, setInviteUrl] = useState("https://github.com/orgs/evergreeners/invitation");
  const [isResending, setIsResending] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check session storage for temporary dismissal in current browser session
    if (sessionStorage.getItem("org_invite_banner_dismissed") === "true") {
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
        if (data.org) setOrgName(data.org);
        if (data.invitationUrl) setInviteUrl(data.invitationUrl);
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

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("org_invite_banner_dismissed", "true");
  };

  // Only render when status is pending (invitation sent, waiting acceptance)
  if (isDismissed || membershipStatus !== "pending") {
    return null;
  }

  const userWithHandle = session?.user as { username?: string } | undefined;
  const displayHandle = username || userWithHandle?.username || "you";

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950/60 via-emerald-900/30 to-background border border-emerald-500/30 rounded-2xl p-4 sm:p-5 mb-6 shadow-lg shadow-emerald-950/20 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5 pr-8 sm:pr-0">
          <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
            <TreePine className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-emerald-100 tracking-tight">
                Join the Evergreeners GitHub Organization
              </h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Action Required
              </span>
            </div>
            <p className="text-xs text-emerald-300/80 mt-1 max-w-2xl leading-relaxed">
              An invitation to join <strong>@{orgName}</strong> was dispatched to your GitHub account (<strong>@{displayHandle}</strong>). Accept it to complete your onboarding quest, plant your seedling, and earn the First Seedling badge!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
          <button
            onClick={handleResend}
            disabled={isResending}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 hover:text-emerald-100 text-xs font-medium rounded-lg border border-emerald-500/20 transition-all disabled:opacity-50"
            title="Resend invitation email"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
            <span>Resend</span>
          </button>

          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Accept Invitation</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 text-emerald-400/60 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default OrgInviteBanner;
