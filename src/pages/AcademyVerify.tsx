import { Header } from "@/components/Header";
import { FloatingNav } from "@/components/FloatingNav";
import { Section } from "@/components/Section";
import { Award, ShieldCheck, Twitter, Download, ExternalLink, Calendar, GitPullRequest, ArrowRight, Loader2 } from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRef } from "react";

interface Certificate {
  certId: string;
  name: string;
  username: string;
  prUrl: string;
  date: string;
}

export default function AcademyVerify() {
  const { certId } = useParams<{ certId: string }>();
  const navigate = useNavigate();
  const certRef = useRef<HTMLDivElement>(null);

  // Fetch certificate details
  const { data: certData, isLoading, isError } = useQuery<{ success: boolean; certificate: Certificate }>({
    queryKey: ['certificate', certId],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/api/academy/certificate/${certId}`));
      if (!res.ok) throw new Error("Certificate not found");
      return res.json();
    },
    enabled: !!certId,
  });

  const downloadSvg = () => {
    if (!certData) return;
    const cert = certData.certificate;
    
    // Construct a downloadable SVG string dynamically
    const svgString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#000000" />
      <stop offset="50%" stop-color="#090a0f" />
      <stop offset="100%" stop-color="#040c08" />
    </linearGradient>
    <linearGradient id="border-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="50%" stop-color="#059669" />
      <stop offset="100%" stop-color="#34d399" />
    </linearGradient>
    <linearGradient id="text-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#a7f3d0" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="800" height="600" fill="url(#bg)" />
  
  <!-- Outer Glow Border -->
  <rect x="20" y="20" width="760" height="560" rx="20" fill="none" stroke="url(#border-grad)" stroke-width="3" opacity="0.8" />
  <rect x="30" y="30" width="740" height="540" rx="15" fill="none" stroke="#1f2937" stroke-width="1" />
  
  <!-- Grid background decoration -->
  <path d="M 40,40 L 40,140 M 40,40 L 140,40" stroke="#10b981" stroke-width="2" opacity="0.3" fill="none" />
  <path d="M 760,40 L 760,140 M 760,40 L 660,40" stroke="#10b981" stroke-width="2" opacity="0.3" fill="none" />
  <path d="M 40,560 L 40,460 M 40,560 L 140,560" stroke="#10b981" stroke-width="2" opacity="0.3" fill="none" />
  <path d="M 760,560 L 760,460 M 760,560 L 660,560" stroke="#10b981" stroke-width="2" opacity="0.3" fill="none" />

  <!-- Badge logo -->
  <circle cx="400" cy="110" r="45" fill="#111827" stroke="#10b981" stroke-width="2" />
  <path d="M 385,120 L 400,95 L 415,120 Z" fill="#10b981" />
  <circle cx="400" cy="115" r="8" fill="#10b981" />

  <!-- Header text -->
  <text x="400" y="200" font-family="'Courier New', monospace" font-size="12" fill="#10b981" font-weight="bold" letter-spacing="4" text-anchor="middle">EVERGREENERS ACADEMY</text>
  <text x="400" y="235" font-family="'Helvetica Neue', Arial, sans-serif" font-size="28" font-weight="900" fill="#ffffff" letter-spacing="2" text-anchor="middle">CERTIFICATE OF GRADUATION</text>
  
  <text x="400" y="285" font-family="'Georgia', serif" font-size="14" fill="#9ca3af" font-style="italic" text-anchor="middle">This is to certify that</text>
  
  <!-- Recipient Name -->
  <text x="400" y="340" font-family="'Helvetica Neue', Arial, sans-serif" font-size="36" font-weight="bold" fill="url(#text-grad)" text-anchor="middle">${cert.name}</text>
  
  <!-- Body text -->
  <text x="400" y="390" font-family="'Georgia', serif" font-size="14" fill="#9ca3af" text-anchor="middle">has successfully completed the intensive 4-week program on</text>
  <text x="400" y="415" font-family="'Georgia', serif" font-size="14" fill="#9ca3af" font-weight="bold" text-anchor="middle">Git, GitHub Mechanics, and Open Source Contribution</text>
  <text x="400" y="440" font-family="'Georgia', serif" font-size="12" fill="#6b7280" font-style="italic" text-anchor="middle">and verified their external capstone pull request contribution.</text>

  <!-- Divider line -->
  <line x1="250" y1="475" x2="550" y2="475" stroke="#1f2937" stroke-width="1" />

  <!-- Footer details -->
  <text x="150" y="515" font-family="monospace" font-size="10" fill="#4b5563">VERIFIED ID: ${cert.certId.substring(0, 18)}...</text>
  <text x="150" y="530" font-family="monospace" font-size="10" fill="#4b5563">DATE: ${new Date(cert.date).toLocaleDateString()}</text>

  <!-- Signature -->
  <text x="650" y="510" font-family="'Brush Script MT', cursive, Georgia" font-size="24" fill="#10b981" font-style="italic" text-anchor="end">Evergreener Lead</text>
  <line x1="500" y1="520" x2="650" y2="520" stroke="#4b5563" stroke-width="1" />
  <text x="650" y="535" font-family="'Helvetica Neue', sans-serif" font-size="8" fill="#4b5563" text-anchor="end">BOARD SIGNATURE</text>
</svg>
    `.trim();

    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `evergreeners_academy_cert_${cert.username}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Certificate downloaded successfully!");
  };

  const getTweetUrl = () => {
    if (!certData) return "";
    const cert = certData.certificate;
    const tweetText = `I just graduated from the @Evergreeners Academy! 🚀

I completed 4 weeks of Git, GitHub Mechanics, and successfully merged my external capstone pull request to prove it.

Verify my certificate here: ${window.location.href}

Stay evergreen. 🌲💻`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground mt-2">Fetching certificate records...</span>
      </div>
    );
  }

  if (isError || !certData?.certificate) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mb-4">
          <Award className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold">Certificate Not Found</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          The certificate ID provided does not match any graduation records in our database.
        </p>
        <Button className="mt-6" onClick={() => navigate("/academy")}>Go to Academy</Button>
      </div>
    );
  }

  const certificate = certData.certificate;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden custom-scrollbar">
      <Header />

      <main className="w-full max-w-5xl mx-auto px-4 md:px-8 pt-24 pb-32 md:pb-12 space-y-12">
        
        {/* Verification Success Tag */}
        <div className="flex flex-col items-center text-center space-y-3 animate-fade-in">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Securely Verified Certificate
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
            Academic Status: Verified
          </h1>
          <p className="text-xs text-muted-foreground max-w-md">
            This digital credential is authenticated on the Evergreeners network and proves real, verified git contribution.
          </p>
        </div>

        {/* Certificate Display Card */}
        <div className="animate-fade-up">
          <div 
            ref={certRef}
            className="w-full max-w-3xl mx-auto aspect-[4/3] rounded-2xl border border-primary/20 bg-card p-6 md:p-12 relative flex flex-col justify-between overflow-hidden shadow-2xl relative"
          >
            {/* Grid Pattern BG */}
            <div className="absolute inset-0 bg-grid-small opacity-10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            
            {/* Border Corners */}
            <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-primary/40 rounded-tl-lg pointer-events-none" />
            <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-primary/40 rounded-tr-lg pointer-events-none" />
            <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-primary/40 rounded-bl-lg pointer-events-none" />
            <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-primary/40 rounded-br-lg pointer-events-none" />

            {/* Cert Header */}
            <div className="text-center space-y-3 relative">
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border border-primary bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <Award className="w-6 h-6" />
                </div>
              </div>
              <div className="text-[10px] font-mono text-primary font-bold tracking-[0.3em] uppercase">Evergreeners Academy</div>
              <h2 className="text-xl md:text-3xl font-black text-foreground tracking-wide leading-none">CERTIFICATE OF GRADUATION</h2>
            </div>

            {/* Cert Body */}
            <div className="text-center space-y-4 my-6 relative">
              <p className="text-xs md:text-sm text-muted-foreground italic">This is to certify that</p>
              <h3 className="text-2xl md:text-4xl font-extrabold text-gradient">{certificate.name}</h3>
              <p className="text-xs md:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                has successfully completed the intensive 4-week program on <strong className="text-foreground">Git, GitHub Mechanics, and Open Source Contribution</strong>, and verified their external capstone pull request.
              </p>
            </div>

            {/* Cert Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-end gap-6 border-t border-border/60 pt-6 relative text-left">
              <div className="space-y-1 text-[10px] font-mono text-muted-foreground">
                <div>VERIFIED CREDENTIAL: {certificate.certId}</div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> GRADUATION DATE: {new Date(certificate.date).toLocaleDateString()}
                </div>
                {certificate.prUrl && (
                  <div className="flex items-center gap-1">
                    <GitPullRequest className="w-3.5 h-3.5 text-primary" /> CAPSTONE PR: 
                    <a href={certificate.prUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[200px]">
                      {certificate.prUrl.replace("https://github.com/", "")}
                    </a>
                  </div>
                )}
              </div>

              <div className="text-right space-y-1">
                <span className="font-mono text-xs font-semibold italic text-primary">Evergreeners Board</span>
                <div className="h-[1px] w-36 bg-muted-foreground/30 mt-2" />
                <span className="text-[8px] uppercase tracking-wider text-muted-foreground block">Board Signature</span>
              </div>
            </div>

          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap justify-center gap-4 animate-fade-up">
          <a href={getTweetUrl()} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="gap-2 font-bold px-8 bg-sky-500 hover:bg-sky-600 text-white border-none shadow-[0_0_15px_rgba(14,165,233,0.2)]">
              <Twitter className="w-5 h-5 fill-current" /> Share to X (Twitter)
            </Button>
          </a>
          <Button size="lg" variant="outline" onClick={downloadSvg} className="gap-2 font-bold px-8">
            <Download className="w-5 h-5" /> Download SVG
          </Button>
        </div>

        {/* Growth Loop Call-to-action */}
        <Section title="Ready to Stay Evergreen?" className="animate-fade-up text-center border-t border-border pt-12 max-w-2xl mx-auto space-y-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Evergreeners Academy teaches you version control, Git mechanics, and how to successfully find, read, and merge pull requests into external, production-ready codebases. Start building your consistency today.
          </p>
          <div className="pt-2">
            <Link to="/academy">
              <Button size="lg" className="font-bold gap-2">
                Join the Next Cohort <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Section>

      </main>

      <FloatingNav />
    </div>
  );
}
