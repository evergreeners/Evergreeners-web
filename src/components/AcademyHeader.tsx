import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn, triggerHaptic } from "@/lib/utils";
import { 
  GraduationCap, 
  Terminal, 
  Zap, 
  LogIn, 
  ArrowRight, 
  Menu, 
  LogOut, 
  Settings, 
  ShieldCheck, 
  BookOpen, 
  UserRound 
} from "lucide-react";
import { Logo } from "./Logo";
import { useState } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useBadges } from "@/hooks/useBadges";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function AcademyHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const loggedInUsername = (session?.user as any)?.username;
  const { badges } = useBadges(loggedInUsername ?? null);
  const isGoat = badges?.some((b) => b.id === 'the_goat' && b.earned);

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check enrollment status if logged in
  const { data: statusData } = useQuery({
    queryKey: ['academyStatus'],
    queryFn: async () => {
      const res = await fetch(getApiUrl('/api/academy/status'), {
        credentials: "include",
        headers: {
          ...(session?.session?.token ? { Authorization: `Bearer ${session.session.token}` } : {})
        }
      });
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
    enabled: !!session,
  });

  const enrolled = statusData?.status && statusData.status !== 'none';

  // Navigation Links
  const isMarketingPage = pathname === "/academy";
  const syllabusHref = isMarketingPage ? "#curriculum" : "/academy#curriculum";
  const auditHref = isMarketingPage ? "#audit" : "/academy#audit";
  const enrollHref = isMarketingPage ? "#enrollment" : "/academy#enrollment";

  const navLinks = [
    { label: "Syllabus", href: syllabusHref, isAnchor: isMarketingPage },
    { label: "Profile Audit", href: auditHref, isAnchor: isMarketingPage },
    { label: "Join Academy", href: enrollHref, isAnchor: isMarketingPage },
  ];

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isMarketingPage && href.startsWith("#")) {
      e.preventDefault();
      const targetId = href.substring(1);
      const elem = document.getElementById(targetId);
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth" });
        setMobileMenuOpen(false);
      }
    }
  };

  return (
    <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <div className="w-full max-w-5xl bg-black/60 backdrop-blur-xl border border-white/10 rounded-full pl-6 pr-2 py-2 flex items-center justify-between shadow-2xl shadow-black/50 transition-all duration-300 hover:border-white/20 hover:bg-black/70">
        
        {/* Logo Branding */}
        <Link to="/academy" onClick={() => triggerHaptic()} className="flex items-center gap-3 group shrink-0">
          <Logo className="w-6 h-6" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground tracking-tight text-lg group-hover:text-green-400 transition-colors">Evergreen</span>
            <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 rounded-full px-2.5 py-0.5 font-extrabold uppercase tracking-widest hidden sm:inline-block">Academy</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-white/5 rounded-full px-2 py-1 border border-white/5">
          {navLinks.map((link) => (
            <span key={link.label} className="flex items-center">
              <a
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className="px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-white rounded-full transition-all"
              >
                {link.label}
              </a>
              <div className="w-px h-3.5 bg-white/10 last:hidden" />
            </span>
          ))}
          {enrolled && (
            <>
              <div className="w-px h-3.5 bg-white/10" />
              <Link
                to="/academy/dashboard"
                className={cn(
                  "flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-full transition-all",
                  pathname === "/academy/dashboard"
                    ? "text-primary bg-primary/10 border border-primary/20"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Portal</span>
              </Link>
            </>
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="flex items-center gap-2">
          {session ? (
            <div className="flex items-center gap-2">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white hover:bg-white/5 rounded-full px-4 py-1.5">
                  <span>Back to App</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="relative cursor-pointer">
                    <button
                      onClick={() => triggerHaptic()}
                      className={cn(
                        "w-8 h-8 rounded-full bg-secondary border overflow-hidden transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 block hover:scale-105",
                        isGoat ? "border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.4)]" : "border-primary/40 hover:border-primary"
                      )}
                    >
                      <img
                        src={session?.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session?.user?.name || "User")}&background=random`}
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    </button>
                    {isGoat && (
                      <div className="absolute -top-1 -right-1 w-[14px] h-[14px] bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg border border-background z-10 pointer-events-none animate-pulse-slow">
                        <span className="text-[7px]">🐐</span>
                      </div>
                    )}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={12}
                  className="w-48 p-1.5 bg-zinc-950/95 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl space-y-0.5"
                >
                  <DropdownMenuItem
                    onClick={() => navigate('/profile')}
                    className="w-full px-3 py-2 cursor-pointer rounded-xl transition-all duration-200 hover:bg-white/5 text-sm font-medium flex items-center gap-2.5 text-zinc-300 hover:text-white"
                  >
                    <UserRound className="w-4 h-4 text-muted-foreground" />
                    <span>Profile</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => navigate('/settings')}
                    className="w-full px-3 py-2 cursor-pointer rounded-xl transition-all duration-200 hover:bg-white/5 text-sm font-medium flex items-center gap-2.5 text-zinc-300 hover:text-white"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <span>Settings</span>
                  </DropdownMenuItem>

                  {(session?.user as any)?.role === 'admin' && (
                    <DropdownMenuItem
                      onClick={() => navigate('/admin')}
                      className="w-full px-3 py-2 cursor-pointer rounded-xl transition-all duration-200 hover:bg-white/5 text-sm font-medium flex items-center gap-2.5 text-primary hover:text-primary"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Admin Panel</span>
                    </DropdownMenuItem>
                  )}

                  <div className="h-px bg-white/10 my-1" />

                  <DropdownMenuItem
                    className="w-full px-3 py-2 cursor-pointer rounded-xl transition-all duration-200 hover:bg-destructive/10 text-destructive focus:bg-destructive/10 text-sm font-medium flex items-center gap-2.5"
                    onSelect={(e) => {
                      e.preventDefault();
                      setLogoutDialogOpen(true);
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-4">
              <Link
                to="/login"
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-white px-3 py-2 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
              <a
                href={enrollHref}
                onClick={(e) => handleAnchorClick(e, enrollHref)}
                className="group flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 bg-primary text-black hover:bg-[#5aff94] hover:scale-105 active:scale-95 active:rotate-1"
              >
                <span>Join Academy</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-muted-foreground hover:text-white shrink-0"
              >
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-black/95 border-l border-white/10 p-6 flex flex-col justify-between">
              <div className="space-y-6 pt-8">
                <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
                  <Logo className="w-5 h-5" />
                  <span className="font-bold text-foreground tracking-tight text-md">Evergreen Academy</span>
                </div>

                <div className="flex flex-col gap-3">
                  {navLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={(e) => handleAnchorClick(e, link.href)}
                      className="px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-white rounded-xl hover:bg-white/5 transition-all block"
                    >
                      {link.label}
                    </a>
                  ))}
                  {enrolled && (
                    <Link
                      to="/academy/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary rounded-xl bg-primary/10 border border-primary/20 transition-all block"
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>Student Portal</span>
                    </Link>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-white/10">
                {session ? (
                  <>
                    <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                      <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 text-sm rounded-xl py-5">
                        Back to App
                      </Button>
                    </Link>
                    <Button 
                      variant="destructive" 
                      className="w-full text-sm rounded-xl py-5"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setLogoutDialogOpen(true);
                      }}
                    >
                      Log Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                      <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 text-sm rounded-xl py-5">
                        Sign In
                      </Button>
                    </Link>
                    <a href={enrollHref} onClick={(e) => handleAnchorClick(e, enrollHref)} className="block w-full">
                      <Button className="w-full text-sm rounded-xl py-5 font-bold">
                        Join Academy
                      </Button>
                    </a>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>

      {/* Controlled Logout Confirmation Dialog */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent className="bg-zinc-950 border border-white/10 max-w-md rounded-2xl p-6">
          <h3 className="font-bold text-lg text-foreground mb-2">Are you sure?</h3>
          <p className="text-sm text-muted-foreground mb-6">
            You will be signed out and redirected back to the academy landing page.
          </p>
          <div className="flex items-center justify-end gap-3">
            <AlertDialogCancel asChild>
              <Button variant="ghost" className="rounded-xl border border-white/10 hover:bg-white/5">
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  await signOut();
                  localStorage.setItem("logout_success", "true");
                  window.location.href = "/academy";
                }}
              >
                Log Out
              </Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
