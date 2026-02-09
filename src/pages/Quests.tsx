import { Header } from "@/components/Header";
import { FloatingNav } from "@/components/FloatingNav";
import { Section } from "@/components/Section";
import { Compass, Scroll, Zap, Star, Shield, Trophy, GitFork, ExternalLink, RefreshCw, CheckCircle, Plus, User, XCircle, GitCommit, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
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

const API_URL = import.meta.env.VITE_API_URL || "";

interface Quest {
    id: number;
    title: string;
    description: string;
    repoUrl: string;
    tags: string[];
    difficulty: "Easy" | "Medium" | "Hard";
    points: number;
    status: "available" | "active" | "completed"; // Legacy field from backend map, but we use myStatus now
    forkUrl?: string;

    // New fields
    createdBy: string;
    creatorName: string;
    acceptedBy?: string | null;
    acceptedStatus?: 'active' | 'completed' | null;
    isTaken: boolean;
    myStatus?: 'active' | 'completed' | null;
    myProgress?: {
        startedAt: string;
        completedAt?: string;
        forkUrl?: string;
    } | null;
}

export default function Quests() {
    const queryClient = useQueryClient();
    const [checkingId, setCheckingId] = useState<number | null>(null);
    const { data: session } = authClient.useSession();

    // Create Quest State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newQuestTitle, setNewQuestTitle] = useState("");
    const [newQuestDesc, setNewQuestDesc] = useState("");
    const [newQuestRepo, setNewQuestRepo] = useState("");
    const [newQuestTags, setNewQuestTags] = useState("");
    const [newQuestDiff, setNewQuestDiff] = useState<string>("Easy");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Use React Query for quests with caching
    const { data: quests = [], isLoading } = useQuery({
        queryKey: ['quests'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/quests`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error('Failed to fetch quests');
            const data = await res.json();
            return data.quests as Quest[];
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
        refetchOnWindowFocus: true,
        enabled: !!session,
    });

    // Only show skeleton if no cached data exists
    const shouldShowSkeleton = isLoading && quests.length === 0;

    // Supabase Realtime subscription for instant updates
    useEffect(() => {
        if (!session) return;

        // Set up WebSocket or polling for realtime updates
        // Since Supabase realtime is enabled on your tables, we can use refetch interval
        const interval = setInterval(() => {
            // Invalidate and refetch in background
            queryClient.invalidateQueries({ queryKey: ['quests'] });
        }, 30000); // Refetch every 30 seconds for realtime feel

        return () => clearInterval(interval);
    }, [session, queryClient]);

    const refetchQuests = () => {
        queryClient.invalidateQueries({ queryKey: ['quests'] });
    };


    const handleStartQuest = async (id: number) => {
        if (!session) {
            toast.error("Please login first");
            return;
        }

        toast.info("Accepting quest...");

        try {
            const res = await fetch(`${API_URL}/api/quests/${id}/accept`, {
                method: "POST",
                credentials: "include"
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to accept quest");
            }

            toast.success("Quest accepted!");
            refetchQuests();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        }
    };

    const handleDropQuest = async (id: number) => {
        try {
            const res = await fetch(`${API_URL}/api/quests/${id}/drop`, {
                method: "POST",
                credentials: "include"
            });
            if (res.ok) {
                toast.success("Quest dropped.");
                refetchQuests();
            } else {
                throw new Error("Failed to drop");
            }
        } catch (e) {
            toast.error("Failed to drop quest.");
        }
    };

    const handleCheckProgress = async (id: number) => {
        setCheckingId(id);
        toast.info("Checking your progress with GitHub...");

        try {
            const res = await fetch(`${API_URL}/api/quests/${id}/check`, {
                method: "POST",
                credentials: "include"
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to check progress");
            }

            const data = await res.json();
            const status = data.progress.status;

            if (status === 'completed') {
                toast.success("Congratulations! Quest Completed & Verified!");
            } else if (status === 'in_progress') {
                toast.info("Step 1 Complete: Fork detected. Now push your commits!");
            } else if (status === 'not_started') {
                toast.warning("Could not find your fork. Did you fork the repo?");
            } else {
                toast.info(`Status: ${status}`);
            }

            refetchQuests(); // Refresh data


        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error checking progress");
        } finally {
            setCheckingId(null);
        }
    };

    const handleCreateQuest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return;

        setIsSubmitting(true);
        try {
            const tags = newQuestTags.split(',').map(t => t.trim()).filter(Boolean);
            const res = await fetch(`${API_URL}/api/quests`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newQuestTitle,
                    description: newQuestDesc,
                    repoUrl: newQuestRepo,
                    difficulty: newQuestDiff,
                    tags: tags,
                    points: newQuestDiff === 'Easy' ? 10 : newQuestDiff === 'Medium' ? 30 : 50
                }),
                credentials: "include"
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to create quest");
            }

            toast.success("Quest created successfully!");
            setIsCreateOpen(false);
            setNewQuestTitle("");
            setNewQuestDesc("");
            setNewQuestRepo("");
            setNewQuestTags("");
            refetchQuests(); // Refresh list

        } catch (error: any) {
            toast.error(error.message || "Failed to create quest");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getDifficultyColor = (diff: string) => {
        switch (diff) {
            case "Easy": return "bg-green-500/10 text-green-500 border-green-500/20";
            case "Medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
            case "Hard": return "bg-red-500/10 text-red-500 border-red-500/20";
            default: return "bg-secondary text-muted-foreground";
        }
    };

    // Filter Logic
    const myActiveQuests = quests.filter(q => q.myStatus === 'active');

    // Active for others (excluding mine) and status is ACTIVE
    const othersActive = quests.filter(q => q.isTaken && q.acceptedStatus === 'active' && q.myStatus !== 'active' && q.myStatus !== 'completed');

    // All completed (mine + others)
    const allCompleted = quests.filter(q => q.acceptedStatus === 'completed' || q.myStatus === 'completed');

    // Available (neither taken by me active, nor taken by others active/completed)
    // Note: If I completed it, it shouldn't show in Available for me.
    // If someone else completed it, it shouldn't show in Available.
    const availableQuests = quests.filter(q => !q.isTaken && !q.myStatus);

    return (
        <div className="min-h-screen bg-background custom-scrollbar overflow-x-hidden">
            <Header />

            <main className="w-full max-w-[1600px] mx-auto px-4 pt-24 pb-32 md:px-8 md:pb-12 space-y-8">
                {/* Hero Section */}
                <section className="animate-fade-in text-center py-8 relative overflow-hidden">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 blur-3xl bg-primary/30 rounded-full scale-150 animate-pulse-slow" />
                        <div className="relative">
                            <div className="flex items-center justify-center gap-4">
                                <Compass className="w-16 h-16 text-primary animate-pulse-slow" />
                                <span className="text-4xl md:text-7xl font-bold text-gradient">Quests</span>
                            </div>
                            <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-2xl mx-auto">
                                Discover meaningful work, contribute to open source, and advance your career.
                            </p>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content Column */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h2 className="text-2xl font-bold">Available Quests</h2>
                            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                                <DialogTrigger asChild>
                                    <Button className="gap-2 w-full sm:w-auto">
                                        <Plus className="w-4 h-4" /> Submit Quest
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Submit a New Quest</DialogTitle>
                                        <DialogDescription>
                                            Add an open source issue or task for others to solve.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleCreateQuest} className="space-y-4 pt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="title">Title</Label>
                                            <Input
                                                id="title"
                                                placeholder="e.g. Fix button contrast in dark mode"
                                                value={newQuestTitle}
                                                onChange={e => setNewQuestTitle(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="repo">Repository URL</Label>
                                            <Input
                                                id="repo"
                                                placeholder="https://github.com/owner/repo"
                                                value={newQuestRepo}
                                                onChange={e => setNewQuestRepo(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="desc">Description</Label>
                                            <Textarea
                                                id="desc"
                                                placeholder="Describe the task..."
                                                value={newQuestDesc}
                                                onChange={e => setNewQuestDesc(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="diff">Difficulty</Label>
                                                <Select value={newQuestDiff} onValueChange={setNewQuestDiff}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Easy">Easy (10 XP)</SelectItem>
                                                        <SelectItem value="Medium">Medium (30 XP)</SelectItem>
                                                        <SelectItem value="Hard">Hard (50 XP)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="tags">Tags (comma separated)</Label>
                                                <Input
                                                    id="tags"
                                                    placeholder="bug, ui, react"
                                                    value={newQuestTags}
                                                    onChange={e => setNewQuestTags(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                                            {isSubmitting ? "Submitting..." : "Submit Quest"}
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <Section className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
                            {shouldShowSkeleton ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[1, 2, 3, 4].map((i) => (
                                        <Card key={i} className="bg-card/30 backdrop-blur-sm border-border flex flex-col">
                                            <CardHeader>
                                                <div className="flex justify-between items-start mb-2">
                                                    <Skeleton className="h-6 w-16" />
                                                    <Skeleton className="h-6 w-16" />
                                                </div>
                                                <Skeleton className="h-6 w-3/4 mb-2" />
                                                <Skeleton className="h-4 w-full" />
                                                <Skeleton className="h-3 w-32 mt-2" />
                                            </CardHeader>
                                            <CardContent className="flex-grow">
                                                <div className="flex gap-2">
                                                    <Skeleton className="h-6 w-16" />
                                                    <Skeleton className="h-6 w-20" />
                                                </div>
                                            </CardContent>
                                            <CardFooter className="flex justify-between items-center gap-4 mt-auto">
                                                <Skeleton className="h-4 w-16" />
                                                <Skeleton className="h-10 w-32" />
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {availableQuests.length === 0 && !isLoading && (
                                        <div className="col-span-2 text-center py-10 border border-dashed border-border rounded-xl">
                                            <p className="text-muted-foreground mb-4">No available quests at the moment.</p>
                                            <Button variant="outline" onClick={() => setIsCreateOpen(true)}>Be the first to add one!</Button>
                                        </div>
                                    )}
                                    {availableQuests.map((quest) => (
                                        <Card key={quest.id} className="bg-card/30 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 flex flex-col group relative">
                                            <CardHeader>
                                                <div className="flex justify-between items-start">
                                                    <Badge variant="outline" className={cn("mb-2", getDifficultyColor(quest.difficulty))}>
                                                        {quest.difficulty}
                                                    </Badge>
                                                    <div className="flex items-center gap-1 text-yellow-500">
                                                        <Zap className="w-4 h-4 fill-current" />
                                                        <span className="font-bold">{quest.points} XP</span>
                                                    </div>
                                                </div>
                                                <CardTitle className="text-xl group-hover:text-primary transition-colors">{quest.title}</CardTitle>
                                                <CardDescription className="line-clamp-2">
                                                    {quest.description}
                                                </CardDescription>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                                                    <User className="w-3 h-3" /> Posted by {quest.creatorName}
                                                    {quest.createdBy === session?.user?.id && (
                                                        <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-primary/20">My Quest</Badge>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="flex-grow">
                                                <div className="flex flex-wrap gap-2">
                                                    {quest.tags && quest.tags.map(tag => (
                                                        <span key={tag} className="text-xs px-2 py-1 rounded bg-secondary text-muted-foreground">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </CardContent>
                                            <CardFooter className="flex justify-between items-center gap-4 mt-auto">
                                                <a
                                                    href={quest.repoUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                                                >
                                                    <GitFork className="w-4 h-4" /> Repo
                                                </a>

                                                {quest.createdBy === session?.user?.id ? (
                                                    <Button disabled variant="secondary" className="w-full sm:w-auto opacity-50 cursor-not-allowed">
                                                        My Quest
                                                    </Button>
                                                ) : (
                                                    <Button onClick={() => handleStartQuest(quest.id)} className="w-full sm:w-auto">
                                                        Accept Quest
                                                    </Button>
                                                )}
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </Section>

                        {/* Accepted by Others Section (Active Only) */}
                        {othersActive.length > 0 && (
                            <Section title="Quests in Progress" className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-70">
                                    {othersActive.map(quest => (
                                        <Card key={quest.id} className="bg-secondary/10 border-border flex flex-col">
                                            <CardHeader>
                                                <div className="flex justify-between items-start">
                                                    <Badge variant="outline" className={cn("mb-2 opacity-50", getDifficultyColor(quest.difficulty))}>
                                                        {quest.difficulty}
                                                    </Badge>
                                                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-none">
                                                        Taken
                                                    </Badge>
                                                </div>
                                                <CardTitle className="text-lg opacity-80">{quest.title}</CardTitle>
                                            </CardHeader>
                                            <CardFooter className="mt-auto">
                                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <User className="w-4 h-4" />
                                                    Evergreener: <span className="text-foreground font-medium">{quest.acceptedBy}</span>
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            </Section>
                        )}


                        {/* Completed Quests Section (All Completed) */}
                        {allCompleted.length > 0 && (
                            <Section title="Completed Quests" className="opacity-80">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {allCompleted.map(quest => (
                                        <div key={quest.id} className="p-4 rounded-xl border border-green-500/30 bg-green-500/10 flex items-center gap-4">
                                            <div className="p-2 rounded-full bg-green-500/20 text-green-500">
                                                <CheckCircle className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{quest.title}</h3>
                                                <p className="text-sm text-green-500/80">
                                                    Completed by {quest.myStatus === 'completed' ? "You" : quest.acceptedBy}! (+{quest.points} XP)
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Section>
                        )}
                    </div>

                    {/* Sidebar Column */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* My Active Quests */}
                        <Section title="Your Active Quests" className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
                            <div className="space-y-4">
                                {myActiveQuests.length === 0 ? (
                                    <div className="p-6 rounded-2xl border border-dashed border-border bg-card/30 text-center">
                                        <Scroll className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                        <p className="text-muted-foreground">No active quests. Pick one to start!</p>
                                    </div>
                                ) : (
                                    myActiveQuests.map(quest => (
                                        <div key={quest.id} className="p-5 rounded-2xl border border-primary/50 bg-primary/5 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <Compass className="w-24 h-24 rotate-45" />
                                            </div>
                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-bold text-lg leading-tight">{quest.title}</h3>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <button className="text-muted-foreground hover:text-destructive transition-colors">
                                                                <XCircle className="w-5 h-5" />
                                                            </button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Abandon Quest?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to drop this quest? It will become available for others to take.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDropQuest(quest.id)} className="bg-destructive hover:bg-destructive/90">
                                                                    Abandon
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>

                                                <div className="space-y-3 mb-4">
                                                    {/* Progress Steps */}
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center border", quest.myProgress?.forkUrl ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground text-muted-foreground")}>
                                                            {quest.myProgress?.forkUrl ? <CheckCircle className="w-4 h-4" /> : "1"}
                                                        </div>
                                                        <span className={cn(quest.myProgress?.forkUrl ? "text-foreground" : "text-muted-foreground")}>Fork Repo</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center border", quest.myStatus === 'completed' ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground text-muted-foreground")}>
                                                            {quest.myStatus === 'completed' ? <CheckCircle className="w-4 h-4" /> : "2"}
                                                        </div>
                                                        <span className={cn(quest.myStatus === 'completed' ? "text-foreground" : "text-muted-foreground")}>Push Commit / PR</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="secondary" asChild className="flex-1">
                                                            <a href={quest.repoUrl} target="_blank" rel="noreferrer">
                                                                <ExternalLink className="w-4 h-4 mr-2" /> Repo
                                                            </a>
                                                        </Button>
                                                        {quest.myProgress?.forkUrl && (
                                                            <Button size="sm" variant="secondary" asChild className="flex-1 bg-secondary/80">
                                                                <a href={quest.myProgress.forkUrl} target="_blank" rel="noreferrer">
                                                                    <GitFork className="w-4 h-4 mr-2" /> Fork
                                                                </a>
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        onClick={() => handleCheckProgress(quest.id)}
                                                        disabled={checkingId === quest.id}
                                                        className="w-full"
                                                    >
                                                        {checkingId === quest.id ? (
                                                            <>Checking <RefreshCw className="w-4 h-4 ml-2 animate-spin" /></>
                                                        ) : "Check Progress"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Section>

                        {/* How it Works */}
                        <Section title="How it Works" className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
                            <div className="p-5 rounded-2xl border border-border bg-card/50 backdrop-blur-sm space-y-4">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 font-bold">1</div>
                                    <p className="text-sm text-muted-foreground pt-1">Accept a quest. Only one person can take it at a time!</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 font-bold">2</div>
                                    <p className="text-sm text-muted-foreground pt-1">Fork the repository and make your changes.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 font-bold">3</div>
                                    <p className="text-sm text-muted-foreground pt-1">Check progress. We verify your commits.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 font-bold">4</div>
                                    <p className="text-sm text-muted-foreground pt-1">Earn XP. If you get stuck, drop the quest for someone else.</p>
                                </div>
                            </div>
                        </Section>
                    </div>
                </div>
            </main>
            <FloatingNav />
        </div>
    );
}
