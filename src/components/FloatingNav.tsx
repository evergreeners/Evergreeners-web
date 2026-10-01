import { BarChart3, Compass, Target, Trophy, Wand2 } from "lucide-react";
import { cn, triggerHaptic } from "@/lib/utils";
import { useLocation, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { getApiUrl } from "@/lib/api-config";
import { githubService } from "@/lib/githubService";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Compass, label: "Quests", href: "/quests" },
  { icon: Target, label: "Goals", href: "/goals" },
  { icon: Trophy, label: "Ranks", href: "/leaderboard" },
  { icon: Wand2, label: "Generator", href: "/generator" },
];

export function FloatingNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const prefetchAnalytics = () => {
    const token = session?.session?.token;
    if (!token) return;
    queryClient.prefetchQuery({
      queryKey: ['userProfile', 'me'],
      queryFn: async () => {
        const res = await fetch(getApiUrl('/api/user/profile'), {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        return data.user;
      },
      staleTime: 5 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: ['userRepos', token],
      queryFn: async () => {
        const repos = await githubService.getUserRepos(token);
        return Array.isArray(repos) ? repos : [];
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 20) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <nav className={cn(
      "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden transition-transform duration-300",
      !isVisible && "translate-y-[200%]"
    )}>
      <div className="glass-nav rounded-2xl px-2 py-2 border border-primary/20 bg-primary/10 w-[90vw] max-w-md">
        <ul className="flex items-center justify-between gap-1 w-full">
          {navItems.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <li key={item.label} className="flex min-w-0">
                <Link
                  to={item.href}
                  onClick={() => triggerHaptic()}
                  onMouseEnter={() => {
                    if (item.href === "/analytics") prefetchAnalytics();
                  }}
                  onTouchStart={() => {
                    if (item.href === "/analytics") prefetchAnalytics();
                  }}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl transition-all duration-300",
                    isActive
                      ? "border border-primary text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
                  )}
                >
                  <item.icon className={cn("w-4 h-4 shrink-0", isActive && "animate-scale-in")} />
                  <span className={cn(
                    "text-sm font-medium whitespace-nowrap transition-all duration-200 overflow-hidden text-ellipsis",
                    isActive ? "block" : "hidden"
                  )}>
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
