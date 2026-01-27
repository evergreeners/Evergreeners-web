
import { PublicHeader } from "@/components/PublicHeader";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowRight,
    Github,
    CheckCircle2,
    Flame,
    Trophy,
    Target,
    BarChart3,
    Terminal,
    Code2,
    ShieldCheck,
    Zap,
    GitBranch,
    Quote,
    Check,
    MoveRight,
    Focus,
    Fingerprint,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import dashboardMockup from "@/assets/dashboard-mockup.png";
import zenModeGraphic from "@/assets/zen-mode-graphic.png";
import { ScrewToggle } from "@/components/ui/screw-toggle";
import { CosmicButton } from "@/components/ui/cosmic-button";
import { TerminalSection } from "@/components/TerminalSection";
import { CommunityStories } from "@/components/CommunityStories";

export default function Landing() {
    const [text, setText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(150);
    const navigate = useNavigate();
    const { data: session, isPending } = useSession();

    // Prevent flash of landing page if already logged in:
    // Move logic to final return to respect Rule of Hooks

    useEffect(() => {
        if (session) {
            navigate("/dashboard");
        }

        if (localStorage.getItem("logout_success") === "true") {
            toast.success("Logged out successfully", {
                description: "See you next time!",
            });
            localStorage.removeItem("logout_success");
        }
    }, [session, navigate]);

    const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            // Wait for the animation (Time to Shine reveals) then navigate
            setTimeout(() => {
                navigate("/signup");
            }, 1000);
        }
    };

    const words = ["Consistency.", "Growth.", "Focus.", "Legacy."];

    useEffect(() => {
        const handleType = () => {
            const i = loopNum % words.length;
            const fullText = words[i];

            setText(isDeleting
                ? fullText.substring(0, text.length - 1)
                : fullText.substring(0, text.length + 1)
            );

            setTypingSpeed(isDeleting ? 50 : 150);

            if (!isDeleting && text === fullText) {
                // Pause at end of word
                setTimeout(() => setIsDeleting(true), 2000);
            } else if (isDeleting && text === "") {
                setIsDeleting(false);
                setLoopNum(loopNum + 1);
            }
        };

        const timer = setTimeout(handleType, typingSpeed);
        return () => clearTimeout(timer);
    }, [text, isDeleting, loopNum]);

    // Early return AFTER all hooks call
    // Return null to keep the initial HTML loader visible until session resolves
    if (isPending) {
        return null;
    }

    return (
        <div className="min-h-screen bg-black text-foreground font-sans selection:bg-primary/30 overflow-x-hidden">
            <PublicHeader />

            {/* Background Noise & Grid */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-noise opacity-[0.15] mix-blend-overlay" />
                <div className="absolute inset-0 bg-grid-small opacity-[0.1]" />
                <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-10" />
            </div>

            <main className="relative z-10 pt-32 pb-20">

                {/* --- Hero Section (Restored & Refined) --- */}
                <section className="container mx-auto px-4 max-w-7xl mb-32 lg:mb-48 relative">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">

                        {/* Left Column: Text */}
                        <div className="space-y-8 relative z-20">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground text-xs font-mono tracking-wider animate-in fade-in slide-in-from-left-4 duration-700">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                SYSTEM ONLINE v1.0
                            </div>

                            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.1] min-h-[3.3em] lg:min-h-[2.2em]">
                                Own Your <br />
                                <span className="text-primary block">
                                    {text}<span className="inline-block w-[0.1em] h-[0.8em] bg-primary ml-2 align-middle animate-cursor-blink" />
                                </span>
                            </h1>

                            <p className="text-xl text-muted-foreground/80 leading-relaxed max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                                The developer-first platform for building unbreakable habits.
                                Turn your daily workflow into a visual legacy with automated tracking and GitHub-style heatmaps.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                                <div className="scale-75 sm:scale-100 origin-left">
                                    <ScrewToggle onChange={handleToggle} />
                                </div>
                                <Link to="/login" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors group">
                                    View Demo <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>

                        {/* Right Column: Visual Mockup (Smaller & Stylized) */}
                        <div className="relative z-10 perspective-1000 group">
                            {/* Ambient Glows */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/20 blur-[80px] rounded-full opacity-40 animate-pulse-slow" />

                            {/* Main Card Container with 3D transform trend */}
                            <div className="relative w-full max-w-md mx-auto transform transition-all duration-700 hover:scale-[1.02] hover:-translate-y-2">

                                {/* Glass Border wrapper */}
                                <div className="relative p-2 rounded-xl bg-gradient-to-b from-white/10 to-transparent border border-white/5 backdrop-blur-sm shadow-2xl">
                                    <div className="rounded-lg overflow-hidden border border-white/5 relative aspect-video bg-black/50">
                                        <img
                                            src={dashboardMockup}
                                            alt="Dashboard Interface"
                                            className="w-full h-full object-cover opacity-90 shadow-lg"
                                        />
                                        {/* Overlay Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-40" />

                                        {/* Scanline effect */}
                                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />
                                    </div>
                                </div>

                                {/* Floating Element 1 - Top Right */}
                                <div className="absolute -top-6 -right-6 bg-[#0a0a0a] border border-white/10 p-3 rounded-lg shadow-xl flex items-center gap-3 animate-float overflow-hidden backdrop-blur-md max-w-[150px]">
                                    <div className="absolute inset-0 bg-grid-small opacity-20" />
                                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary relative z-10">
                                        <GitBranch className="w-4 h-4" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Sync</div>
                                        <div className="text-xs font-bold font-mono text-green-400">Active</div>
                                    </div>
                                </div>

                                {/* Floating Element 2 - Bottom Left */}
                                <div className="absolute -bottom-8 -left-8 bg-[#0a0a0a] border border-white/10 p-4 rounded-lg shadow-2xl flex items-center gap-3 animate-float-delayed backdrop-blur-md">
                                    <div className="absolute inset-0 bg-noise opacity-10" />
                                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 relative z-10">
                                        <Flame className="w-5 h-5 fill-current" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Current Streak</div>
                                        <div className="text-xl font-bold font-mono">365 Days</div>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                </section>


                {/* --- "The Problem" / Chaos vs Order Section --- */}
                <section className="py-24 bg-[#050505] overflow-hidden relative">
                    <div className="cyber-pattern opacity-50" />
                    <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black via-black/80 to-transparent z-0 pointer-events-none" />
                    <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black via-black/80 to-transparent z-0 pointer-events-none" />

                    <div className="container mx-auto px-4 max-w-7xl relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
                            <div className="space-y-8 order-2 md:order-1">
                                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Focus is the new <br /><span className="text-primary/50 line-through decoration-primary">currency</span> <span className="text-white">superpower.</span></h2>
                                <p className="text-xl text-muted-foreground leading-relaxed">
                                    In a world designed to distract you, maintaining a consistent vector is nearly impossible without the right infrastructure.
                                    <br /><br />
                                    Most tools are cluttered lists. We built a visualization engine that turns your effort into art.
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-3 text-lg">
                                        <X className="w-6 h-6 text-red-500/50" />
                                        <span className="text-muted-foreground line-through decoration-white/20">Scattered sticky notes</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-lg">
                                        <X className="w-6 h-6 text-red-500/50" />
                                        <span className="text-muted-foreground line-through decoration-white/20">Broken spreadsheet formulas</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-lg">
                                        <Check className="w-6 h-6 text-primary" />
                                        <span className="text-white font-medium">Automated, verified consistency</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="relative order-1 md:order-2 flex justify-center">
                                {/* Visual Mockup of Zen Mode */}
                                <div className="relative w-full max-w-md aspect-square">
                                    <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full opacity-20" />
                                    <img
                                        src={zenModeGraphic}
                                        alt="Zen Mode Focus Visualization"
                                        className="relative z-10 w-full h-full object-contain drop-shadow-2xl animate-float-slow [mask-image:radial-gradient(closest-side,black_50%,transparent_100%)] scale-110"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>


                {/* --- Workflow Section --- */}
                <section className="py-32 container mx-auto px-4 max-w-7xl relative">
                    <h2 className="text-center text-4xl font-bold mb-24">How it Mechanics</h2>

                    <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent border-t border-dashed border-white/20" />

                        <WorkflowStep
                            icon={<GitBranch />}
                            number={1}
                            title="Connect"
                            description="Link your GitHub repo, WakaTime, or define custom manual triggers via our API."
                        />
                        <WorkflowStep
                            icon={<Code2 />}
                            number={2}
                            title="Build"
                            description="Do the work. Push code. Read pages. Meditate. We listen for the signals."
                        />
                        <WorkflowStep
                            icon={<Fingerprint />}
                            number={3}
                            title="Visualize"
                            description="Your heatmap fills automatically. Streaks extend. Metadata is captured forevever."
                        />
                    </div>
                </section>

                <TerminalSection />

                {/* --- Bento Grid Features Section --- */}
                <section className="py-32 container mx-auto px-4 max-w-7xl">
                    <div className="flex items-end justify-between mb-12">
                        <div>
                            <span className="text-primary font-mono text-sm tracking-wider uppercase mb-4 block">System Capabilities</span>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                                Engineered for <span className="text-white">Scale</span>
                            </h2>
                        </div>
                    </div>

                    <div className="border border-white/10 bg-black/40 backdrop-blur-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y divide-white/10 md:divide-y-0 text-left">
                            <BentoItem
                                icon={<BarChart3 className="w-5 h-5 text-primary" />}
                                title="Analytics Engine"
                                description="Deep dive into your productivity metrics using our advanced analytics engine. Track commit velocity and daily activity heatmaps."
                                className="md:border-r border-white/10"
                            />
                            <BentoItem
                                icon={<Flame className="w-5 h-5 text-orange-500" />}
                                title="Streak Protection"
                                description="Never lose a streak due to an emergency again. Our freeze tokens allow you to pause your streak safely."
                                className="md:border-r border-white/10"
                            />
                            <BentoItem
                                icon={<Github className="w-5 h-5 text-white" />}
                                title="GitHub Sync"
                                description="Seamlessly integrate with GitHub API. We automatically pull your public contributions to populate your activity board."
                            />
                            <BentoItem
                                icon={<Trophy className="w-5 h-5 text-yellow-500" />}
                                title="Leaderboards"
                                description="Compete with friends and the global community. Climb the ranks based on consistency and longest active streaks."
                                className="md:border-r border-t border-white/10 lg:border-t-0"
                                overrideBorder="border-t lg:border-t md:border-t lg:border-t"
                            />
                            <BentoItem
                                icon={<Target className="w-5 h-5 text-blue-500" />}
                                title="Smart Goals"
                                description="Set granular goals for specific repositories, languages, or time-of-day. Get notified when you're falling behind schedule."
                                className="md:border-r border-t border-white/10"
                            />
                            <BentoItem
                                icon={<Zap className="w-5 h-5 text-purple-500" />}
                                title="Real-time Updates"
                                description="Experience zero-latency updates. Your contribution graph reflects your work the moment you push code."
                                className="border-t border-white/10"
                            />
                        </div>
                    </div>
                </section>

                <CommunityStories />


                {/* --- FooterLike CTA Section -- */}
                <section className="bg-[#050505] relative overflow-hidden">
                    {/* Cyber Pattern Background (as requested) */}
                    <div className="cyber-pattern opacity-50" />

                    {/* Overlay gradient for text readability at bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-[500px] bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none z-10" />

                    <div className="container mx-auto px-4 py-32 max-w-4xl text-center relative z-20">
                        <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
                            Ready to build your <span className="text-primary">legacy?</span>
                        </h2>
                        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
                            Join thousands of developers who have turned their coding habits into a visual masterpiece. Start your streak today.
                        </p>
                        <div className="flex justify-center">
                            <Link to="/signup">
                                <CosmicButton>
                                    Get Started Now
                                </CosmicButton>
                            </Link>
                        </div>
                    </div>

                    <div className="py-12 bg-transparent relative z-20">
                        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                All systems normal
                            </div>
                            <div>© 2026 Evergreeners Inc.</div>
                            <div className="flex gap-8">
                                <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                                <a href="#" className="hover:text-primary transition-colors">Terms</a>
                                <a href="#" className="hover:text-primary transition-colors">Twitter</a>
                                <a href="#" className="hover:text-primary transition-colors">GitHub</a>
                            </div>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
}

// --- Helper Components ---

function WorkflowStep({ icon, number, title, description }: { icon: React.ReactNode, number: number, title: string, description: string }) {
    return (
        <div className="relative text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-black border border-white/10 rounded-2xl flex items-center justify-center relative z-10 shadow-xl group hover:border-primary/50 transition-colors">
                <div className="text-muted-foreground group-hover:text-primary transition-colors [&>svg]:w-10 [&>svg]:h-10">
                    {icon}
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs">
                    {number}
                </div>
            </div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">{description}</p>
        </div>
    )
}

function BentoItem({ icon, title, description, className, overrideBorder }: { icon: React.ReactNode, title: string, description: string, className?: string, overrideBorder?: string }) {
    return (
        <div className={cn("p-12 hover:bg-white/[0.02] transition-colors group relative flex flex-col", className)}>
            <div className="mb-6 inline-flex p-3 rounded-lg bg-white/5 border border-white/10 group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors w-fit">
                {icon}
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">{title}</h3>
            <p className="text-muted-foreground leading-relaxed text-base flex-grow">
                {description}
            </p>
            <div className="mt-8 flex items-center text-primary text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                Learn more <ArrowRight className="ml-2 w-4 h-4" />
            </div>
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 -translate-x-[1px] -translate-y-[1px]" />
        </div>
    )
}

function TestimonialCard({ quote, author, role }: { quote: string, author: string, role: string }) {
    return (
        <div className="p-8 rounded-2xl bg-white/5 border border-white/5 relative hover:border-white/10 transition-all duration-300 hover:bg-white/[0.07]">
            <Quote className="w-8 h-8 text-primary/20 mb-4" />
            <p className="text-lg mb-6 leading-relaxed font-medium">"{quote}"</p>
            <div>
                <div className="font-bold">{author}</div>
                <div className="text-sm text-muted-foreground">{role}</div>
            </div>
        </div>
    )
}
