import { Header } from "@/components/Header";
import { FloatingNav } from "@/components/FloatingNav";
import { Section } from "@/components/Section";
import { ActivityGrid } from "@/components/ActivityGrid";
import { 
  Github, MapPin, Calendar, Link as LinkIcon, 
  Edit2, Share2, Check, Copy, Trophy, Flame, Target, GitCommit,
  Eye, EyeOff, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const activityData = Array.from({ length: 84 }, () => 
  Math.random() > 0.3 ? Math.floor(Math.random() * 5) : 0
);

const achievements = [
  { name: "Early Adopter", icon: "🌱", earned: true },
  { name: "30-Day Streak", icon: "🔥", earned: true },
  { name: "60-Day Streak", icon: "⚡", earned: true },
  { name: "100-Day Streak", icon: "💎", earned: false },
  { name: "Top 10", icon: "🏆", earned: false },
  { name: "Contributor", icon: "🤝", earned: true },
];

const stats = [
  { label: "Current Streak", value: "47", icon: Flame },
  { label: "Total Commits", value: "2.8k", icon: GitCommit },
  { label: "Goals Hit", value: "12", icon: Target },
  { label: "Best Rank", value: "#24", icon: Trophy },
];

export default function Profile() {
  const navigate = useNavigate();
  const [isPublic, setIsPublic] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState({
    name: "Alex Developer",
    username: "alexdev",
    bio: "Full-stack developer passionate about open source and building tools.",
    location: "San Francisco, CA",
    website: "https://alexdev.io",
    joinDate: "Joined March 2024",
  });
  const [editedProfile, setEditedProfile] = useState(profile);

  const publicUrl = `evergreeners.dev/${profile.username}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${publicUrl}`);
    setCopied(true);
    toast.success("Profile link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = () => {
    setProfile(editedProfile);
    setIsEditing(false);
    toast.success("Profile updated!");
  };

  return (
    <div className="min-h-screen bg-background custom-scrollbar">
      <Header />
      
      <main className="container pt-24 pb-32 space-y-8">
        {/* Profile Header */}
        <section className="animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-secondary border border-border overflow-hidden">
                <img
                  src="https://avatars.githubusercontent.com/u/1?v=4"
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button 
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{profile.name}</h1>
                  <p className="text-muted-foreground">@{profile.username}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogTrigger asChild>
                      <button className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="bg-background border-border">
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <label className="text-sm text-muted-foreground">Display Name</label>
                          <input
                            type="text"
                            value={editedProfile.name}
                            onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                            className="w-full mt-2 p-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Bio</label>
                          <textarea
                            value={editedProfile.bio}
                            onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                            className="w-full mt-2 p-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors resize-none h-24"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Location</label>
                          <input
                            type="text"
                            value={editedProfile.location}
                            onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                            className="w-full mt-2 p-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Website</label>
                          <input
                            type="url"
                            value={editedProfile.website}
                            onChange={(e) => setEditedProfile({ ...editedProfile, website: e.target.value })}
                            className="w-full mt-2 p-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                          />
                        </div>
                        <Button
                          onClick={handleSaveProfile}
                          className="w-full bg-primary hover:bg-primary/90"
                        >
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <button 
                    className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors"
                    onClick={handleCopyLink}
                  >
                    {copied ? <Check className="w-4 h-4 text-primary" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-3 max-w-md">{profile.bio}</p>

              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {profile.location}
                </span>
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                  <LinkIcon className="w-4 h-4" /> {profile.website.replace("https://", "")}
                </a>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> {profile.joinDate}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <Section className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div 
                key={stat.label}
                className="p-4 rounded-xl border border-border bg-secondary/30 text-center hover:bg-secondary/50 transition-all duration-300"
              >
                <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Visibility Toggle */}
        <Section className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/30">
            <div className="flex items-center gap-3">
              {isPublic ? <Eye className="w-5 h-5 text-primary" /> : <EyeOff className="w-5 h-5 text-muted-foreground" />}
              <div>
                <p className="font-medium">Public Profile</p>
                <p className="text-sm text-muted-foreground">
                  {isPublic ? `Visible at ${publicUrl}` : "Only you can see your profile"}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsPublic(!isPublic);
                toast.success(isPublic ? "Profile is now private" : "Profile is now public");
              }}
              className={cn(
                "w-12 h-6 rounded-full p-1 transition-colors duration-300",
                isPublic ? "bg-primary" : "bg-secondary"
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded-full bg-white transition-transform duration-300",
                isPublic ? "translate-x-6" : "translate-x-0"
              )} />
            </button>
          </div>
        </Section>

        {/* GitHub Connection */}
        <Section className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between p-4 rounded-xl border border-primary/30 bg-primary/10">
            <div className="flex items-center gap-3">
              <Github className="w-6 h-6 text-primary" />
              <div>
                <p className="font-medium">GitHub Connected</p>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              </div>
            </div>
            <a 
              href={`https://github.com/${profile.username}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-xl hover:bg-primary/20 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-primary" />
            </a>
          </div>
        </Section>

        {/* Activity Grid */}
        <Section title="Recent Activity" className="animate-fade-up" style={{ animationDelay: "0.25s" }}>
          <ActivityGrid data={activityData} />
          <div className="flex items-center justify-end gap-2 mt-3">
            <span className="text-xs text-muted-foreground">Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`w-3 h-3 rounded-sm ${
                    level === 0 ? "bg-secondary" :
                    level === 1 ? "bg-primary/25" :
                    level === 2 ? "bg-primary/50" :
                    level === 3 ? "bg-primary/75" :
                    "bg-primary"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">More</span>
          </div>
        </Section>

        {/* Achievements */}
        <Section title="Achievements" className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {achievements.map((achievement) => (
              <div 
                key={achievement.name}
                className={cn(
                  "flex flex-col items-center p-3 rounded-xl border transition-all duration-300 cursor-default",
                  achievement.earned 
                    ? "border-primary/30 bg-primary/10" 
                    : "border-border bg-secondary/30 opacity-50"
                )}
              >
                <span className="text-2xl mb-1">{achievement.icon}</span>
                <span className="text-[10px] text-center text-muted-foreground">{achievement.name}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Quick Actions */}
        <Section title="Quick Actions" className="animate-fade-up" style={{ animationDelay: "0.35s" }}>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => navigate('/settings')}
              className="p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-all duration-300 text-left"
            >
              <p className="font-medium">Settings</p>
              <p className="text-xs text-muted-foreground mt-1">Manage your account</p>
            </button>
            <button 
              onClick={() => navigate('/leaderboard')}
              className="p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-all duration-300 text-left"
            >
              <p className="font-medium">Leaderboard</p>
              <p className="text-xs text-muted-foreground mt-1">See how you rank</p>
            </button>
          </div>
        </Section>
      </main>

      <FloatingNav />
    </div>
  );
}
