import { Settings, Menu, Home, BarChart3, Compass, Target, Trophy, LogOut } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn, triggerHaptic } from "@/lib/utils";
import { signOut, useSession } from "@/lib/auth-client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { icon: Home, label: "Home", href: "/dashboard" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Compass, label: "Quests", href: "/quests" },
  { icon: Target, label: "Goals", href: "/goals" },
  { icon: Trophy, label: "Ranks", href: "/leaderboard" },
];

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { data: session } = useSession();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-0">
      <div className="glass-nav mt-4 rounded-2xl mx-auto max-w-5xl border border-primary/20 bg-primary/10">
        <div className="flex items-center justify-between py-3 px-4">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="relative flex items-center justify-center w-10 h-10 -ml-1">
              <Logo className="w-6 h-6" />
            </div>
            <span className="font-semibold text-foreground hidden sm:block">Forever Green</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = currentPath === item.href;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => triggerHaptic()}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 text-sm font-medium",
                    isActive
                      ? "border border-primary text-primary bg-transparent"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive && "text-primary")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <NotificationCenter />

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={() => triggerHaptic()}
                  className="ml-2 w-8 h-8 rounded-full bg-secondary border border-primary overflow-hidden hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <img
                    src={session?.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session?.user?.name || "User")}&background=random`}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background border-border">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <span className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden">
                      <img
                        src={session?.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session?.user?.name || "User")}&background=random`}
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span>Profile</span>
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                {/* Logout with Alert Dialog Trigger logic needs to be handled carefully inside Dropdown */}
                {/* Since nesting Dialog trigger inside MenuItem can be tricky, we can use a state or handle it via a separate hidden trigger or just simpler confirm */}
                {/* For better UX inside dropdown, standard logout is often direct or uses a state-driven dialog. 
                    Let's use the AlertDialog separately controlled by state? 
                    Actually, we can put the Trigger inside the Item with `asChild` but styling can be odd.
                    Let's just toggle a state or use the existing AlertDialog but separate from the dropdown trigger.
                */}
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  onSelect={(e) => {
                    e.preventDefault(); // Prevent dropdown from closing immediately if we were triggering a dialog, 
                    // but here we want to trigger the alert dialog.
                    // Simplest way: set open state for alert dialog.
                    setLogoutDialogOpen(true);
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Hidden Logout Alert Dialog (Controlled) */}
            <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
              <AlertDialogContent className="bg-background border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will be redirected to the landing page.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await signOut();
                      localStorage.setItem("logout_success", "true");
                      window.location.href = "/";
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Log Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

          </div>
        </div>
      </div>
    </header>
  );
}
