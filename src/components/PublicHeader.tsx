import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Users, GitMerge, LogIn, ArrowRight, BookOpen, GraduationCap } from "lucide-react";
import { Logo } from "./Logo";

export function PublicHeader() {
    const { pathname } = useLocation();

    return (
        <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
            <div className="w-full max-w-5xl bg-black/60 backdrop-blur-xl border border-white/10 rounded-full pl-6 pr-2 py-2 flex items-center justify-between shadow-2xl shadow-black/50 transition-all duration-300 hover:border-white/20 hover:bg-black/70">

                {/* Logo Section */}
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="relative flex items-center justify-center w-10 h-10">
                        <Logo className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-foreground tracking-tight text-lg group-hover:text-green-400 transition-colors">Evergreeners</span>
                </Link>

                {/* Navigation - Centered (Hidden on mobile) */}
                <nav className="hidden md:flex items-center gap-1 bg-white/5 rounded-full px-2 py-1 border border-white/5">
                    <Link
                        to="/academy"
                        className={cn(
                            "flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-full transition-all",
                            pathname === "/academy"
                                ? "text-primary bg-primary/10 border border-primary/20"
                                : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                    >
                        <GraduationCap className="w-4 h-4" />
                        <span>Academy</span>
                    </Link>
                    <div className="w-px h-4 bg-white/10" />
                    <Link
                        to="/community"
                        className={cn(
                            "flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-full transition-all",
                            pathname === "/community"
                                ? "text-primary bg-primary/10 border border-primary/20"
                                : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Users className="w-4 h-4" />
                        <span>Community</span>
                    </Link>
                    <div className="w-px h-4 bg-white/10" />
                    <a
                        href="https://docs.evergreeners.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 rounded-full transition-all"
                    >
                        <BookOpen className="w-4 h-4" />
                        <span>Docs</span>
                    </a>
                    <div className="w-px h-4 bg-white/10" />
                    <a
                        href="https://github.com/evergreeners"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 rounded-full transition-all"
                    >
                        <GitMerge className="w-4 h-4" />
                        <span>Contribute</span>
                    </a>
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-2 pl-4">
                    <Link
                        to="/login"
                        className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-white px-3 py-2 transition-colors"
                    >
                        <LogIn className="w-4 h-4" />
                        <span>Sign In</span>
                    </Link>
                    <Link
                        to="/signup"
                        className={cn(
                            "group flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300",
                            "bg-primary text-black hover:bg-[#5aff94] hover:scale-105 active:scale-95 active:rotate-1"
                        )}
                    >
                        <span>Start</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </header>
    );
}
