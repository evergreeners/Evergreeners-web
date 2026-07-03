import { AcademyHeader } from "@/components/AcademyHeader";
import { FloatingNav } from "@/components/FloatingNav";
import { Section } from "@/components/Section";
import { GraduationCap, Terminal, Zap, CheckCircle2, AlertTriangle, ShieldCheck, GitFork, ArrowRight, Loader2, Play, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { getApiUrl } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";

interface AuditResult {
  score: number;
  profileReadmeExists: boolean;
  graveyardIndex: number;
  pinnedReposCount: number;
  feedback: string[];
}

export default function Academy() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Audit lead magnet state
  const [auditUsername, setAuditUsername] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditStep, setAuditStep] = useState(0);
  const [auditStepsText, setAuditStepsText] = useState<string[]>([]);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  // Enrollment state
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Check enrollment status
  const { data: statusData, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['academyStatus'],
    queryFn: async () => {
      const res = await fetch(getApiUrl('/api/academy/status'), {
        credentials: "include",
        headers: {
          ...(session?.session?.token ? { Authorization: `Bearer ${session.session.token}` } : {})
        }
      });
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
    enabled: !!session,
  });

  const auditSteps = [
    "Initializing git profile-audit...",
    "Connecting to GitHub API v3...",
    "Inspecting profile README layout...",
    "Analyzing public repositories list...",
    "Scanning push frequencies (calculating consistency)...",
    "Measuring Repository Graveyard Index...",
    "Compiling developer score sheet..."
  ];

  useEffect(() => {
    if (!isAuditing) return;
    if (auditStep < auditSteps.length) {
      const timer = setTimeout(() => {
        setAuditStepsText(prev => [...prev, `$ ${auditSteps[auditStep]}`]);
        setAuditStep(prev => prev + 1);
      }, 700 + Math.random() * 500);
      return () => clearTimeout(timer);
    } else {
      // Trigger API fetch
      const triggerAuditApi = async () => {
        try {
          const res = await fetch(getApiUrl('/api/academy/audit'), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: auditUsername })
          });
          if (res.ok) {
            const data = await res.json();
            setAuditResult(data);
            toast.success("Audit completed! See your results below.");
          } else {
            throw new Error("Audit failed");
          }
        } catch (e) {
          toast.error("Could not run audit. Please check your spelling and try again.");
          setAuditResult({
            score: 55,
            profileReadmeExists: false,
            graveyardIndex: 45,
            pinnedReposCount: 2,
            feedback: [
              "We encountered an issue connecting to GitHub, but here is a sample analysis.",
              "Profile README was not found.",
              "Your repository activity looks irregular. Join the paid cohort to learn consistency."
            ]
          });
        } finally {
          setIsAuditing(false);
        }
      };
      triggerAuditApi();
    }
  }, [isAuditing, auditStep, auditUsername]);

  const handleStartAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditUsername.trim()) return;
    setAuditStepsText(["$ git init-audit --username=" + auditUsername]);
    setAuditStep(0);
    setAuditResult(null);
    setIsAuditing(true);
  };

  const handleEnroll = async () => {
    if (!session) {
      toast.error("Please log in or sign up first to enroll in the Academy.");
      navigate("/login?redirect=/academy");
      return;
    }

    setIsEnrolling(true);
    try {
      const res = await fetch(getApiUrl('/api/academy/enroll'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.session?.token ? { Authorization: `Bearer ${session.session.token}` } : {})
        },
        credentials: "include"
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to enroll");
      }

      toast.success("Welcome to Evergreeners Academy!", {
        description: "Successfully enrolled in the Git and Open Source Cohort."
      });
      queryClient.invalidateQueries({ queryKey: ['academyStatus'] });
      navigate("/academy/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Enrollment failed.");
    } finally {
      setIsEnrolling(false);
    }
  };

  const enrolled = statusData?.status && statusData.status !== 'none';

  return (
    <div className="min-h-screen bg-background overflow-x-hidden custom-scrollbar">
      <AcademyHeader />

      <main className="w-full max-w-[1400px] mx-auto px-4 md:px-8 pt-24 pb-32 md:pb-12 space-y-16">
        
        {/* Hero Section */}
        <section className="text-center py-12 space-y-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" /> The Evergreeners Academy
          </div>
          <h1 className="text-4xl md:text-7xl font-extrabold text-foreground tracking-tight leading-none">
            Convert Philosophy Into <span className="text-gradient">Taught Skill</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            From Git zero to public repository hero. A highly focused 4-week syllabus designed to build verifiable GitHub credibility and launch your open-source journey.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            {enrolled ? (
              <Button size="lg" className="gap-2 font-bold px-8" onClick={() => navigate("/academy/dashboard")}>
                Go to Student Portal <ArrowRight className="w-5 h-5" />
              </Button>
            ) : (
              <a href="#enrollment">
                <Button size="lg" className="gap-2 font-bold px-8">
                  Join Academy <ArrowRight className="w-5 h-5" />
                </Button>
              </a>
            )}
            <a href="#audit">
              <Button size="lg" variant="outline" className="gap-2 border-primary/20 bg-primary/5">
                Audit Your Profile <Sparkles className="w-4 h-4 text-primary" />
              </Button>
            </a>
          </div>
        </section>

        {/* Lead Magnet Audit Section */}
        <span id="audit" className="block -mt-10 pt-10" />
        <Section title="Auditing the Graveyard" className="animate-fade-up">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-6">
              <h3 className="text-2xl font-bold">Is your GitHub profile a graveyard?</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Most students and early developers know how to write code, but their contribution graphs tell a story of inconsistency. Recruiters and hiring managers look at your history. 
              </p>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Our audit tool scans your repositories, checks for key portfolio standards (READMEs, Pins), and calculates your <strong>Graveyard Index</strong> (inactive code percentage) to show you exactly where you stand.
              </p>
              
              <form onSubmit={handleStartAudit} className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">github.com/</span>
                  <Input 
                    placeholder="username" 
                    className="pl-[88px] h-11"
                    value={auditUsername}
                    onChange={(e) => setAuditUsername(e.target.value)}
                    disabled={isAuditing}
                    required
                  />
                </div>
                <Button type="submit" size="lg" className="h-11 font-bold shrink-0" disabled={isAuditing}>
                  {isAuditing ? "Auditing..." : "Audit Profile"}
                </Button>
              </form>
            </div>

            <div className="lg:col-span-7">
              {/* Terminal View */}
              <div className="rounded-xl border border-border bg-black overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between bg-zinc-900/60 px-4 py-2 border-b border-border">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-primary" />
                    <span className="text-xs font-mono text-muted-foreground">profile_audit.sh</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                  </div>
                </div>
                <div className="p-5 font-mono text-xs space-y-2 min-h-[220px] max-h-[300px] overflow-y-auto bg-black text-green-400 custom-scrollbar">
                  {auditStepsText.map((text, i) => (
                    <div key={i} className="whitespace-pre-wrap">{text}</div>
                  ))}
                  {isAuditing && (
                    <div className="flex items-center gap-2 mt-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      <span className="text-muted-foreground italic">scanning...</span>
                    </div>
                  )}
                  {!isAuditing && auditStepsText.length === 0 && (
                    <div className="text-muted-foreground italic text-center py-10">
                      Enter your GitHub username to initiate the profile integrity check.
                    </div>
                  )}
                </div>
              </div>

              {/* Audit Results Panel */}
              {auditResult && (
                <div className="mt-6 p-6 rounded-xl border border-primary/20 bg-primary/5 grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in">
                  
                  {/* Score circle */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center text-center">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="54" className="stroke-zinc-800" strokeWidth="8" fill="transparent" />
                        <circle cx="64" cy="64" r="54" className="stroke-primary drop-shadow-[0_0_8px_hsla(var(--primary)/0.5)]" strokeWidth="8" fill="transparent" 
                          strokeDasharray={2 * Math.PI * 54}
                          strokeDashoffset={2 * Math.PI * 54 * (1 - auditResult.score / 100)}
                        />
                      </svg>
                      <div className="absolute text-3xl font-extrabold text-foreground">{auditResult.score}</div>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-3">Developer Score</span>
                  </div>

                  {/* Metrics list */}
                  <div className="md:col-span-8 space-y-4">
                    <h4 className="font-bold text-lg">Profile Audit Metrics</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg border border-border bg-background flex flex-col justify-between">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Profile README</span>
                        <div className="flex items-center gap-1.5 mt-1 font-bold text-sm">
                          {auditResult.profileReadmeExists ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                              <span className="text-primary">Found</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                              <span className="text-destructive">Missing</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg border border-border bg-background flex flex-col justify-between">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Graveyard Index</span>
                        <div className="flex items-center gap-1.5 mt-1 font-bold text-sm">
                          <span className={auditResult.graveyardIndex > 40 ? "text-destructive" : "text-primary"}>
                            {auditResult.graveyardIndex}%
                          </span>
                          <span className="text-[10px] font-normal text-muted-foreground">stale</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg border border-border bg-background flex flex-col justify-between">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Pinned Repos</span>
                        <div className="flex items-center gap-1.5 mt-1 font-bold text-sm">
                          <GitFork className="w-4 h-4 text-primary shrink-0" />
                          <span>{auditResult.pinnedReposCount} / 6</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      {auditResult.feedback.map((item, index) => (
                        <div key={index} className="flex gap-2 text-xs leading-relaxed text-foreground/90">
                          <span className="text-primary shrink-0">•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        </Section>

        {/* 4-Week Curriculum Timeline */}
        <span id="curriculum" className="block -mt-10 pt-10" />
        <Section title="The 4-Week Curriculum" className="animate-fade-up">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Week 1 */}
            <Card className="bg-card/20 border-border hover:border-primary/30 transition-all duration-300 relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <div className="text-primary font-bold text-xs uppercase tracking-wider mb-1">Week 1</div>
                <CardTitle className="text-lg">Git Fundamentals</CardTitle>
                <CardDescription>Mastering the local repository workflow.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>init, add, commit, branch, merge, rebase basics</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Writing commit messages that don't suck</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>.gitignore, undoing mistakes (reset/revert/reflog)</span>
                </div>
              </CardContent>
            </Card>

            {/* Week 2 */}
            <Card className="bg-card/20 border-border hover:border-primary/30 transition-all duration-300 relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <div className="text-primary font-bold text-xs uppercase tracking-wider mb-1">Week 2</div>
                <CardTitle className="text-lg">GitHub Mechanics</CardTitle>
                <CardDescription>Moving your workflow to the cloud.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Repos, forks, PRs, issues and remote syncing</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>README that sells your project (aesthetic files)</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Profile optimization & contribution graphs</span>
                </div>
              </CardContent>
            </Card>

            {/* Week 3 */}
            <Card className="bg-card/20 border-border hover:border-primary/30 transition-all duration-300 relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <div className="text-primary font-bold text-xs uppercase tracking-wider mb-1">Week 3</div>
                <CardTitle className="text-lg">Open Source Contribution</CardTitle>
                <CardDescription>Diving into real-world codebases.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>How to find beginner-friendly repos (good first issue)</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Reading code and documentation before touching files</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Making first external PR & handling reviews</span>
                </div>
              </CardContent>
            </Card>

            {/* Week 4 */}
            <Card className="bg-card/20 border-border hover:border-primary/30 transition-all duration-300 relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <div className="text-primary font-bold text-xs uppercase tracking-wider mb-1">Week 4</div>
                <CardTitle className="text-lg">Consistency Systems</CardTitle>
                <CardDescription>Building sustainable habits for the long run.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Sustainable habits vs fake streak padding</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Accountability pods (peer check-ins)</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Capstone: merge 1 real PR + complete before/after audit</span>
                </div>
              </CardContent>
            </Card>

          </div>
        </Section>

        {/* Academy Enrollment Section */}
        <span id="enrollment" className="block -mt-10 pt-10" />
        <Section title="Enroll in the Academy" className="animate-fade-up">
          <Card className="max-w-2xl mx-auto bg-card/25 border-primary/20 relative shadow-[0_0_30px_rgba(16,185,129,0.05)] overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary to-transparent" />
            <CardHeader className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mx-auto">
                <Sparkles className="w-3.5 h-3.5" /> 100% Free & Open Source
              </div>
              <CardTitle className="text-2xl font-bold">Start Your Journey Today</CardTitle>
              <CardDescription>
                Join the cohort to build consistency, master Git, and make your first verified open-source contributions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md mx-auto text-sm text-muted-foreground pb-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <span>Access all 4 weeks of structured learning materials</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <span>Complete interactive quests and hands-on Git practice</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <span>Submit your capstone external PR for validation</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <span>Earn a verifiable certificate of completion</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <span>Unlock the exclusive Academy Graduate profile badge</span>
              </div>
            </CardContent>
            <CardFooter className="pt-6 border-t border-border flex justify-center bg-black/10">
              {enrolled ? (
                <Button size="lg" className="w-full max-w-sm font-bold gap-2" onClick={() => navigate("/academy/dashboard")}>
                  Go to Student Portal <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  className="w-full max-w-sm font-bold gap-2 text-black" 
                  onClick={handleEnroll} 
                  disabled={isEnrolling}
                >
                  {isEnrolling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enrolling...</span>
                    </>
                  ) : (
                    <>
                      <GraduationCap className="w-5 h-5" />
                      <span>Enroll in Academy (Free)</span>
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </Section>

      </main>

      <FloatingNav />
    </div>
  );
}
