import { AcademyHeader } from "@/components/AcademyHeader";
import { FloatingNav } from "@/components/FloatingNav";
import { Section } from "@/components/Section";
import { GraduationCap, Terminal, Zap, CheckCircle2, AlertTriangle, ShieldCheck, GitFork, ArrowRight, Loader2, Play, Sparkles, Github, Code, BookOpen, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { getApiUrl } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { getAcademyTimeLeft, isAcademyLaunchOpen, ACADEMY_LAUNCH_DATE_LABEL } from "@/lib/academy-launch";

interface AuditResult {
  score: number;
  profileReadmeExists: boolean;
  graveyardIndex: number;
  pinnedReposCount: number;
  feedback: string[];
}

interface CurriculumCardProps {
  week: string;
  title: string;
  subtitle: string;
  focusTitle: string;
  focusDesc: string;
  topicsTitle: string;
  topicsList: string[];
  icon: React.ReactNode;
}

const CurriculumCard: React.FC<CurriculumCardProps> = ({
  week,
  title,
  subtitle,
  focusTitle,
  focusDesc,
  topicsTitle,
  topicsList,
  icon
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isHovered) {
      setActiveSlide(0);
      return;
    }

    // Slide to the next slide (Focus) immediately on hover
    setActiveSlide(1);

    // Cycle through slides every 2.5 seconds
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 2500);

    return () => clearInterval(interval);
  }, [isHovered]);

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveSlide(index);
  };

  return (
    <div 
      className="curriculum-card group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="carousel-content"
        style={{ 
          transform: `translateX(-${activeSlide * 33.333}%)`,
          transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)'
        }}
      >
        {/* Slide 1: Week & Title */}
        <div className="carousel-slide space-y-3">
          {icon}
          <div className="text-primary font-bold text-xs uppercase tracking-wider">{week}</div>
          <h3 className="text-2xl font-extrabold text-foreground text-center">{title}</h3>
          <p className="text-xs text-muted-foreground text-center px-4">{subtitle}</p>
        </div>

        {/* Slide 2: Focus */}
        <div className="carousel-slide space-y-2">
          <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-extrabold mb-1">{focusTitle}</div>
          <p className="text-sm font-medium text-foreground/90 text-center leading-relaxed">
            {focusDesc}
          </p>
        </div>

        {/* Slide 3: Topics */}
        <div className="carousel-slide space-y-2.5">
          <div className="text-[10px] text-primary uppercase tracking-widest font-extrabold">{topicsTitle}</div>
          <div className="text-xs text-muted-foreground space-y-1.5 text-center font-medium leading-normal">
            {topicsList.map((item, idx) => (
              <div key={idx}>{item}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20 pointer-events-auto">
        {[0, 1, 2].map((index) => (
          <button
            key={index}
            onClick={(e) => handleDotClick(e, index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              activeSlide === index 
                ? "bg-primary w-4 shadow-[0_0_8px_rgba(74,222,128,0.5)]" 
                : "bg-white/20 hover:bg-white/40"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

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
  const [timeLeft, setTimeLeft] = useState(getAcademyTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getAcademyTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const academyOpen = isAcademyLaunchOpen();

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
    if (!isAcademyLaunchOpen()) {
      toast.error(`The Academy opens on ${ACADEMY_LAUNCH_DATE_LABEL}. Check back then to enroll.`);
      return;
    }
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
        body: "{}",
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
    <div className="min-h-screen bg-background overflow-x-hidden custom-scrollbar relative">
      {/* Viewport Corner Tech Lines */}
      <div className="fixed top-6 left-6 w-6 h-6 border-t-2 border-l-2 border-primary z-50 pointer-events-none" />
      <div className="fixed top-6 right-6 w-6 h-6 border-t-2 border-r-2 border-primary z-50 pointer-events-none" />
      <div className="fixed bottom-6 left-6 w-6 h-6 border-b-2 border-l-2 border-primary z-50 pointer-events-none" />
      <div className="fixed bottom-6 right-6 w-6 h-6 border-b-2 border-r-2 border-primary z-50 pointer-events-none" />

      {/* SVG Filters for hand-drawn cosmic buttons */}
      <svg height="0" width="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <filter id="handDrawnNoise">
          <feTurbulence result="noise" numOctaves="8" baseFrequency="0.1" type="fractalNoise" />
          <feDisplacementMap yChannelSelector="G" xChannelSelector="R" scale="3" in2="noise" in="SourceGraphic" />
        </filter>
        <filter id="handDrawnNoise2">
          <feTurbulence result="noise" numOctaves="8" baseFrequency="0.1" seed="1010" type="fractalNoise" />
          <feDisplacementMap yChannelSelector="G" xChannelSelector="R" scale="3" in2="noise" in="SourceGraphic" />
        </filter>
      </svg>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap');

        .font-handwritten {
          font-family: 'Caveat', cursive;
          font-size: 1.1em;
          font-weight: 700;
          display: inline-block;
          transform: rotate(-1.5deg);
        }

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

        .academy-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background-color: rgba(5, 5, 5, 0.85);
          backdrop-filter: blur(8px);
          filter: url(#handDrawnNoise);
          font-family: "Courier New", monospace;
          font-size: 1rem;
          font-weight: bold;
          padding: 0.85rem 1.8rem;
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          border-radius: 2rem;
          box-shadow: #33333366 4px 4px 0 1px;
          animation: community-btn-idle 1s infinite ease-in-out;
          color: white;
          cursor: pointer;
          text-decoration: none;
          transition: 0.3s ease-in-out;
          position: relative;
        }

        @keyframes community-btn-idle {
          0%   { filter: url(#handDrawnNoise); }
          50%  { rotate: 1.5deg; filter: url(#handDrawnNoise2); }
          100% { filter: url(#handDrawnNoise); }
        }

        .academy-action-btn:hover {
          rotate: -2deg;
          border-color: rgba(74, 222, 128, 0.5);
          color: #4ade80;
          animation: community-btn-hover 2.5s infinite ease-in-out;
        }

        @keyframes community-btn-hover {
          0%   { rotate: 0deg;    filter: url(#handDrawnNoise);  translate: 0 0;   }
          25%  { rotate: -1deg;   filter: url(#handDrawnNoise2); translate: 0 -2px; }
          50%  { rotate: 0deg;    filter: url(#handDrawnNoise);  translate: 0 2px; }
          75%  { rotate: -1deg;   filter: url(#handDrawnNoise2); translate: 0 -2px; }
          100% { rotate: 0deg;    filter: url(#handDrawnNoise);  translate: 0 0;   }
        }

        .curriculum-card {
          width: 100%;
          height: 300px;
          background: rgba(10, 18, 10, 0.7);
          backdrop-filter: blur(12px);
          overflow: hidden;
          border-radius: 20px;
          border: 1.5px solid rgba(74, 222, 128, 0.15);
          box-shadow:
            inset 0px 56px 40px rgba(0, 0, 0, 0.8),
            inset 0px -56px 40px rgba(74, 222, 128, 0.08),
            1px 1px 2px rgba(255, 255, 255, 0.08),
            -1px -1px 2px rgba(0, 0, 0, 0.6);
          transition: all 0.35s ease-in-out;
          position: relative;
        }

        .curriculum-card:hover {
          border-color: rgba(74, 222, 128, 0.45);
          box-shadow:
            inset 0px 56px 40px rgba(0, 0, 0, 0.7),
            inset 0px -56px 40px rgba(74, 222, 128, 0.15),
            1px 1px 3px rgba(255, 255, 255, 0.15),
            -1px -1px 2px rgba(0, 0, 0, 0.5),
            0 0 20px rgba(74, 222, 128, 0.12);
          transform: translateY(-4px);
        }

        .carousel-content {
          position: relative;
          display: flex;
          width: 300%;
          height: 100%;
        }

        .carousel-slide {
          width: 33.333%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          flex-shrink: 0;
          padding: 2.2rem 1.8rem 3.8rem 1.8rem;
          box-sizing: border-box;
        }

        .enroll-outer {
          width: 100%;
          max-width: 42rem;
          min-height: 480px;
          border-radius: 12px;
          padding: 1px;
          background: radial-gradient(circle 280px at 0% 0%, rgba(255, 255, 255, 0.4), #0c0d0d);
          position: relative;
          overflow: hidden;
          margin: 0 auto;
        }

        .enroll-dot {
          width: 6px;
          aspect-ratio: 1;
          position: absolute;
          background-color: #4ade80;
          box-shadow: 0 0 10px #4ade80, 0 0 20px #4ade80;
          border-radius: 100px;
          z-index: 1;
          top: 10%;
          left: 10%;
          transform: translate(-50%, -50%);
          animation: moveDot 8s linear infinite;
        }

        @keyframes moveDot {
          0%,
          100% {
            top: 10%;
            left: 10%;
          }
          25% {
            top: 10%;
            left: 90%;
          }
          50% {
            top: 90%;
            left: 90%;
          }
          75% {
            top: 90%;
            left: 10%;
          }
        }

        .enroll-card {
          z-index: 1;
          width: 100%;
          height: 100%;
          border-radius: 11px;
          border: solid 1px #202222;
          background: radial-gradient(circle 450px at 0% 0%, #1c1d1d, #050505);
          display: flex;
          align-items: center;
          position: relative;
          flex-direction: column;
          color: #fff;
          padding: 3rem 2rem;
        }

        .enroll-ray {
          width: 320px;
          height: 60px;
          border-radius: 100px;
          position: absolute;
          background-color: rgba(74, 222, 128, 0.15);
          opacity: 0.4;
          box-shadow: 0 0 60px rgba(74, 222, 128, 0.4);
          filter: blur(15px);
          transform-origin: 10%;
          top: 0%;
          left: 0;
          transform: rotate(40deg);
          pointer-events: none;
        }

        .enroll-line {
          width: 100%;
          height: 1px;
          position: absolute;
          background-color: rgba(255, 255, 255, 0.05);
          pointer-events: none;
          z-index: 1;
        }
        
        .enroll-topl {
          top: 10%;
          background: linear-gradient(90deg, rgba(74, 222, 128, 0.3) 30%, rgba(255, 255, 255, 0.03) 70%);
        }
        
        .enroll-bottoml {
          bottom: 10%;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.03) 30%, rgba(74, 222, 128, 0.1) 70%);
        }
        
        .enroll-leftl {
          left: 10%;
          width: 1px;
          height: 100%;
          background: linear-gradient(180deg, rgba(74, 222, 128, 0.3) 30%, rgba(255, 255, 255, 0.03) 70%);
        }
        
        .enroll-rightl {
          right: 10%;
          width: 1px;
          height: 100%;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.03) 30%, rgba(74, 222, 128, 0.1) 70%);
        }
      `}</style>

      <div className="cyber-background" />
      <AcademyHeader />

      <main className="w-full max-w-[1400px] mx-auto px-4 md:px-8 pt-24 pb-32 md:pb-12 space-y-16 relative z-10">
        
        {/* Hero Section */}
        <section className="text-center py-12 space-y-6 animate-fade-in relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" /> The Evergreeners Academy
          </div>
          <h1 className="text-4xl md:text-7xl font-extrabold text-foreground tracking-tight leading-none">
            Convert Philosophy Into <span className="text-primary font-handwritten tracking-normal">Taught Skill</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            From Git zero to public repository hero. A highly focused 4-week syllabus designed to build verifiable GitHub credibility and launch your open-source journey.
          </p>
          <div className="flex flex-wrap justify-center gap-6 pt-4 relative z-10">
            {enrolled ? (
              <Link to="/academy/dashboard" className="academy-action-btn">
                <span>Go to Student Portal</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <a href="#enrollment" className="academy-action-btn">
                <span>Join Academy</span>
                <ArrowRight className="w-5 h-5" />
              </a>
            )}
            <a href="#audit" className="academy-action-btn">
              <span>Audit Your Profile</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Week 1 */}
            <CurriculumCard
              week="Week 1"
              title="Git Fundamentals"
              subtitle="Mastering the local repository workflow."
              focusTitle="Syllabus Focus"
              focusDesc="Start from Git zero. Learn how Git stores snapshots and moves you through working directory, staging area, and committed history — then master the safety nets for undoing mistakes."
              topicsTitle="Core Competencies"
              topicsList={[
                "• Interactive Lab: commits, branching & rebase (intro)",
                "• git init, add, commit — the three stages of Git",
                "• Undoing mistakes: reset, revert, and reflog"
              ]}
              icon={<Terminal className="w-12 h-12 text-primary" />}
            />

            {/* Week 2 */}
            <CurriculumCard
              week="Week 2"
              title="GitHub Mechanics"
              subtitle="Moving your local workflow to the cloud."
              focusTitle="Syllabus Focus"
              focusDesc="Take your local workflow to the cloud. Understand forks, upstream tracking, and pull requests, and learn to synchronize remote changes without losing history — then curate a portfolio that sells your work."
              topicsTitle="Core Competencies"
              topicsList={[
                "• Interactive Lab: clone, fetch & pull (remote)",
                "• Forks, upstream vs origin, and PR collaboration",
                "• Portfolio READMEs, pinned repos & digital gardens"
              ]}
              icon={<Github className="w-12 h-12 text-primary" />}
            />

            {/* Week 3 */}
            <CurriculumCard
              week="Week 3"
              title="Open Source"
              subtitle="Diving into real-world codebases."
              focusTitle="Syllabus Focus"
              focusDesc="Step beyond your personal projects. Learn to navigate unfamiliar codebases, locate beginner-friendly issues, and communicate cleanly with maintainers through the PR review loop."
              topicsTitle="Core Competencies"
              topicsList={[
                "• Interactive Lab: relative refs & cherry-pick (rampup/move)",
                "• Reading a codebase: entry points, imports, and tests",
                "• Handling reviews with interactive rebase & PR hygiene"
              ]}
              icon={<Code className="w-12 h-12 text-primary" />}
            />

            {/* Week 4 */}
            <CurriculumCard
              week="Week 4"
              title="Consistency Systems"
              subtitle="Building sustainable habits for the long run."
              focusTitle="Syllabus Focus"
              focusDesc="Build a long-term contribution rhythm that outlasts motivation. Set habit loops, lean on accountability pods, and finish with a real, verifiable commit to an external repository."
              topicsTitle="Core Competencies"
              topicsList={[
                "• Interactive Lab: tracking & remote arguments (advanced)",
                "• Sustainable habit loops and accountability pods",
                "• Capstone PR submission, validation check, and graduation"
              ]}
              icon={<GraduationCap className="w-12 h-12 text-primary" />}
            />

          </div>
        </Section>

        {/* Academy Enrollment Section */}
        <span id="enrollment" className="block -mt-10 pt-10" />
        <Section title="Enroll in the Academy" className="animate-fade-up">
          <div className="enroll-outer">
            <div className="enroll-card">
              <div className="enroll-dot" />
              <div className="enroll-ray" />
              
              <div className="enroll-line enroll-topl" />
              <div className="enroll-line enroll-leftl" />
              <div className="enroll-line enroll-bottoml" />
              <div className="enroll-line enroll-rightl" />

              <div className="relative z-10 flex flex-col items-center text-center space-y-4 w-full">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-[#161717] text-primary text-xs font-bold uppercase tracking-wider mx-auto relative z-20">
                  100% Free & Open Source
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Start Your Journey Today</h3>
                <p className="text-sm text-muted-foreground/80 max-w-lg mx-auto">
                  Join the cohort to build consistency, master Git, and make your first verified open-source contributions.
                </p>

                <div className="space-y-3 max-w-md mx-auto text-sm text-muted-foreground/90 pb-6 text-left">
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
                </div>

                {/* Countdown to Aug 31 launch */}
                {!academyOpen && (
                  <div className="flex gap-3 md:gap-4 justify-center my-6 z-10">
                    <div className="flex flex-col items-center bg-black/50 border border-white/5 px-3.5 py-1.5 rounded-xl min-w-[65px]">
                      <span className="text-2xl font-extrabold text-primary font-mono">{String(timeLeft.days).padStart(2, '0')}</span>
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Days</span>
                    </div>
                    <div className="flex flex-col items-center bg-black/50 border border-white/5 px-3.5 py-1.5 rounded-xl min-w-[65px]">
                      <span className="text-2xl font-extrabold text-primary font-mono">{String(timeLeft.hours).padStart(2, '0')}</span>
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Hours</span>
                    </div>
                    <div className="flex flex-col items-center bg-black/50 border border-white/5 px-3.5 py-1.5 rounded-xl min-w-[65px]">
                      <span className="text-2xl font-extrabold text-primary font-mono">{String(timeLeft.minutes).padStart(2, '0')}</span>
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Mins</span>
                    </div>
                    <div className="flex flex-col items-center bg-black/50 border border-white/5 px-3.5 py-1.5 rounded-xl min-w-[65px]">
                      <span className="text-2xl font-extrabold text-primary font-mono">{String(timeLeft.seconds).padStart(2, '0')}</span>
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Secs</span>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-center w-full relative z-20">
                  {enrolled ? (
                    <Link to="/academy/dashboard" className="academy-action-btn">
                      <span>Go to Student Portal</span>
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  ) : academyOpen ? (
                    <button
                      onClick={handleEnroll}
                      disabled={isEnrolling}
                      className="academy-action-btn"
                    >
                      <span>{isEnrolling ? "Enrolling..." : "Join Now"}</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      disabled
                      className="academy-action-btn opacity-60 cursor-not-allowed border-primary/30 text-primary hover:text-primary active:scale-100 hover:scale-100 rotate-0 hover:rotate-0"
                      style={{ animation: 'none', backgroundColor: '#0c0d0d' }}
                    >
                      <span>Opens {ACADEMY_LAUNCH_DATE_LABEL}</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Section>

      </main>

      <FloatingNav />
    </div>
  );
}
