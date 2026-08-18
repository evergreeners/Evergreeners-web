import { AcademyHeader } from "@/components/AcademyHeader";
import { FloatingNav } from "@/components/FloatingNav";
import { Section } from "@/components/Section";
import { GraduationCap, BookOpen, Terminal, CheckCircle, ExternalLink, GitPullRequest, Trophy, MessageSquare, Disc, Award, ArrowRight, Loader2, Maximize2, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { getApiUrl } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  description: string;
  content: string;
  lab: string;
}

interface Week {
  number: number;
  title: string;
  lessons: Lesson[];
}

const syllabus: Week[] = [
  {
    number: 1,
    title: "Git Fundamentals",
    lessons: [
      {
        id: "1.1",
        title: "Why Git? (Understanding local repositories)",
        duration: "10:15",
        lab: "intro1",
        description: "An absolute zero-to-one guide to local version control.",
        content: `### Why local Git is your foundation

Git is not GitHub. Git is a local version control system that tracks the snapshots of your files. In this lesson, you will learn:
- How Git stores snapshots (not differences).
- The three stages of Git: **Working Directory**, **Staging Area**, and **Git Directory (Repository)**.
- Running \`git init\`, staging changes with \`git add\`, and creating history with \`git commit\`.
- Understanding the difference between unstaged, staged, and committed states.`
      },
      {
        id: "1.2",
        title: "Writing Commit Messages That Don't Suck",
        duration: "08:45",
        lab: "intro2",
        description: "The anatomy of professional commit logs.",
        content: `### Commit message engineering

Your Git history is your resume. Learn how to write conventional commit messages that communicate clear intent.
- Why \`git commit -m "fix"\` or \`git commit -m "added files"\` destroys readability and developer collaboration.
- **Conventional Commits** structure: \`type(scope): description\` (e.g. \`feat(auth): add Paystack callback endpoint\`).
- Writing descriptive 50-character subject lines and detailed bodies when making complex updates.`
      },
      {
        id: "1.3",
        title: "Undoing Mistakes: reset, revert, and reflog",
        duration: "12:30",
        lab: "rampup4",
        description: "How to fix errors without losing your hard work.",
        content: `### The safety nets of Git

Every developer makes mistakes. Git provides tools to safely step back in time.
- \`git reset --soft\`: Uncommit files but keep changes in your staging area.
- \`git reset --hard\`: Nuclear option. Wipe changes. Learn when (and when NOT) to use it.
- \`git revert [commit]\`: Create a new commit that undoes the changes of a previous one. Safe for public branches.
- \`git reflog\`: The master log of all actions. How to recover even deleted commits.`
      }
    ]
  },
  {
    number: 2,
    title: "GitHub Mechanics",
    lessons: [
      {
        id: "2.1",
        title: "Forks, Pull Requests, and Remote Syncing",
        duration: "11:00",
        lab: "remote1",
        description: "Collab mechanics: upstream vs origin.",
        content: `### Collaboration under the hood

Working with remote servers requires mastering forks and pull requests.
- **Upstream vs Origin**: Origin is your copy of the fork. Upstream is the source-of-truth repo.
- Synchronizing local forks with the upstream repository using command line: \`git remote add upstream [url]\` and \`git fetch upstream\`.
- Branching strategies: creating clean branches off the latest upstream updates before making PRs.`
      },
      {
        id: "2.2",
        title: "Portfolio READMEs that sell your work",
        duration: "09:15",
        lab: "remote4",
        description: "Designing landing pages for your repositories.",
        content: `### Writing README files that invite engagement

A repository without a clean README is a repository that doesn't exist to recruiters.
- Structuring your README: Title, description, quick start, installation, usage, and license.
- Using Markdown templates: including screenshots, badges, and tech stacks.
- Creating a personal Profile README: showcasing your developer identity on \`github.com/username/username\`.`
      },
      {
        id: "2.3",
        title: "Pinned Repositories & Digital Gardens",
        duration: "07:30",
        lab: "remote3",
        description: "Curating your public profile.",
        content: `### Curating your developer workspace

Do not pin half-finished projects. Curate your public profile like an art gallery.
- Selection criteria: Pinned repositories should represent your best work, and have clean READMEs and commit graphs.
- Maintaining active logs: keeping a digital garden of projects you actively nurture.`
      }
    ]
  },
  {
    number: 3,
    title: "Open Source Contribution",
    lessons: [
      {
        id: "3.1",
        title: "Finding Beginner-Friendly Issues",
        duration: "10:45",
        lab: "rampup2",
        description: "Locating repository entrance gates.",
        content: `### Navigating the open-source landscape

Where do you start? Finding the right issue is half the battle.
- Using GitHub search queries to locate beginner-friendly items: \`is:issue is:open label:"good first issue"\`.
- Highlighting Hacktoberfest tags, repository labels, and community boards.
- Reviewing issues to ensure active maintainers and helpful guidelines.`
      },
      {
        id: "3.2",
        title: "Reading a Codebase before editing",
        duration: "13:20",
        lab: "move1",
        description: "Familiarizing yourself with external architectures.",
        content: `### Becoming a codebase detective

Do not jump straight to editing. Read first.
- Locate the entry point: package.json, main script files, or routing sheets.
- Follow the imports: tracing how data flows between helper scripts and index files.
- Understanding test structures: reviewing existing tests to understand input/output expectations.`
      },
      {
        id: "3.3",
        title: "Handling Reviews and PR Feedback",
        duration: "08:15",
        lab: "move2",
        description: "Communicating with maintainers professionally.",
        content: `### The collaboration feedback loop

PR rejected? That is part of open source. Here is how to handle reviews.
- Best practices in communication: thank the maintainer, explain your solution, and don't take critiques personally.
- Re-triggering checks: making updates on your branch to automatically update the open PR.
- Staying active: what to do if a PR goes stale.`
      }
    ]
  },
  {
    number: 4,
    title: "Consistency Systems",
    lessons: [
      {
        id: "4.1",
        title: "Building Sustainable Habits (Habit Loops)",
        duration: "09:40",
        lab: "remoteAdvanced3",
        description: "Keeping coding routines sustainable.",
        content: `### Constructing consistency systems

Green contribution graphs are not built overnight. They are built through habit triggers.
- Understanding the Habit Loop: Cue, Craving, Response, and Reward.
- Integrating a coding slot: setting a daily 30-minute block that is non-negotiable.
- Setting goals: using Evergreeners goals feature to track streaks without pressure.`
      },
      {
        id: "4.2",
        title: "Accountability Pods & Communities",
        duration: "07:15",
        lab: "remoteAdvanced4",
        description: "Leaning on your peers for consistency.",
        content: `### Leveraging social proof

You do not have to walk this path alone. Accountability pods keep you on track.
- Accountability checks: Daily updates in your 4-5 person WhatsApp or Discord pods.
- Code reviews: Reviewing each other's code to stay on top of the learning materials.`
      },
      {
        id: "4.3",
        title: "Capstone PR Verification",
        duration: "11:50",
        lab: "remote5",
        description: "Unlocking graduation certificates.",
        content: `### Graduation and verification

Your final task is to merge one real contribution to any external GitHub repository.
- Contribution guidelines: Fix a bug, write documentation, or implement a minor feature on a repository you don't own.
- PR must be merged on GitHub.
- Submit the PR URL on this page to trigger verification and receive your graduation badge & cert!`
      }
    ]
  }
];

