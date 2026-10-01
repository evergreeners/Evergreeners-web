import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { FloatingNav } from "@/components/FloatingNav";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/lib/auth-client";
import { githubService } from "@/lib/githubService";
import { getApiUrl } from "@/lib/api-config";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { RepoHeroCard } from "@/components/repo/RepoHeroCard";
import { RepoStandardsChecklist } from "@/components/repo/RepoStandardsChecklist";
import { RecentCommitStream } from "@/components/repo/RecentCommitStream";
import { ArchitectScoreCard } from "@/components/repo/ArchitectScoreCard";
import { ArchitectInsights } from "@/components/repo/ArchitectInsights";
import { PrioritizedActionItems } from "@/components/repo/PrioritizedActionItems";
import { CodebaseAuditTerminal } from "@/components/repo/CodebaseAuditTerminal";

export default function RepoDetail() {
  const { owner, repo } = useParams();
  const { data: session } = useSession();
  const { toast } = useToast();

  const [repoInfo, setRepoInfo] = useState<any>(null);
  const [treeInfo, setTreeInfo] = useState<any>(null);
  const [languages, setLanguages] = useState<Record<string, number>>({});
  const [recentCommits, setRecentCommits] = useState<any[]>([]);
  const [readmeContent, setReadmeContent] = useState<string>("");
  const [isLoadingRepo, setIsLoadingRepo] = useState(true);

  // AI analysis state
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function fetchRepoDetails() {
      if (session?.session?.token && owner && repo) {
        setIsLoadingRepo(true);
        try {
          const token = session.session.token;
          const [repoData, treeData, langData, commitsData, readmeData] =
            await Promise.allSettled([
              githubService.getRepo(token, owner, repo),
              githubService.getRepoTree(token, owner, repo),
              githubService.getRepoLanguages(token, owner, repo),
              githubService.getRepoCommits(token, owner, repo, 10),
              githubService.getRepoReadme(token, owner, repo),
            ]);

          if (repoData.status === "fulfilled") setRepoInfo(repoData.value);
          if (treeData.status === "fulfilled") setTreeInfo(treeData.value);
          if (langData.status === "fulfilled" && langData.value)
            setLanguages(langData.value);
          if (commitsData.status === "fulfilled" && Array.isArray(commitsData.value))
            setRecentCommits(commitsData.value);
          if (readmeData.status === "fulfilled" && typeof readmeData.value === "string")
            setReadmeContent(readmeData.value);
        } catch (e) {
          console.error("Failed to load repo details", e);
        } finally {
          setIsLoadingRepo(false);
        }
      }
    }
    fetchRepoDetails();
  }, [owner, repo, session]);

  // File structure checklist
  const fileChecklist = useMemo(() => {
    const files = treeInfo?.tree?.map((t: any) => t.path.toLowerCase()) || [];
    return [
      {
        name: ".gitignore",
        description: "Excludes build artifacts, secrets, and environment binaries",
        present: files.some((f: string) => f === ".gitignore"),
      },
      {
        name: "README.md",
        description: "Project documentation, architecture breakdown, and quickstart guide",
        present: files.some((f: string) => f.includes("readme")),
      },
      {
        name: "LICENSE",
        description: "Software copyright, IP declaration, and distribution permissions",
        present: files.some((f: string) => f.includes("license")),
      },
      {
        name: "CI/CD Workflows",
        description: "GitHub Actions automated build, test, and lint validation runner",
        present: files.some((f: string) => f.startsWith(".github/workflows")),
      },
      {
        name: "Test Suite",
        description: "Automated unit, integration, or end-to-end test specifications",
        present: files.some(
          (f: string) =>
            f.includes("test") || f.includes("spec") || f.includes("__tests__")
        ),
      },
      {
        name: "CONTRIBUTING.md",
        description: "Community pull request, branch conventions, and issue guidelines",
        present: files.some((f: string) => f.includes("contributing")),
      },
    ];
  }, [treeInfo]);

  // Run Backend AI Codebase Audit
  const runAiAudit = async () => {
    if (!owner || !repo || !repoInfo) return;
    setIsAnalyzing(true);
    try {
      const fileList = treeInfo?.tree?.map((t: any) => t.path) || [];
      const commitLog = recentCommits.map((c: any) => ({
        message: c.commit?.message?.split("\n")[0] || "Update",
        author: c.commit?.author?.name || c.author?.login || "committer",
        date: c.commit?.author?.date || "",
        sha: c.sha ? c.sha.slice(0, 7) : "",
      }));

      const res = await fetch(getApiUrl("/api/repo/analyze"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          owner,
          repo,
          repoInfo,
          languages,
          fileList,
          recentCommits: commitLog,
          readmeSnippet: readmeContent.slice(0, 1500),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to analyze repository");
      }

      const data = await res.json();
      setAnalysisResult(data.data);
      setActiveTab("audit");
      toast({
        title: "Codebase Audit Complete",
        description: "Architectural diagnosis successfully generated.",
      });
    } catch (e: any) {
      toast({
        title: "Audit Encountered Issue",
        description: e.message || "Could not complete analysis",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoadingRepo) {
    return (
      <div className="min-h-screen bg-background custom-scrollbar">
        <Header />
        <main className="container pt-24 pb-32 md:pb-12 space-y-6">
          <Skeleton className="h-6 w-36 mb-4" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </main>
      </div>
    );
  }

  if (!repoInfo) {
    return (
      <div className="min-h-screen bg-background custom-scrollbar">
        <Header />
        <main className="container pt-24 pb-32 md:pb-12 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="p-4 rounded-full bg-secondary/50 border border-border mb-4">
            <AlertCircle className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-foreground font-mono">
            Repository Not Found
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md text-sm">
            We couldn't load details for this repository. Ensure it exists on
            GitHub and your account has access.
          </p>
          <Button asChild variant="outline">
            <Link to="/analytics">Back to Analytics</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background custom-scrollbar">
      <Header />

      <main className="container pt-24 pb-32 md:pb-12 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="w-3.5 h-3.5" />
          <Link to="/analytics">Back to Analytics</Link>
          <span>/</span>
          <span className="text-foreground">{repoInfo.name}</span>
        </div>

        {/* Hero Card */}
        <RepoHeroCard
          repoInfo={repoInfo}
          languages={languages}
          isAnalyzing={isAnalyzing}
          onRunAudit={runAiAudit}
        />

        {/* Content Tabs: Overview vs AI Audit */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/80">
            <TabsTrigger
              value="overview"
              className="px-6 py-2 rounded-lg text-xs sm:text-sm font-mono font-medium transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 data-[state=active]:border data-[state=active]:border-zinc-700/60"
            >
              Codebase Overview
            </TabsTrigger>
            <TabsTrigger
              value="audit"
              className="px-6 py-2 rounded-lg text-xs sm:text-sm font-mono font-medium transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 data-[state=active]:border data-[state=active]:border-zinc-700/60"
            >
              Architect's AI Audit
              {analysisResult && (
                <span className="ml-2 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {analysisResult.score}/100
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Overview (Checklist & Commits) */}
          <TabsContent value="overview" className="space-y-8 outline-none">
            <RepoStandardsChecklist items={fileChecklist} />
            <RecentCommitStream commits={recentCommits} />
          </TabsContent>

          {/* Tab 2: Architect's AI Audit */}
          <TabsContent value="audit" className="space-y-8 outline-none">
            {analysisResult ? (
              <div className="space-y-8 animate-fade-in">
                <ArchitectScoreCard
                  score={analysisResult.score}
                  readiness={analysisResult.readiness}
                  categoryScores={analysisResult.categoryScores}
                  isAnalyzing={isAnalyzing}
                  onReRunAudit={runAiAudit}
                />
                <ArchitectInsights
                  architectRead={analysisResult.architectRead}
                  strengths={analysisResult.strengths}
                  risks={analysisResult.risks}
                />
                <PrioritizedActionItems
                  items={analysisResult.actionItems || []}
                />
              </div>
            ) : (
              <CodebaseAuditTerminal
                repoName={repoInfo.name}
                isAnalyzing={isAnalyzing}
                onRunAudit={runAiAudit}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>

      <FloatingNav />
    </div>
  );
}
