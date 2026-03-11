import { Header } from "@/components/Header";
import { FloatingNav } from "@/components/FloatingNav";
import { Section } from "@/components/Section";
import { Compass, Scroll, Zap, Star, Shield, Trophy, GitFork, ExternalLink, RefreshCw, CheckCircle, Plus, User, XCircle, GitCommit, PlayCircle, ChevronRight, Clock, Calendar, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
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
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { githubService } from "@/lib/githubService";
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
    isOpenQuest: boolean;

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
    const [newQuestIsOpen, setNewQuestIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    // Quest detail state
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);

    // Edit quest state
    const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [editRepo, setEditRepo] = useState("");
    const [editTags, setEditTags] = useState("");
    const [editDiff, setEditDiff] = useState("Easy");
    const [editIsOpen, setEditIsOpen] = useState(false);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    
    const isMobile = useIsMobile();
    const [repos, setRepos] = useState<any[]>([]);
    const [isLoadingRepos, setIsLoadingRepos] = useState(false);

    useEffect(() => {
        async function fetchRepos() {
            if (!session?.session?.token) return;
            setIsLoadingRepos(true);
            try {
                const data = await githubService.getUserRepos(session.session.token);
                if (Array.isArray(data)) setRepos(data);
            } catch (e) { 
                console.error(e); 
            } finally { 
                setIsLoadingRepos(false); 
            }
        }
        fetchRepos();
    }, [session?.session?.token]);

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
                    points: newQuestDiff === 'Easy' ? 10 : newQuestDiff === 'Medium' ? 30 : 50,
                    isOpenQuest: newQuestIsOpen
                }),
                credentials: "include"
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to create quest");
            }

            toast.success("Quest created successfully!");
            setIsCreateOpen(false);
            setIsPreviewMode(false);
            setNewQuestTitle("");
            setNewQuestDesc("");
            setNewQuestRepo("");
            setNewQuestTags("");
            setNewQuestIsOpen(false);
            refetchQuests(); // Refresh list

        } catch (error: any) {
            toast.error(error.message || "Failed to create quest");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteQuest = async (id: number) => {
        try {
            const res = await fetch(`${API_URL}/api/quests/${id}`, {
                method: "DELETE",
                credentials: "include"
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to delete quest");
            }
            toast.success("Quest deleted.");
            setSelectedQuest(null);
            refetchQuests();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete quest");
        }
    };

    const openEditQuest = (quest: Quest) => {
        setEditingQuest(quest);
        setEditTitle(quest.title);
        setEditDesc(quest.description);
        setEditRepo(quest.repoUrl);
        setEditTags((quest.tags || []).join(', '));
        setEditDiff(quest.difficulty);
        setEditIsOpen(quest.isOpenQuest);
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingQuest) return;
        setIsSavingEdit(true);
        try {
            const tags = editTags.split(',').map(t => t.trim()).filter(Boolean);
            const res = await fetch(`${API_URL}/api/quests/${editingQuest.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editTitle,
                    description: editDesc,
                    repoUrl: editRepo,
                    difficulty: editDiff,
                    tags,
                    isOpenQuest: editIsOpen
                }),
                credentials: "include"
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to update quest");
            }
            toast.success("Quest updated!");
            setEditingQuest(null);
            setSelectedQuest(null);
            refetchQuests();
        } catch (error: any) {
            toast.error(error.message || "Failed to update quest");
        } finally {
            setIsSavingEdit(false);
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

    // Strips common markdown syntax to produce a clean plain-text preview
    const stripMarkdown = (md: string): string => {
        return md
            .replace(/#{1,6}\s+/g, '')          // headings
            .replace(/\*\*(.+?)\*\*/g, '$1')    // bold
            .replace(/\*(.+?)\*/g, '$1')         // italic
            .replace(/`{1,3}(.+?)`{1,3}/gs, '$1') // inline & block code
            .replace(/!\[.*?\]\(.*?\)/g, '')    // images
            .replace(/\[(.+?)\]\(.*?\)/g, '$1') // links
            .replace(/^[-*+]\s+/gm, '')          // unordered list bullets
            .replace(/^\d+\.\s+/gm, '')          // ordered list numbers
            .replace(/^>\s+/gm, '')              // blockquotes
            .replace(/\n{2,}/g, ' ')             // collapse blank lines
            .replace(/\n/g, ' ')                 // collapse single newlines
            .trim();
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

    // Points derived from difficulty
    const newQuestPoints = newQuestDiff === 'Hard' ? 50 : newQuestDiff === 'Medium' ? 30 : 10;
    const newQuestTagsArray = newQuestTags.split(',').map(t => t.trim()).filter(Boolean);

    // ── Step 1: Form ──────────────────────────────────────────────────────────
    const questFormStep = (
        <form
            onSubmit={e => {
                e.preventDefault();
                // Validate required fields before showing preview
                if (!newQuestTitle.trim() || !newQuestDesc.trim() || !newQuestRepo.trim()) return;
                setIsPreviewMode(true);
            }}
            className="space-y-4 pt-4"
        >
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
                <Select onValueChange={(val) => setNewQuestRepo(`https://github.com/${val}`)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={isLoadingRepos ? "Loading your repos..." : "Select a repository"} />
                    </SelectTrigger>
                    <SelectContent>
                        {repos && repos.map((r: any) => (
                            <SelectItem key={r.full_name} value={r.full_name}>
                                {r.full_name}
                            </SelectItem>
                        ))}
                        {(!repos || repos.length === 0) && !isLoadingRepos && (
                            <SelectItem value="none" disabled>
                                No repositories found.
                            </SelectItem>
                        )}
                    </SelectContent>
                </Select>
                <div className="text-xs text-center text-muted-foreground my-1">- OR -</div>
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
                    placeholder="Describe the task... (supports **bold**, *italic*, ## headings, - lists, `code`)"
                    value={newQuestDesc}
                    onChange={e => setNewQuestDesc(e.target.value)}
                    required
                    rows={6}
                />
                <p className="text-xs text-muted-foreground">Supports Markdown: **bold**, *italic*, ## headings, - lists, `code`</p>
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
            <div className="flex items-center space-x-2 py-2">
                <Switch
                    id="open-quest"
                    checked={newQuestIsOpen}
                    onCheckedChange={setNewQuestIsOpen}
                />
                <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="open-quest" className="font-medium">Open Quest</Label>
                    <p className="text-sm text-muted-foreground">Allow multiple people to accept this quest simultaneously.</p>
                </div>
            </div>
            <Button
                type="submit"
                variant="outline"
                className="w-full glass-nav bg-primary/10 border-primary/20 text-foreground hover:bg-primary/20 hover:text-foreground transition-all duration-300"
            >
                Preview Quest →
            </Button>
        </form>
    );

    // ── Step 2: Preview ───────────────────────────────────────────────────────
    const questPreviewStep = (
        <div className="pt-4 space-y-5">
            {/* Preview label */}
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span className="h-px flex-1 bg-border" />
                Preview — this is how your quest will appear
                <span className="h-px flex-1 bg-border" />
            </div>

            {/* Quest preview card */}
            <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-5 space-y-4">
                {/* Badges + XP */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={getDifficultyColor(newQuestDiff)}>{newQuestDiff}</Badge>
                        {newQuestIsOpen && (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Open Quest</Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500 shrink-0">
                        <Zap className="w-4 h-4 fill-current" />
                        <span className="font-bold text-sm">{newQuestPoints} XP</span>
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-foreground leading-tight">{newQuestTitle || <span className="text-muted-foreground italic">Untitled Quest</span>}</h2>

                {/* Description rendered as Markdown */}
                <div className="prose prose-sm dark:prose-invert max-w-none
                    prose-h1:text-foreground prose-h1:text-xl prose-h1:font-bold prose-h1:mt-3 prose-h1:mb-1
                    prose-h2:text-foreground prose-h2:text-lg prose-h2:font-semibold prose-h2:mt-3 prose-h2:mb-1
                    prose-h3:text-foreground prose-h3:text-base prose-h3:font-semibold prose-h3:mt-2 prose-h3:mb-1
                    prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:my-1.5
                    prose-strong:text-foreground prose-strong:font-semibold
                    prose-em:text-foreground/80
                    prose-ul:text-foreground/90 prose-ol:text-foreground/90
                    prose-li:my-0.5 prose-li:marker:text-primary
                    prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                    prose-pre:bg-secondary prose-pre:rounded-lg prose-pre:text-xs
                    prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                    prose-hr:border-border">
                    <ReactMarkdown>{newQuestDesc || '*No description provided.*'}</ReactMarkdown>
                </div>

                {/* Tags */}
                {newQuestTagsArray.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {newQuestTagsArray.map(tag => (
                            <span key={tag} className="text-xs px-2 py-1 rounded bg-secondary text-muted-foreground">#{tag}</span>
                        ))}
                    </div>
                )}

                {/* Repo */}
                {newQuestRepo && (
                    <div className="flex items-center gap-2 text-sm text-primary pt-1">
                        <GitFork className="w-4 h-4 shrink-0" />
                        <span className="truncate">{newQuestRepo.replace('https://github.com/', '')}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
                <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsPreviewMode(false)}
                >
                    ← Edit
                </Button>
                <Button
                    type="button"
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={isSubmitting}
                    onClick={handleCreateQuest as any}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Quest ⚡'}
                </Button>
            </div>
        </div>
    );

    const questFormContent = isPreviewMode ? questPreviewStep : questFormStep;

    return (
        <div className="min-h-screen bg-background custom-scrollbar overflow-x-hidden">
            <Header />

            <main className="w-full max-w-[1600px] mx-auto px-4 pt-24 pb-32 md:px-8 md:pb-12 space-y-8">
                {/* Hero Section */}
                <section className="animate-fade-in text-center py-8 relative overflow-hidden">
                    <div className="relative inline-block">
                        <div className="relative">
                            <div className="flex items-center justify-center gap-4">
                                <Compass className="w-12 h-12 text-primary" />
                                <span className="text-4xl md:text-6xl font-extrabold text-foreground tracking-tight">Quests</span>
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
                            {isMobile ? (
                                <Drawer open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) setIsPreviewMode(false); }}>
                                    <DrawerTrigger asChild>
                                        <Button variant="outline" className="gap-2 w-full sm:w-auto glass-nav bg-primary/10 border-primary/20 text-foreground hover:bg-primary/20 hover:text-foreground transition-all duration-300">
                                            <Plus className="w-4 h-4" /> Submit Quest
                                        </Button>
                                    </DrawerTrigger>
                                    <DrawerContent className="max-h-[90vh]">
                                        <DrawerHeader>
                                            <DrawerTitle>{isPreviewMode ? 'Preview Your Quest' : 'Submit a New Quest'}</DrawerTitle>
                                            <DrawerDescription>
                                                {isPreviewMode ? 'Check how your quest will look before submitting.' : 'Add an open source issue or task for others to solve.'}
                                            </DrawerDescription>
                                        </DrawerHeader>
                                        <div className="overflow-y-auto px-4 pb-8">
                                            {questFormContent}
                                        </div>
                                    </DrawerContent>
                                </Drawer>
                            ) : (
                                <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) setIsPreviewMode(false); }}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="gap-2 w-full sm:w-auto glass-nav bg-primary/10 border-primary/20 text-foreground hover:bg-primary/20 hover:text-foreground transition-all duration-300">
                                            <Plus className="w-4 h-4" /> Submit Quest
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>{isPreviewMode ? 'Preview Your Quest' : 'Submit a New Quest'}</DialogTitle>
                                            <DialogDescription>
                                                {isPreviewMode ? 'Check how your quest will look before submitting.' : 'Add an open source issue or task for others to solve.'}
                                            </DialogDescription>
                                        </DialogHeader>
                                        {questFormContent}
                                    </DialogContent>
                                </Dialog>
                            )}
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
                                        <Card
                                            key={quest.id}
                                            className="bg-card/30 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 flex flex-col group relative cursor-pointer"
                                            onClick={() => setSelectedQuest(quest)}
                                        >
                                            <CardHeader>
                                                <div className="flex justify-between items-start">
                                                    <div className="flex gap-2 mb-2 flex-wrap">
                                                        <Badge variant="outline" className={getDifficultyColor(quest.difficulty)}>
                                                            {quest.difficulty}
                                                        </Badge>
                                                        {quest.isOpenQuest && (
                                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                                                Open Quest
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-yellow-500">
                                                        <Zap className="w-4 h-4 fill-current" />
                                                        <span className="font-bold">{quest.points} XP</span>
                                                    </div>
                                                </div>
                                                <CardTitle className="text-xl group-hover:text-primary transition-colors">{quest.title}</CardTitle>
                                                <CardDescription className="line-clamp-2">
                                                    {stripMarkdown(quest.description)}
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
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 p-0"
                                                    onClick={(e) => { e.stopPropagation(); window.open(quest.repoUrl, '_blank'); }}
                                                >
                                                    <GitFork className="w-4 h-4" /> Repo
                                                </Button>

                                                {quest.createdBy === session?.user?.id ? (
                                                    <Button disabled variant="secondary" className="w-full sm:w-auto opacity-50 cursor-not-allowed" onClick={e => e.stopPropagation()}>
                                                        My Quest
                                                    </Button>
                                                ) : (
                                                    <Button onClick={(e) => { e.stopPropagation(); handleStartQuest(quest.id); }} className="w-full sm:w-auto">
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
                                                    <div className="flex gap-2 mb-2 flex-wrap">
                                                        <Badge variant="outline" className={cn("opacity-50", getDifficultyColor(quest.difficulty))}>
                                                            {quest.difficulty}
                                                        </Badge>
                                                        {quest.isOpenQuest && (
                                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                                                Open Quest
                                                            </Badge>
                                                        )}
                                                    </div>
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

            {/* Edit Quest Panel */}
            {isMobile ? (
                <Drawer open={!!editingQuest} onOpenChange={(open) => !open && setEditingQuest(null)}>
                    <DrawerContent className="max-h-[92vh]">
                        <DrawerHeader><DrawerTitle>Edit Quest</DrawerTitle></DrawerHeader>
                        <div className="overflow-y-auto px-4 pb-10">
                            <form onSubmit={handleSaveEdit} className="space-y-4">
                                <div className="space-y-2"><Label>Title</Label>
                                    <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} required /></div>
                                <div className="space-y-2"><Label>Description</Label>
                                    <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} required rows={6} />
                                    <p className="text-xs text-muted-foreground">Supports Markdown: **bold**, *italic*, ## headings, - lists, `code`</p>
                                </div>
                                <div className="space-y-2"><Label>Repo URL</Label>
                                    <Input value={editRepo} onChange={e => setEditRepo(e.target.value)} required /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Difficulty</Label>
                                        <Select value={editDiff} onValueChange={setEditDiff}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent><SelectItem value="Easy">Easy (10 XP)</SelectItem><SelectItem value="Medium">Medium (30 XP)</SelectItem><SelectItem value="Hard">Hard (50 XP)</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2"><Label>Tags (comma-separated)</Label>
                                        <Input value={editTags} onChange={e => setEditTags(e.target.value)} placeholder="e.g. ui, bug, feature" /></div>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                                    <div><p className="text-sm font-medium">Open Quest</p>
                                        <p className="text-xs text-muted-foreground">Allow multiple people to accept</p>
                                    </div>
                                    <Switch checked={editIsOpen} onCheckedChange={setEditIsOpen} />
                                </div>
                                <Button type="submit" className="w-full" disabled={isSavingEdit}>
                                    {isSavingEdit ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </form>
                        </div>
                    </DrawerContent>
                </Drawer>
            ) : (
                <Sheet open={!!editingQuest} onOpenChange={(open) => !open && setEditingQuest(null)}>
                    <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
                        <SheetHeader className="pb-4">
                            <SheetTitle>Edit Quest</SheetTitle>
                            <SheetDescription>Update your quest details below.</SheetDescription>
                        </SheetHeader>
                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div className="space-y-2"><Label>Title</Label>
                                <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} required /></div>
                            <div className="space-y-2"><Label>Description</Label>
                                <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} required rows={6} />
                                <p className="text-xs text-muted-foreground">Supports Markdown: **bold**, *italic*, ## headings, - lists, `code`</p>
                            </div>
                            <div className="space-y-2"><Label>Repo URL</Label>
                                <Input value={editRepo} onChange={e => setEditRepo(e.target.value)} required /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Difficulty</Label>
                                    <Select value={editDiff} onValueChange={setEditDiff}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="Easy">Easy (10 XP)</SelectItem><SelectItem value="Medium">Medium (30 XP)</SelectItem><SelectItem value="Hard">Hard (50 XP)</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2"><Label>Tags (comma-separated)</Label>
                                    <Input value={editTags} onChange={e => setEditTags(e.target.value)} placeholder="e.g. ui, bug, feature" /></div>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                                <div><p className="text-sm font-medium">Open Quest</p>
                                    <p className="text-xs text-muted-foreground">Allow multiple people to accept</p>
                                </div>
                                <Switch checked={editIsOpen} onCheckedChange={setEditIsOpen} />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSavingEdit}>
                                {isSavingEdit ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </form>
                    </SheetContent>
                </Sheet>
            )}

            {/* Quest Detail Panel — Sheet on desktop, Drawer on mobile */}
            {isMobile ? (
                <Drawer open={!!selectedQuest} onOpenChange={(open) => !open && setSelectedQuest(null)}>
                    <DrawerContent className="max-h-[92vh]">
                        <DrawerHeader className="pb-2">
                            {selectedQuest && (
                                <>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <Badge variant="outline" className={getDifficultyColor(selectedQuest.difficulty)}>{selectedQuest.difficulty}</Badge>
                                        {selectedQuest.isOpenQuest && <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Open Quest</Badge>}
                                        {selectedQuest.myStatus === 'active' && <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">In Progress</Badge>}
                                        {selectedQuest.myStatus === 'completed' && <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>}
                                    </div>
                                    <DrawerTitle className="text-xl font-bold leading-tight text-left">{selectedQuest.title}</DrawerTitle>
                                    <div className="flex items-center gap-1 text-yellow-500 pt-1">
                                        <Zap className="w-4 h-4 fill-current" />
                                        <span className="font-semibold">{selectedQuest.points} XP reward</span>
                                    </div>
                                </>
                            )}
                        </DrawerHeader>
                        <div className="overflow-y-auto px-4 pb-10 space-y-6">
                            {selectedQuest && <QuestDetailBody quest={selectedQuest} session={session} handleCheckProgress={handleCheckProgress} handleDropQuest={handleDropQuest} handleStartQuest={handleStartQuest} checkingId={checkingId} setSelectedQuest={setSelectedQuest} getDifficultyColor={getDifficultyColor} onDelete={handleDeleteQuest} onStartEdit={openEditQuest} />}
                        </div>
                    </DrawerContent>
                </Drawer>
            ) : (
                <Sheet open={!!selectedQuest} onOpenChange={(open) => !open && setSelectedQuest(null)}>
                    <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
                        {selectedQuest && (
                            <>
                                <SheetHeader className="pb-4">
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <Badge variant="outline" className={getDifficultyColor(selectedQuest.difficulty)}>{selectedQuest.difficulty}</Badge>
                                        {selectedQuest.isOpenQuest && <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Open Quest</Badge>}
                                        {selectedQuest.myStatus === 'active' && <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">In Progress</Badge>}
                                        {selectedQuest.myStatus === 'completed' && <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>}
                                    </div>
                                    <SheetTitle className="text-2xl font-bold leading-tight">{selectedQuest.title}</SheetTitle>
                                    <div className="flex items-center gap-1 text-yellow-500 pt-1">
                                        <Zap className="w-4 h-4 fill-current" />
                                        <span className="font-semibold">{selectedQuest.points} XP reward</span>
                                    </div>
                                </SheetHeader>
                                <QuestDetailBody quest={selectedQuest} session={session} handleCheckProgress={handleCheckProgress} handleDropQuest={handleDropQuest} handleStartQuest={handleStartQuest} checkingId={checkingId} setSelectedQuest={setSelectedQuest} getDifficultyColor={getDifficultyColor} onDelete={handleDeleteQuest} onStartEdit={openEditQuest} />
                            </>
                        )}
                    </SheetContent>
                </Sheet>
            )}
        </div>
    );
}

// ─── Quest detail body (shared between Sheet & Drawer) ────────────────────────
function QuestDetailBody({ quest, session, handleCheckProgress, handleDropQuest, handleStartQuest, checkingId, setSelectedQuest, getDifficultyColor, onDelete, onStartEdit }: {
    quest: any; session: any;
    handleCheckProgress: (id: number) => void;
    handleDropQuest: (id: number) => void;
    handleStartQuest: (id: number) => void;
    checkingId: number | null;
    setSelectedQuest: (q: any) => void;
    getDifficultyColor: (d: string) => string;
    onDelete: (id: number) => void;
    onStartEdit: (quest: any) => void;
}) {
    return (
        <div className="space-y-6">
            {/* Description — rendered as Markdown */}
            <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Description</p>
                <div className="prose prose-sm dark:prose-invert max-w-none
                    prose-h1:text-foreground prose-h1:text-xl prose-h1:font-bold prose-h1:mt-4 prose-h1:mb-2
                    prose-h2:text-foreground prose-h2:text-lg prose-h2:font-semibold prose-h2:mt-4 prose-h2:mb-2
                    prose-h3:text-foreground prose-h3:text-base prose-h3:font-semibold prose-h3:mt-3 prose-h3:mb-1
                    prose-h4:text-foreground prose-h4:font-medium
                    prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:my-2
                    prose-strong:text-foreground prose-strong:font-semibold
                    prose-em:text-foreground/80
                    prose-ul:text-foreground/90 prose-ol:text-foreground/90
                    prose-li:my-0.5 prose-li:marker:text-primary
                    prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                    prose-pre:bg-secondary prose-pre:text-foreground prose-pre:rounded-lg prose-pre:text-xs
                    prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:not-italic
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                    prose-hr:border-border">
                    <ReactMarkdown>{quest.description}</ReactMarkdown>
                </div>
            </div>

            {/* Tags */}
            {quest.tags && quest.tags.length > 0 && (
                <div>
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                        {quest.tags.map((tag: string) => (
                            <span key={tag} className="text-xs px-2 py-1 rounded bg-secondary text-muted-foreground">#{tag}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Meta */}
            <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Details</p>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Posted by</span>
                        <span className="font-medium text-foreground">{quest.creatorName}</span>
                    </div>
                    {quest.acceptedBy && !quest.isOpenQuest && (
                        <div className="flex items-center gap-2 text-sm">
                            <PlayCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">Accepted by</span>
                            <span className="font-medium text-foreground">{quest.acceptedBy}</span>
                        </div>
                    )}
                    {quest.myProgress?.startedAt && (
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">Started</span>
                            <span className="font-medium text-foreground">{new Date(quest.myProgress.startedAt).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Repo link */}
            <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Repository</p>
                <a href={quest.repoUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline break-all">
                    <GitFork className="w-4 h-4 shrink-0" />
                    {quest.repoUrl.replace('https://github.com/', '')}
                    <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 pt-2">
                {quest.myStatus === 'active' ? (
                    <>
                        <Button onClick={() => { handleCheckProgress(quest.id); setSelectedQuest(null); }} disabled={checkingId === quest.id} className="w-full">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            {checkingId === quest.id ? 'Checking...' : 'Check Progress'}
                        </Button>
                        <Button variant="outline" onClick={() => { handleDropQuest(quest.id); setSelectedQuest(null); }}
                            className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
                            <XCircle className="w-4 h-4 mr-2" /> Drop Quest
                        </Button>
                    </>
                ) : quest.myStatus === 'completed' ? (
                    <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-500">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Quest Completed!</span>
                    </div>
                ) : quest.createdBy === session?.user?.id ? (
                    <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-secondary/50 text-center text-sm text-muted-foreground">
                            This is your quest — others can accept it.
                        </div>
                        {/* Participants list — only visible to creator */}
                        <QuestParticipants questId={quest.id} />
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 gap-2 glass-nav bg-primary/10 border-primary/20 text-foreground hover:bg-primary/20 transition-all duration-300"
                                onClick={() => { onStartEdit(quest); setSelectedQuest(null); }}
                            >
                                <Pencil className="w-4 h-4" /> Edit Quest
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" className="flex-1 gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete this quest?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently remove <strong>{quest.title}</strong> and all associated progress. This cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            onClick={() => onDelete(quest.id)}
                                        >
                                            Yes, delete it
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                ) : quest.isTaken ? (
                    <div className="p-3 rounded-lg bg-secondary/50 text-center text-sm text-muted-foreground">
                        This quest is currently taken by another adventurer.
                    </div>
                ) : (
                    <Button onClick={() => { handleStartQuest(quest.id); setSelectedQuest(null); }} className="w-full">
                        <PlayCircle className="w-4 h-4 mr-2" /> Accept Quest
                    </Button>
                )}
            </div>
        </div>
    );
}

// ─── Quest Participants (creator-only view) ───────────────────────────────────
const API_URL_INNER = import.meta.env.VITE_API_URL || '';

interface Participant {
    userId: string;
    displayName: string;
    avatar: string | null;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
    forkUrl: string | null;
    streak: number;
}

function QuestParticipants({ questId }: { questId: number }) {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);

    const DEFAULT_VISIBLE = 3;

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch(`${API_URL_INNER}/api/quests/${questId}/participants`, { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                const raw: Participant[] = data.participants || [];
                // Sort: completed first, then by startedAt ascending (earliest first)
                const sorted = [...raw].sort((a, b) => {
                    if (a.status === 'completed' && b.status !== 'completed') return -1;
                    if (a.status !== 'completed' && b.status === 'completed') return 1;
                    const dateA = a.startedAt ? new Date(a.startedAt).getTime() : 0;
                    const dateB = b.startedAt ? new Date(b.startedAt).getTime() : 0;
                    return dateA - dateB;
                });
                setParticipants(sorted);
            })
            .catch(() => setError('Failed to load participants.'))
            .finally(() => setLoading(false));
    }, [questId]);

    if (loading) {
        return (
            <div className="space-y-2 mt-1">
                {[1, 2].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/40 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-secondary shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <div className="h-3 bg-secondary rounded w-1/3" />
                            <div className="h-2 bg-secondary rounded w-1/4" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return <p className="text-xs text-destructive mt-1">{error}</p>;
    }

    if (participants.length === 0) {
        return (
            <div className="mt-1 p-3 rounded-lg border border-dashed border-border text-center text-sm text-muted-foreground">
                No one has accepted this quest yet.
            </div>
        );
    }

    const visible = showAll ? participants : participants.slice(0, DEFAULT_VISIBLE);
    const hiddenCount = participants.length - DEFAULT_VISIBLE;

    return (
        <div className="mt-1 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Participants · {participants.length}
            </p>
            <div className="space-y-2">
                {visible.map(p => {
                    const isCompleted = p.status === 'completed';
                    return (
                        <div
                            key={p.userId}
                            className={cn(
                                'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                                isCompleted
                                    ? 'border-green-500/30 bg-green-500/5'
                                    : 'border-border bg-card/40'
                            )}
                        >
                            {/* Avatar */}
                            <div className="w-8 h-8 rounded-full bg-secondary border border-border shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold text-muted-foreground">
                                {p.avatar
                                    ? <img src={p.avatar} alt={p.displayName} className="w-full h-full object-cover" />
                                    : p.displayName.charAt(0).toUpperCase()}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm text-foreground truncate">{p.displayName}</span>
                                    <span className={cn(
                                        'text-xs px-1.5 py-0.5 rounded font-semibold',
                                        isCompleted
                                            ? 'bg-green-500/15 text-green-500'
                                            : 'bg-yellow-500/15 text-yellow-500'
                                    )}>
                                        {isCompleted ? '✓ Completed' : '⏳ In Progress'}
                                    </span>
                                    {p.streak > 0 && (
                                        <span className="text-xs text-primary font-mono">🔥 {p.streak}d</span>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                                    {p.startedAt && (
                                        <span>Started {new Date(p.startedAt).toLocaleDateString()}</span>
                                    )}
                                    {p.completedAt && (
                                        <span className="text-green-500">
                                            Completed {new Date(p.completedAt).toLocaleDateString()}
                                        </span>
                                    )}
                                    {p.forkUrl && (
                                        <a
                                            href={p.forkUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-1 text-primary hover:underline"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <GitFork className="w-3 h-3" /> View Fork
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Show more / show less toggle — only if there are more than DEFAULT_VISIBLE */}
            {participants.length > DEFAULT_VISIBLE && (
                <button
                    type="button"
                    onClick={() => setShowAll(prev => !prev)}
                    className="w-full mt-1 py-2 text-xs font-medium text-muted-foreground hover:text-foreground border border-dashed border-border rounded-lg transition-colors hover:border-border/80"
                >
                    {showAll
                        ? 'Show less ↑'
                        : `Show ${hiddenCount} more participant${hiddenCount !== 1 ? 's' : ''} ↓`}
                </button>
            )}
        </div>
    );
}
