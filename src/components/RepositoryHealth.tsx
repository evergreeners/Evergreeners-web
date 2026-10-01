import { useState, useEffect } from "react";
import { Section } from "@/components/Section";
import { InsightCard } from "@/components/InsightCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { githubService } from "@/lib/githubService";
import { geminiService } from "@/lib/geminiService";
import { useSession } from "@/lib/auth-client";
import { ShieldCheck, GitCommit, Search, Terminal, AlertCircle } from "lucide-react";

export function RepositoryHealth() {
    const { data: session } = useSession();

    const [repos, setRepos] = useState<any[]>([]);
    const [isLoadingRepos, setIsLoadingRepos] = useState(false);

    const [selectedRepoFullName, setSelectedRepoFullName] = useState<string>("");
    const [repoData, setRepoData] = useState<any>(null);
    const [healthScore, setHealthScore] = useState<any>(null);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState("");

    // Fetch all repos for the user
    useEffect(() => {
        async function fetchRepos() {
            if (session?.session?.token) {
                setIsLoadingRepos(true);
                try {
                    const data = await githubService.getUserRepos(session.session.token);
                    if (Array.isArray(data)) {
                        setRepos(data);
                    }
                } catch (e) {
                    console.error("Failed to fetch repos", e);
                } finally {
                    setIsLoadingRepos(false);
                }
            }
        }
        fetchRepos();
    }, [session?.session?.token]);

    // Handle Analysis
    const runAnalysis = async () => {
        if (!selectedRepoFullName) return;

        setError("");
        setIsAnalyzing(true);
        const [owner, repo] = selectedRepoFullName.split('/');

        try {
            const token = session?.session?.token || "DUMMY_TOKEN";

            const [repoInfo, treeInfo] = await Promise.all([
                githubService.getRepo(token, owner, repo),
                githubService.getRepoTree(token, owner, repo)
            ]);

            setRepoData(repoInfo);

            const [health, microSuggs] = await Promise.all([
                geminiService.analyzeRepoHealth(repoInfo, treeInfo),
                geminiService.generateSuggestions(repoInfo)
            ]);

            setHealthScore(health);
            setSuggestions(microSuggs);
        } catch (e: any) {
            console.error("Failed to load repo detail", e);
            setError(e.message || "Failed to analyze repository.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <Section title="AI Repository Health" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="space-y-2 flex-grow">
                    <label className="text-sm font-medium">Select Repository to Analyze</label>
                    <Select
                        onValueChange={setSelectedRepoFullName}
                        value={selectedRepoFullName || undefined}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={isLoadingRepos ? "Loading your repositories..." : "Select a repository"} />
                        </SelectTrigger>
                        <SelectContent>
                            {repos.map((r) => (
                                <SelectItem key={r.full_name} value={r.full_name}>
                                    {r.full_name}
                                </SelectItem>
                            ))}
                            {repos.length === 0 && !isLoadingRepos && (
                                <SelectItem value="none" disabled>No repositories found. Connect GitHub first.</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={runAnalysis} disabled={isAnalyzing || !selectedRepoFullName} className="w-full md:w-auto">
                    {isAnalyzing ? "Analyzing..." : "Analyze Health"}
                </Button>
            </div>

            {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-xl flex items-center gap-2 text-sm border border-destructive/20">
                    <AlertCircle className="w-4 h-4" /> {error}
                </div>
            )}

            {isAnalyzing && (
                <div className="grid md:grid-cols-2 gap-6 mt-8 animate-pulse">
                    <Skeleton className="h-[250px] w-full border border-border/50 rounded-xl bg-secondary/20" />
                    <Skeleton className="h-[250px] w-full border border-border/50 rounded-xl bg-secondary/20" />
                </div>
            )}

            {!isAnalyzing && repoData && healthScore && (
                <div className="animate-fade-up">
                    <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-border/50 pb-4">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Search className="w-5 h-5 text-muted-foreground" />
                                {repoData.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">{repoData.description || "No description provided."}</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-xs px-2 py-1 bg-secondary rounded-md">{repoData.language || 'Code'}</span>
                            <span className="text-xs px-2 py-1 bg-secondary rounded-md flex items-center gap-1">
                                <GitCommit className="w-3 h-3" /> {repoData.stargazers_count || 0} Stars
                            </span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-4">
                            <div className="p-6 rounded-xl border border-border bg-secondary/10 flex flex-col items-center justify-center text-center">
                                <ShieldCheck className="w-10 h-10 text-primary mb-2" />
                                <h3 className="text-3xl font-bold mb-1">{healthScore.score || 0}<span className="text-lg text-muted-foreground">/100</span></h3>
                                <p className="text-sm text-muted-foreground">Overall Health Score</p>
                            </div>

                            <div className="p-4 rounded-xl border border-border bg-secondary/10">
                                <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm font-mono text-zinc-200">
                                    <Terminal className="w-4 h-4 text-emerald-400" /> Analysis Insight
                                </h4>
                                <p className="text-sm font-medium leading-relaxed">{healthScore.insights || "No insight generated."}</p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Missing Core Files</h4>
                                {healthScore.missingFiles && healthScore.missingFiles.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {healthScore.missingFiles.map((item: string) => (
                                            <span key={item} className="text-xs font-mono bg-destructive/10 text-destructive px-2 py-1 rounded-md border border-destructive/20">
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-green-500 font-medium">Excellent! All standard files are present.</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <h4 className="font-semibold">Micro Improvements</h4>
                                <p className="text-xs text-muted-foreground">Actionable items under 20 mins to boost health.</p>
                            </div>
                            <div className="grid gap-3">
                                {suggestions.map((sugg, idx) => (
                                    <InsightCard
                                        key={idx}
                                        title={sugg.title}
                                        description={sugg.description}
                                        type="achievement"
                                    />
                                ))}
                                {suggestions.length === 0 && (
                                    <p className="text-sm text-muted-foreground p-4 bg-secondary/10 rounded-md border border-border/50">No suggestions needed.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Section>
    );
}
