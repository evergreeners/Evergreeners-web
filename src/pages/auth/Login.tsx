
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Github, Command } from "lucide-react";
import logo from "@/assets/logo.png";
import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { Loader } from "@/components/ui/loader";
import { Logo } from "@/components/Logo";
import "@/pages/auth/auth-animations.css";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        await signIn.email({
            email,
            password
        }, {
            onSuccess: () => {
                console.log("Login success");
                // Force full reload to ensure session cookie is recognized by ProtectedRoute immediately.
                localStorage.setItem("login_success", "true");
                window.location.href = "/dashboard";
            },
            onError: (ctx) => {
                console.error("Login error object:", ctx);
                setError(ctx.error.message);
                setLoading(false);
            }
        });
    };

    const handleGithubLogin = async () => {
        await signIn.social({
            provider: "github",
            callbackURL: `${window.location.origin}/dashboard`
        });
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <Loader />
                </div>
            )}

            {/* Left: Form Section */}
            <div className="relative flex flex-col justify-center px-4 sm:px-12 lg:px-20 xl:px-32 bg-background">
                <Link
                    to="/"
                    className="absolute top-8 left-8 lg:left-12 z-50 flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground bg-background/50 hover:bg-secondary/50 hover:text-foreground backdrop-blur-md border border-border/50 rounded-full transition-all duration-300 group"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Back to Home
                </Link>

                <div className="w-full max-w-md mx-auto space-y-8">
                    <div className="space-y-2 text-center">
                        <div className="flex justify-center mb-6">
                            <Logo className="w-12 h-12" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
                        <p className="text-muted-foreground">
                            Enter your credentials to access your garden
                        </p>
                    </div>

                    <div className="grid gap-6">
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="hello@example.com"
                                    className="bg-secondary/30 border-border focus:border-primary/50 h-11"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                                        Forgot password?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    className="bg-secondary/30 border-border focus:border-primary/50 h-11"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            {error && <p className="text-destructive text-sm font-medium">{error}</p>}

                            <Button type="submit" className="w-full h-11 bg-primary text-primary-foreground font-medium hover:bg-primary/90" disabled={loading}>
                                {loading ? "Signing in..." : "Sign In"}
                            </Button>
                        </form>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full h-11 border-border hover:bg-secondary/50 flex items-center gap-2"
                            onClick={handleGithubLogin}
                            type="button"
                        >
                            <Github className="w-4 h-4" />
                            GitHub
                        </Button>
                    </div>

                    <p className="px-8 text-center text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Link to="/signup" className="text-primary font-semibold hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right: Decorative Section */}
            <div className="hidden lg:flex flex-col justify-between bg-black border-l border-zinc-900 p-12 text-white relative overflow-hidden">
                {/* Speeder Animation */}
                <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
                    <div className="scale-100 relative w-full h-full">
                        <div className="loader">
                            <span><span></span><span></span><span></span><span></span></span>
                            <div className="base">
                                <span></span>
                                <div className="face"></div>
                            </div>
                        </div>
                        <div className="longfazers">
                            <span></span><span></span><span></span><span></span>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 mt-auto">
                    <div className="w-12 h-12 bg-white/5 backdrop-blur-md rounded-xl flex items-center justify-center mb-6 border border-white/10 shadow-xl">
                        <Command className="w-6 h-6 text-emerald-400" />
                    </div>
                    <blockquote className="space-y-2">
                        <p className="text-lg font-medium leading-relaxed tracking-wide text-zinc-100">
                            "Consistency isn't just about code; it's about showing up for yourself every single day. Evergreeners is your garden of growth."
                        </p>
                        <footer className="text-sm font-medium text-emerald-400/80">
                            Muhammad Adamu Aliyu, Founder of Evergreeners
                        </footer>
                    </blockquote>
                </div>
            </div>
        </div>
    );
}
