import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { FloatingNav } from "@/components/FloatingNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from "@/lib/auth-client";
import { githubService } from "@/lib/githubService";
import { geminiService } from "@/lib/geminiService";
import { FileText, GitPullRequest, Wand2, BookOpen, Users, AlertCircle, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const DOC_TYPES = [
    { id: "readme" as const, label: "README", icon: BookOpen, desc: "Project overview, setup & usage" },
    { id: "contributing" as const, label: "Contributing", icon: Users, desc: "Contribution guide & standards" },
    { id: "issue_template" as const, label: "Issue Template", icon: AlertCircle, desc: "Bug report & feature request" },
];

const STEPS = [
    { n: 1, title: "Select Repository", hint: "Choose which GitHub repo to generate docs for." },
    { n: 2, title: "Choose Doc Type", hint: "Pick the kind of document you want to create." },
    { n: 3, title: "Generate", hint: "Let AI write the document based on your repo." },
    { n: 4, title: "Review & Deploy", hint: "Edit if needed, then open a pull request." },
];

export default function Generator() {
    const { data: session } = useSession();
    const { toast } = useToast();

    const [repos, setRepos] = useState<any[]>([]);
    const [isLoadingRepos, setIsLoadingRepos] = useState(false);
    const [owner, setOwner] = useState("");
    const [repo, setRepo] = useState("");
    const [docType, setDocType] = useState<'readme' | 'contributing' | 'issue_template'>('readme');
    const [generatedDoc, setGeneratedDoc] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);

    // Steps: 1=no repo, 2=repo selected, 3=generating or ready to generate, 4=doc ready
    const activeStep: number = generatedDoc ? 4 : isGenerating ? 3 : (owner && repo) ? 2 : 1;

    useEffect(() => {
        async function fetchRepos() {
            if (!session?.session?.token) return;
            setIsLoadingRepos(true);
            try {
                const data = await githubService.getUserRepos(session.session.token);
                if (Array.isArray(data)) setRepos(data);
            } catch (e) { console.error(e); }
            finally { setIsLoadingRepos(false); }
        }
        fetchRepos();
    }, [session?.session?.token]);

    const handleGenerate = async () => {
        if (!owner || !repo) {
            toast({ title: "Select a repository first", variant: "destructive" });
            return;
        }
        setIsGenerating(true);
        try {
            const token = session?.session?.token || "DUMMY_TOKEN";
            let manifest = "";
            try { const p = await githubService.getFileContent(token, owner, repo, "package.json"); manifest = p.content; } catch { }
            const ctx = { name: repo, description: "", language: "TypeScript" };
            try { const r = await githubService.getRepo(token, owner, repo); ctx.description = r.description || ""; ctx.language = r.language || ""; } catch { }
            const doc = await geminiService.autoWriteDocumentation(ctx, manifest, docType);
            setGeneratedDoc(doc);
            toast({ title: "Done!", description: "Your document is ready to review." });
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally { setIsGenerating(false); }
    };

    const deployToGithub = async () => {
        if (!generatedDoc || !owner || !repo) return;
        setIsDeploying(true);
        try {
            const token = session?.session?.token || "DUMMY_TOKEN";
            const branch = `docs/auto-generate-${Date.now()}`;
            const files = { readme: "README.md", contributing: "CONTRIBUTING.md", issue_template: ".github/ISSUE_TEMPLATE/feature_request.md" };
            await githubService.createBranch(token, owner, repo, branch, "main");
            await githubService.createOrUpdateFile(token, owner, repo, files[docType], generatedDoc, `docs: auto-generated ${docType}`, branch);
            await githubService.openPullRequest(token, owner, repo, `Docs: Auto-Generated ${docType}`, `This PR adds an AI-generated ${docType} via Evergreeners.`, branch, "main");
            toast({ title: "Pull Request Opened!", description: "Check your repository on GitHub." });
        } catch (e: any) {
            toast({ title: "Deployment Error", description: e.message, variant: "destructive" });
        } finally { setIsDeploying(false); }
    };

    const selectedType = DOC_TYPES.find(d => d.id === docType)!;

    return (
        <div className="min-h-screen bg-background custom-scrollbar overflow-x-hidden">
            <Header />

            {/* Ambient glow */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 z-0"
                style={{ background: "radial-gradient(ellipse 60% 30% at 50% 0%, hsl(142 71% 45% / 0.09) 0%, transparent 65%)" }}
            />

            {/* Mobile: normal scroll. Desktop: fill 100dvh exactly */}
            <div className="relative z-10 flex flex-col md:h-[100dvh]">
                <main className="flex-1 flex flex-col container max-w-6xl pt-24 md:pt-20 pb-28 md:pb-4 gap-4 md:overflow-hidden">

                    {/* Page title */}
                    <div className="pt-4 shrink-0">
                        <h1 className="text-2xl md:text-3xl font-bold text-gradient mb-1">
                            Documentation Generator
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            AI-written docs for your GitHub repos — shipped as a pull request.
                        </p>
                    </div>

                    {/* ── Mobile: horizontal step bar ── */}
                    <div className="flex md:hidden items-center w-full shrink-0">
                        {STEPS.map(({ n, title }, idx) => {
                            const isDone = n < activeStep;
                            const isActive = n === activeStep;
                            const isLast = idx === STEPS.length - 1;
                            return (
                                <div key={n} className="flex items-center flex-1 min-w-0">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className={[
                                            "w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                            isDone
                                                ? "border-primary bg-primary"
                                                : isActive
                                                    ? "border-primary bg-primary/15 shadow-[0_0_8px_hsl(142_71%_45%/0.35)]"
                                                    : "border-white/10 bg-transparent",
                                        ].join(" ")}>
                                            {isDone
                                                ? <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />
                                                : <span className={["text-[10px] font-mono font-bold", isActive ? "text-primary" : "text-white/20"].join(" ")}>{n}</span>
                                            }
                                        </div>
                                        <span className={[
                                            "text-[9px] font-medium text-center leading-none max-w-[56px] truncate",
                                            isDone ? "text-primary/60" : isActive ? "text-foreground/80" : "text-white/20",
                                        ].join(" ")}>{title}</span>
                                    </div>
                                    {!isLast && (
                                        <div className={[
                                            "h-px flex-1 mx-1 mb-3 rounded-full transition-colors duration-500",
                                            isDone ? "bg-primary/40" : "bg-white/[0.06]",
                                        ].join(" ")} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Main layout: sidebar + workspace ── */}
                    <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">

                        {/* ════ SIDEBAR (desktop only) ════ */}
                        <aside
                            className="hidden md:flex flex-col w-52 shrink-0 rounded-xl border border-white/[0.07] overflow-hidden"
                            style={{ background: "hsl(0 0% 5%)" }}
                        >
                            {/* Sidebar header */}
                            <div
                                className="px-4 py-3 border-b border-white/[0.06] shrink-0"
                                style={{ background: "hsl(0 0% 7%)" }}
                            >
                                <span className="font-mono text-[11px] text-muted-foreground/35">~/workflow</span>
                            </div>

                            {/* Steps list */}
                            <div className="flex-1 p-4 overflow-y-auto">
                                {STEPS.map(({ n, title, hint }, idx) => {
                                    const isDone = n < activeStep;
                                    const isActive = n === activeStep;
                                    const isLast = idx === STEPS.length - 1;
                                    return (
                                        <div key={n} className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={[
                                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 mt-0.5",
                                                    isDone ? "border-primary bg-primary"
                                                        : isActive ? "border-primary bg-primary/15 shadow-[0_0_10px_hsl(142_71%_45%/0.3)]"
                                                            : "border-white/10 bg-transparent",
                                                ].join(" ")}>
                                                    {isDone
                                                        ? <Check className="w-3 h-3 text-black" strokeWidth={3} />
                                                        : <span className={["text-[10px] font-bold font-mono", isActive ? "text-primary" : "text-white/20"].join(" ")}>{n}</span>
                                                    }
                                                </div>
                                                {!isLast && (
                                                    <div
                                                        className="w-px rounded-full my-1 transition-colors duration-500"
                                                        style={{
                                                            flex: "1 1 auto",
                                                            minHeight: 24,
                                                            background: isDone ? "hsl(142 71% 45% / 0.5)" : "hsl(0 0% 100% / 0.05)",
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            <div className={isLast ? "pb-0" : "pb-5"}>
                                                <p className={[
                                                    "text-sm font-medium leading-tight mb-1 transition-colors",
                                                    isDone ? "text-primary/65" : isActive ? "text-foreground" : "text-white/20",
                                                ].join(" ")}>{title}</p>
                                                {isActive && (
                                                    <p className="text-[11px] text-muted-foreground/45 leading-snug">{hint}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </aside>

                        {/* ════ TERMINAL WORKSPACE ════ */}
                        <div className="flex-1 min-w-0 flex flex-col rounded-xl border border-white/[0.07] overflow-hidden" style={{ background: "hsl(0 0% 5%)" }}>

                            {/* Terminal header */}
                            <div
                                className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] shrink-0"
                                style={{ background: "hsl(0 0% 7%)" }}
                            >
                                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                                    <span className="font-mono text-xs text-primary/45 shrink-0">$</span>
                                    <span className="font-mono text-xs text-muted-foreground/35 truncate">
                                        gen --repo{" "}
                                        <em className="text-primary/55 not-italic">{repo || "<repo>"}</em>
                                        {" "}--type{" "}
                                        <em className="text-primary/55 not-italic">{docType}</em>
                                    </span>
                                </div>
                                {isGenerating && (
                                    <span className="flex items-center gap-1.5 text-[10px] font-mono text-primary/50 shrink-0 ml-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                        running…
                                    </span>
                                )}
                                {generatedDoc && !isGenerating && (
                                    <span className="flex items-center gap-1.5 text-[10px] font-mono text-primary/55 shrink-0 ml-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        ready
                                    </span>
                                )}
                            </div>

                            {/* Two-pane body */}
                            <div className="flex flex-col md:flex-row flex-1 min-h-0 divide-y md:divide-y-0 md:divide-x divide-white/[0.05]">

                                {/* Left — controls */}
                                <div className="md:w-64 lg:w-72 shrink-0 flex flex-col p-5 gap-5 overflow-y-auto">

                                    {/* Repo */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/35 uppercase tracking-[0.12em]">
                                            <span className="text-primary/40">›</span> Repository
                                        </label>
                                        <Select
                                            onValueChange={(val) => { const [o, r] = val.split('/'); setOwner(o); setRepo(r); }}
                                            value={owner && repo ? `${owner}/${repo}` : undefined}
                                        >
                                            <SelectTrigger className="border-white/[0.07] bg-white/[0.02] text-sm h-9">
                                                <SelectValue placeholder={isLoadingRepos ? "Loading…" : "Select repository"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {repos.map(r => (
                                                    <SelectItem key={r.full_name} value={r.full_name}>{r.full_name}</SelectItem>
                                                ))}
                                                {repos.length === 0 && !isLoadingRepos && (
                                                    <SelectItem value="none" disabled>No repositories found.</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Doc type */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/35 uppercase tracking-[0.12em]">
                                            <span className="text-primary/40">›</span> Document Type
                                        </label>
                                        <div className="space-y-1.5">
                                            {DOC_TYPES.map(({ id, label, icon: Icon }) => (
                                                <button
                                                    key={id}
                                                    onClick={() => setDocType(id)}
                                                    className={[
                                                        "w-full flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-all duration-150",
                                                        docType === id
                                                            ? "border-primary/25 bg-primary/8 text-primary"
                                                            : "border-white/[0.04] bg-transparent text-muted-foreground/45 hover:border-white/[0.1] hover:text-muted-foreground",
                                                    ].join(" ")}
                                                >
                                                    <Icon className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="font-medium">{label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Generate */}
                                    <div className="space-y-2 mt-auto">
                                        <Button
                                            onClick={handleGenerate}
                                            disabled={isGenerating || !owner || !repo}
                                            variant="outline"
                                            className="w-full gap-2 h-9 glass-nav bg-primary/10 border-primary/20 text-foreground hover:bg-primary/20 hover:text-foreground transition-all duration-300"
                                        >
                                            <Wand2 className="w-3.5 h-3.5" />
                                            {isGenerating ? "Generating…" : "Generate"}
                                        </Button>
                                        {!owner && (
                                            <p className="text-center text-[10px] text-muted-foreground/25">
                                                Select a repository first
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Right — preview */}
                                <div className="flex-1 flex flex-col min-h-[320px] md:min-h-0 overflow-hidden">
                                    {/* Tab */}
                                    <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.05] shrink-0">
                                        <FileText className="w-3 h-3 text-muted-foreground/25" />
                                        <span className="text-[10px] font-mono text-muted-foreground/30">
                                            {selectedType.label.toLowerCase().replace(" ", "_")}.md
                                        </span>
                                    </div>

                                    {/* Textarea fills remaining height */}
                                    <Textarea
                                        className="flex-1 w-full font-mono text-sm resize-none border-0 bg-transparent rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground/75 placeholder:text-muted-foreground/15 px-4 py-3"
                                        placeholder={`# ${selectedType.label}\n\nGenerate documentation using the panel on the left.\nYour output will appear here — you can edit it freely before deploying.`}
                                        value={generatedDoc}
                                        onChange={(e) => setGeneratedDoc(e.target.value)}
                                    />

                                    {/* Deploy footer */}
                                    {generatedDoc && (
                                        <div className="px-4 py-3 border-t border-white/[0.05] shrink-0">
                                            <Button
                                                onClick={deployToGithub}
                                                disabled={isDeploying}
                                                variant="outline"
                                                className="w-full gap-2 h-9 glass-nav bg-primary/10 border-primary/20 text-foreground hover:bg-primary/20 hover:text-foreground transition-all duration-300"
                                            >
                                                <GitPullRequest className="w-3.5 h-3.5" />
                                                {isDeploying ? "Opening PR…" : "Create Pull Request on GitHub"}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer note */}
                    <p className="shrink-0 text-center text-[10px] text-muted-foreground/20">
                        A new branch is created on your repo and a PR is opened — nothing is merged automatically.
                    </p>
                </main>
            </div>

            <FloatingNav />
        </div>
    );
}
