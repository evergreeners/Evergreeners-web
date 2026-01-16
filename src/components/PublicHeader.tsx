
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

export function PublicHeader() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl supports-[backdrop-filter]:bg-black/20">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-2 group">
                        <img
                            src={logo}
                            alt="Evergreeners"
                            className="w-8 h-8 object-contain"
                        />
                        <span className="font-bold text-foreground tracking-tight text-lg">Forever Green</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                        <a href="#" className="hover:text-foreground transition-colors">Documentation</a>

                        <a href="#" className="hover:text-foreground transition-colors">Blog</a>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <Link
                        to="/login"
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Sign In
                    </Link>
                    <Link
                        to="/signup"
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                            "bg-primary text-black hover:bg-primary/90 hover:scale-105 active:scale-95",
                            "shadow-[0_0_20px_-5px_hsl(var(--primary))]"
                        )}
                    >
                        Get Started
                    </Link>
                </div>
            </div>
        </header>
    );
}
