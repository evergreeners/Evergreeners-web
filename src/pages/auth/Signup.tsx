
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Github } from "lucide-react";
import logo from "@/assets/logo.png";
import { useState } from "react";
import { signUp, signIn } from "@/lib/auth-client";
import { Loader } from "@/components/ui/loader";
import { Logo } from "@/components/Logo";
import { Terminal } from "@/components/auth/Terminal";
import "@/pages/auth/auth-animations.css";

export default function Signup() {
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        await signUp.email({
            email,
            password,
            name: `${firstName} ${lastName}`.trim(),
        }, {
            onSuccess: () => {
                // navigate("/dashboard");
                localStorage.setItem("signup_success", "true");
                window.location.href = "/dashboard";
            },
            onError: (ctx) => {
                setError(ctx.error.message);
                setLoading(false);
            }
        });
    };

    const handleGithubLogin = async () => {
        setLoading(true);
        try {
            await signIn.social({
                provider: "github",
                callbackURL: `${window.location.origin}/dashboard`
            });
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
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
            <div className="relative flex flex-col justify-center px-4 sm:px-12 lg:px-20 xl:px-32 bg-background order-1">
                <Link
                    to="/"
                    className="absolute top-8 left-8 lg:left-12 z-50 flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground bg-background/50 hover:bg-secondary/50 hover:text-foreground backdrop-blur-md border border-border/50 rounded-full transition-all duration-300 group"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Back to Home
                </Link>

                <div className="w-full max-w-md mx-auto space-y-8 py-20 lg:py-0">
                    <div className="space-y-2 text-center">
                        <div className="flex justify-center mb-6">
                            <img src={logo} alt="Evergreeners Logo" className="w-16 h-16" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
                        <p className="text-muted-foreground">
                            Start tracking your consistency and build your legacy.
                        </p>
                    </div>

                    <div className="grid gap-6">
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First name</Label>
                                    <Input
                                        id="firstName"
                                        placeholder="Emeka"
                                        className="bg-secondary/30 border-border focus:border-primary/50 h-11"
                                        required
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last name</Label>
                                    <Input
                                        id="lastName"
                                        placeholder="Okonkwo"
                                        className="bg-secondary/30 border-border focus:border-primary/50 h-11"
                                        required
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="emeka@example.com"
                                    className="bg-secondary/30 border-border focus:border-primary/50 h-11"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    className="bg-secondary/30 border-border focus:border-primary/50 h-11"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Check className="w-3 h-3 text-primary" /> Must be at least 8 characters
                                </div>
                            </div>

                            {error && <p className="text-destructive text-sm font-medium">{error}</p>}

                            <Button type="submit" className="w-full h-11 bg-primary text-primary-foreground font-medium hover:bg-primary/90" disabled={loading}>
                                {loading ? "Creating Account..." : "Create Account"}
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
                        Already have an account?{" "}
                        <Link to="/login" className="text-primary font-semibold hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right: Decorative Section */}
            <div
                className="hidden lg:flex flex-col justify-between bg-black border-l border-zinc-900 p-12 text-white relative overflow-hidden order-2"
            >
                {/* Terminal Animation */}
                <div className="absolute inset-0 z-10 flex items-start justify-center p-4 lg:p-12 pt-20 lg:pt-32">
                    <Terminal />
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-0 pointer-events-none" />

                <div className="relative z-20 mt-auto">
                    <div className="w-16 h-16 bg-white/5 backdrop-blur-md rounded-xl flex items-center justify-center mb-6 border border-white/10 shadow-xl overflow-hidden">
                        <img src={logo} alt="Evergreeners" className="w-10 h-10" />
                    </div>
                    <blockquote className="space-y-2">
                        <p className="text-lg font-medium leading-relaxed tracking-wide text-zinc-100">
                            "Success is the sum of small efforts, repeated day in and day out. Start your legacy with a single commit."
                        </p>
                        <footer className="text-sm font-medium text-green-400/80">
                            Ibrahim Isa, Data Scientist
                        </footer>
                    </blockquote>
                </div>
            </div>
        </div>
    );
}
