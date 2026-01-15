import { Home, BarChart3, Flame, Target, User, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, Link } from "react-router-dom";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Home", href: "/" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Flame, label: "Streaks", href: "/streaks" },
  { icon: Target, label: "Goals", href: "/goals" },
  { icon: Trophy, label: "Ranks", href: "/leaderboard" },
];

export function FloatingNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="glass-nav rounded-2xl px-2 py-2">
        <ul className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <li key={item.label}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300",
                    isActive
                      ? "bg-primary text-primary-foreground scale-105"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
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
