import { Home, BarChart3, Flame, Target, User, Trophy } from "lucide-react";
import { cn, triggerHaptic } from "@/lib/utils";
import { useLocation, Link } from "react-router-dom";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Home", href: "/dashboard" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Flame, label: "Streaks", href: "/streaks" },
  { icon: Target, label: "Goals", href: "/goals" },
  { icon: Trophy, label: "Ranks", href: "/leaderboard" },
];

import { useState, useEffect } from "react";

export function FloatingNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Hide when scrolling down, show when scrolling up
      // Add a small threshold to avoid jitter at the very top or small movements
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
              <li key={item.label}>
                <Link
                  to={item.href}
                  onClick={() => triggerHaptic()}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300",
                    isActive
                      ? "border border-primary text-primary bg-transparent scale-105"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive && "animate-scale-in")} />
                  <span className={cn(
                    "text-sm font-medium transition-all duration-200",
                    isActive ? "block" : "hidden md:block"
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