export default function AcademyDashboard() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeLesson, setActiveLesson] = useState<Lesson>(syllabus[0].lessons[0]);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  // Capstone PR verification state
  const [prUrl, setPrUrl] = useState("");
  const [isVerifyingPr, setIsVerifyingPr] = useState(false);

  // Fetch academy status
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

  // Load completed lessons from local storage
  useEffect(() => {
    if (session?.user?.id) {
      const saved = localStorage.getItem(`academy_completed_${session.user.id}`);
      if (saved) {
        setCompletedLessons(new Set(JSON.parse(saved)));
      }
    }
  }, [session?.user?.id]);

  // Protect route
  useEffect(() => {
    if (!isLoadingStatus && statusData && statusData.status === 'none') {
      toast.warning("You must enroll to access the student portal.");
      navigate("/academy");
    }
  }, [statusData, isLoadingStatus, navigate]);

  const handleMarkComplete = (lessonId: string, forceState?: boolean) => {
    if (isLessonLocked(lessonId)) return;
    setCompletedLessons(prev => {
      const next = new Set(prev);
      const targetState = forceState !== undefined ? forceState : !next.has(lessonId);
      
      if (targetState) {
        next.add(lessonId);
        toast.success("Lesson marked complete!", {
          description: `Great job on finishing lesson ${lessonId}.`
        });
      } else {
        next.delete(lessonId);
      }

      if (session?.user?.id) {
        localStorage.setItem(`academy_completed_${session.user.id}`, JSON.stringify(Array.from(next)));
      }
      return next;
    });
  };

  const handleVerifyPr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prUrl.trim()) return;

    setIsVerifyingPr(true);
    toast.info("Connecting to GitHub to verify pull request...");

    try {
      const res = await fetch(getApiUrl('/api/academy/submit-pr'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.session?.token ? { Authorization: `Bearer ${session.session.token}` } : {})
        },
        body: JSON.stringify({ prUrl }),
        credentials: "include"
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to verify pull request");
      }

      const data = await res.json();
      toast.success("PR Verified! Congratulations!", {
        description: "You have graduated from Evergreeners Academy!"
      });
      queryClient.invalidateQueries({ queryKey: ['academyStatus'] });
      // Redirect to verification view
      navigate(`/academy/verify/${data.certId}`);
    } catch (e: any) {
      toast.error(e.message || "Could not verify PR. Ensure it is merged and external.");
    } finally {
      setIsVerifyingPr(false);
    }
  };

  // Calculations
  const allLessons = syllabus.flatMap(w => w.lessons);
  const totalLessons = allLessons.length;
  const completionPercentage = Math.round((completedLessons.size / totalLessons) * 100);
  const labUrl = getApiUrl(`/learn-git-branching/?level=${activeLesson.lab}`);

  if (isLoadingStatus || !statusData || statusData.status === 'none') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground mt-2">Checking enrollment status...</span>
      </div>
    );
  }

  const isGraduated = statusData.status === 'graduated';

  // Daily lesson unlock — one new module per day since enrollment
  const daysSinceJoin = statusData.joinedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(statusData.joinedAt).getTime()) / 86400000))
    : 0;
  const unlockedCount = isGraduated ? totalLessons : Math.max(1, Math.min(totalLessons, daysSinceJoin + 1));
  const isLessonLocked = (lessonId: string) => {
    if (isGraduated) return false;
    const idx = allLessons.findIndex(l => l.id === lessonId);
    return idx === -1 || idx >= unlockedCount;
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden custom-scrollbar relative">
      <style>{`
        .cyber-background {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background-color: #050505;
          background-image:
            radial-gradient(circle at center, transparent 30%, #000 90%),
            linear-gradient(rgba(74, 222, 128, 0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(74, 222, 128, 0.07) 1px, transparent 1px),
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size:
            100% 100%,
            60px 60px,
            60px 60px,
            20px 20px,
            20px 20px;
          animation: cyber-move 20s linear infinite;
          z-index: 0;
          pointer-events: none;
        }

        @keyframes cyber-move {
          0%   { background-position: 0 0, 0 0, 0 0, 0 0, 0 0; }
          100% { background-position: 0 0, 60px 60px, 60px 60px, 40px 40px, 40px 40px; }
        }
      `}</style>

      <div className="cyber-background" />
      <AcademyHeader />

      <main className="w-full max-w-[1600px] mx-auto px-4 md:px-8 pt-24 pb-32 md:pb-12 space-y-8 relative z-10">
        
        {/* Top Header Card */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-wider">
              <GraduationCap className="w-4 h-4" /> Cohort Portal
            </div>
            <h2 className="text-2xl font-bold">Welcome back, {statusData.name || "Student"}!</h2>
            <p className="text-xs text-muted-foreground">
              Tier: <strong className="text-primary capitalize">{statusData.status}</strong> • Pod: 
              <a href="https://discord.gg/evergreeners" target="_blank" rel="noopener noreferrer" className="ml-1 text-primary hover:underline inline-flex items-center gap-0.5">
                <Disc className="w-3.5 h-3.5" /> Pod-Delta (Discord) <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </p>
          </div>

          <div className="w-full md:max-w-xs space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span>Syllabus Progress</span>
              <span>{completedLessons.size} / {totalLessons} Lessons ({completionPercentage}%)</span>
            </div>
            <Progress value={completionPercentage} className="h-2.5" />
            {!isGraduated && unlockedCount < totalLessons && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Lock className="w-3 h-3" /> {unlockedCount} of {totalLessons} unlocked — a new lesson unlocks daily.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar Curriculum Selector */}
          <div className="lg:col-span-4 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Curriculum Modules
            </h3>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {syllabus.map((week) => (
                <div key={week.number} className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                    Week {week.number} — {week.title}
                  </div>
                  
                  <div className="space-y-1">
                    {week.lessons.map((lesson) => {
                      const isActive = activeLesson.id === lesson.id;
                      const isComplete = completedLessons.has(lesson.id);
                      const locked = isLessonLocked(lesson.id);
                      const nextUnlock = !locked ? false : unlockedCount === allLessons.findIndex(l => l.id === lesson.id);
                      return (
                        <button
                          key={lesson.id}
                          disabled={locked}
                          onClick={() => setActiveLesson(lesson)}
                          className={`w-full text-left p-3 rounded-lg text-xs font-medium border transition-all flex items-center justify-between gap-3 ${
                            locked
                              ? "opacity-45 cursor-not-allowed bg-secondary/10 border-transparent text-muted-foreground"
                              : isActive
                              ? "bg-primary/10 border-primary/40 text-foreground"
                              : "bg-secondary/20 border-transparent text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {locked ? (
                              <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                            ) : isComplete ? (
                              <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                            ) : (
                              <Terminal className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                            <span className="truncate">{lesson.id} {lesson.title}</span>
                          </div>
                          <span className="text-[10px] shrink-0 font-mono text-muted-foreground">
                            {locked ? (nextUnlock ? "Unlocks next" : "Locked") : lesson.duration}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Capstone PR Card */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="p-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" /> Capstone Graduation
                </CardTitle>
                <CardDescription className="text-xs">
                  Merge one real PR to an external repo to unlock graduation & badge.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                {isGraduated ? (
                  <div className="space-y-3">
                    <div className="p-2.5 rounded-lg border border-primary/20 bg-primary/10 flex items-center gap-2 text-xs font-semibold text-primary">
                      <Award className="w-4 h-4" /> You are Graduated!
                    </div>
                    <Button 
                      className="w-full text-xs gap-1"
                      onClick={() => navigate(`/academy/verify/${statusData.certId}`)}
                    >
                      View Certificate <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyPr} className="space-y-3">
                    <Input 
                      placeholder="https://github.com/owner/repo/pull/1" 
                      value={prUrl}
                      onChange={(e) => setPrUrl(e.target.value)}
                      className="h-9 text-xs"
                      required
                    />
                    <Button type="submit" size="sm" className="w-full text-xs font-bold gap-2" disabled={isVerifyingPr}>
                      {isVerifyingPr ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying PR...
                        </>
                      ) : (
                        <>
                          <GitPullRequest className="w-3.5 h-3.5" /> Submit & Graduate
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Main Content Lesson Player */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Interactive Git Lab */}
            <div className="rounded-xl border border-primary/20 bg-black overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-zinc-900/60 border-b border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                  <Terminal className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-mono truncate">Lab {activeLesson.id} · {activeLesson.title}</span>
                </div>
                <a
                  href={labUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-[#5aff94] transition-colors shrink-0"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Fullscreen
                </a>
              </div>
              <iframe
                key={activeLesson.id}
                src={labUrl}
                title={`${activeLesson.id} — ${activeLesson.title}`}
                className="w-full aspect-video bg-[#0b0b0b]"
                loading="lazy"
              />
            </div>

            {/* Lesson Text Content */}
            <Section title={`Module Notes — ${activeLesson.title}`}>
              <div className="prose prose-sm dark:prose-invert max-w-none 
                prose-h3:text-lg prose-h3:font-bold prose-h3:text-foreground prose-h3:mt-4 prose-h3:mb-2
                prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:my-2
                prose-li:my-1 prose-li:text-muted-foreground
                prose-strong:text-foreground
                prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs">
                {/* Splitting content to render basic markdown structures */}
                {activeLesson.content.split('\n\n').map((block, i) => {
                  if (block.startsWith('###')) {
                    return <h3 key={i} className="text-lg font-bold text-foreground mt-4 mb-2">{block.replace('###', '').trim()}</h3>;
                  }
                  if (block.startsWith('-')) {
                    return (
                      <ul key={i} className="list-disc pl-5 my-2 text-muted-foreground space-y-1">
                        {block.split('\n').map((li, j) => (
                          <li key={j}>{li.replace('-', '').trim()}</li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={i} className="text-muted-foreground leading-relaxed my-2">{block}</p>;
                })}
              </div>

              {/* Mark Complete Checkbox */}
              <div className="mt-8 pt-6 border-t border-border flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm">Completed this lesson?</h4>
                  <p className="text-xs text-muted-foreground">Mark it finished to track your cohort stats.</p>
                </div>
                <Button
                  variant={completedLessons.has(activeLesson.id) ? "outline" : "default"}
                  className="font-semibold"
                  onClick={() => handleMarkComplete(activeLesson.id)}
                >
                  {completedLessons.has(activeLesson.id) ? "Mark Incomplete" : "Mark as Complete ✓"}
                </Button>
              </div>
            </Section>

          </div>

        </div>

      </main>

      <FloatingNav />
    </div>
  );
}
