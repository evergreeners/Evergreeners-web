import { Header } from "@/components/Header";
import { FloatingNav } from "@/components/FloatingNav";
import { Section } from "@/components/Section";
import { GoalProgress } from "@/components/GoalProgress";
import {
  Target, Plus, Edit2, Trash2, Check, Calendar,
  Flame, GitCommit, BookOpen, Trophy, Clock, Info
} from "lucide-react";
import { triggerHaptic } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, Eye } from "lucide-react";
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

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getEndDay = (startDay: string, target: number) => {
  const startIndex = daysOfWeek.indexOf(startDay);
  const endIndex = Math.min(startIndex + target - 1, 6);
  return daysOfWeek[endIndex];
};

interface Goal {
  id: number;
  title: string;
  type: string;
  current: number;
  target: number;
  icon?: React.ElementType; // Optional as it's computed
  dueDate?: string;
  completed?: boolean;
}

const goalTemplates = [
  { type: "streak", title: "Maintain streak", icon: Flame, defaultTarget: 30, description: "Track consecutive days of GitHub contributions" },
  { type: "commits", title: "Weekly commits", icon: GitCommit, defaultTarget: 20, description: "Count commits made in the last 7 days (rolling window)" },
  { type: "days", title: "Code X days/week", icon: Calendar, defaultTarget: 5, description: "Track active coding days in the current week (Mon-Sun)" },
  { type: "projects", title: "Contribute to repos", icon: BookOpen, defaultTarget: 3, description: "Number of repositories you've contributed to" },
];

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newGoalType, setNewGoalType] = useState<string | null>(null);
  const [newGoalTarget, setNewGoalTarget] = useState(30);
  const [newGoalStartDay, setNewGoalStartDay] = useState("Monday");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const { data: session } = authClient.useSession();
  const [projectsData, setProjectsData] = useState<any[]>([]);
  const [repoDetailsOpen, setRepoDetailsOpen] = useState(false);
  const isMobile = useIsMobile();

  const fetchGoals = async () => {
    try {
      const res = await fetch(`${API_URL}/api/goals`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        // Include credentials if handling cookies manually, 
        // strictly speaking better-auth usually handles this via its client or standard inputs
        // but for manual fetch we rely on browser calling correct domain or proxy.
        // If API is on different port, we need credentials include.
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setGoals(data.goals.map((g: any) => ({
            ...g,
            icon: goalTemplates.find(t => t.type === g.type)?.icon || Trophy
          })));
          // Cache goals for fast reload
          localStorage.setItem('cached_goals', JSON.stringify(data.goals));
        } else {
          console.error("Received non-JSON response from server:", await res.text());
          throw new Error("Received non-JSON response from server. Check API URL.");
        }
      }
    } catch (error) {
      console.error("Failed to fetch goals", error);
      toast.error("Failed to load goals");
    } finally {
      setIsLoading(false);
    }
  };



  // Load cached goals on mount to prevent empty flash
  useEffect(() => {
    const cached = localStorage.getItem('cached_goals');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setGoals(parsed.map((g: any) => ({
          ...g,
          icon: goalTemplates.find(t => t.type === g.type)?.icon || Trophy
        })));
        setIsLoading(false); // We have meaningful data to show
      } catch (e) {
        // ignore invalid cache
      }
    }
  }, []); // Run once on mount

  useEffect(() => {
    if (session) {
      fetchGoals();

      // Background sync GitHub data
      fetch(`${API_URL}/api/user/sync-github`, { method: "POST", credentials: "include" })
        .catch(console.error);

      // Fetch user profile for projects data
      fetch(`${API_URL}/api/user/profile`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          if (data.user?.projectsData) setProjectsData(data.user.projectsData);
        })
        .catch(err => console.error(err));
    }
  }, [session]);

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  const addGoal = async (template: typeof goalTemplates[0]) => {
    setIsCreatingGoal(true);
    try {
      const res = await fetch(`${API_URL}/api/goals`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: template.type === 'days'
            ? `Code ${newGoalTarget} days (${newGoalStartDay}-${getEndDay(newGoalStartDay, newGoalTarget)})`
            : `${template.title} (${newGoalTarget})`,
          type: template.type,
          target: newGoalTarget,
          current: 0,
          dueDate: template.type === 'days' ? newGoalStartDay : (template.type === 'commits' ? 'Sunday' : undefined)
        })
      });

      if (!res.ok) throw new Error("Failed to create goal");

      const data = await res.json();
      const newGoal = {
        ...data.goal,
        icon: template.icon
      };

      setNewGoalType(null);
      setNewGoalTarget(30);
      toast.success("Goal created!");

      // Refresh list to ensure we get correct completed status and synced data
      fetchGoals();

    } catch (error) {
      console.error(error);
      toast.error("Failed to create goal");
    } finally {
      setIsCreatingGoal(false);
    }
  };

  const deleteGoal = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/api/goals/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!res.ok) throw new Error("Failed to delete goal");

      setGoals(goals.filter(g => g.id !== id));
      toast.success("Goal deleted");
    } catch (error) {
      toast.error("Failed to delete goal");
    }
  };

  const updateGoalTarget = async (id: number, newTarget: number) => {
    setIsSavingGoal(true);
    try {
      // Find existing to get title prefix
      const goal = goals.find(g => g.id === id);
      const newTitle = goal ? goal.title.replace(/\d+/, String(newTarget)) : `Goal (${newTarget})`;

      const res = await fetch(`${API_URL}/api/goals/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: newTarget,
          title: newTitle
        })
      });

      if (!res.ok) throw new Error("Failed to update goal");

      const data = await res.json();
      setEditingGoal(null);
      toast.success("Goal updated");
      fetchGoals(); // Refresh to get server-side calculations (like completion)
    } catch (error) {
      toast.error("Failed to update goal");
    } finally {
      setIsSavingGoal(false);
    }
  };

  if (!session && isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
  }
  // If we have a session but data is still loading, we can show skeleton or just render.
  // Optimistically allow render to proceed if session exists, preventing full page spinner on tab switch.

  return (
    <div className="min-h-screen bg-background custom-scrollbar">
      <Header />

      <main className="w-full max-w-[1600px] mx-auto px-4 pt-24 pb-32 md:px-8 md:pb-12 space-y-8">
        {/* Page Header */}
        <section className="animate-fade-in flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Goals</h1>
            <p className="text-muted-foreground mt-1">Set targets, track progress</p>
          </div>
          <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
            <DialogTrigger asChild>
              <button onClick={() => triggerHaptic()} className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-105">
                <Plus className="w-5 h-5" />
              </button>
            </DialogTrigger>
            <DialogContent className="bg-background border-border">
              <DialogHeader>
                <DialogTitle>Add New Goal</DialogTitle>
                <div className="sr-only">
                  <DialogDescription>
                    Choose a goal type and set your target.
                  </DialogDescription>
                </div>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {newGoalType === null ? (
                  <div className="grid grid-cols-2 gap-3">
                    {goalTemplates.map((template) => (
                      <button
                        key={template.type}
                        onClick={() => {
                          setNewGoalType(template.type);
                          setNewGoalTarget(template.defaultTarget);
                          triggerHaptic();
                        }}
                        className="p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-all duration-300 text-left group"
                      >
                        <template.icon className="w-6 h-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                        <p className="font-medium">{template.title}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {goalTemplates.find(t => t.type === newGoalType)?.icon && (
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                          {(() => {
                            const Icon = goalTemplates.find(t => t.type === newGoalType)?.icon;
                            return Icon ? <Icon className="w-5 h-5 text-primary" /> : null;
                          })()}
                        </div>
                      )}
                      <p className="font-medium">{goalTemplates.find(t => t.type === newGoalType)?.title}</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-sm text-muted-foreground">Target {newGoalType === 'days' && `(Max: ${7 - daysOfWeek.indexOf(newGoalStartDay)})`}</label>
                        <input
                          type="number"
                          value={newGoalTarget}
                          onChange={(e) => {
                            let val = parseInt(e.target.value) || 0;
                            if (newGoalType === 'days') {
                              const max = 7 - daysOfWeek.indexOf(newGoalStartDay);
                              if (val > max) val = max;
                              if (val < 1) val = 1;
                            } else {
                              if (val < 1) val = 1;
                            }
                            setNewGoalTarget(val);
                          }}
                          className="w-full mt-2 p-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                          min={1}
                          max={newGoalType === 'days' ? (7 - daysOfWeek.indexOf(newGoalStartDay)) : undefined}
                        />
                      </div>
                      {newGoalType === 'days' && (
                        <div className="flex-1">
                          <label className="text-sm text-muted-foreground">Starts On</label>
                          <select
                            value={newGoalStartDay}
                            onChange={(e) => {
                              const newStart = e.target.value;
                              setNewGoalStartDay(newStart);
                              const max = 7 - daysOfWeek.indexOf(newStart);
                              if (newGoalTarget > max) setNewGoalTarget(max);
                            }}
                            className="w-full mt-2 p-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors appearance-none cursor-pointer"
                          >
                            {daysOfWeek.map(day => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setNewGoalType(null)}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={() => {
                          const template = goalTemplates.find(t => t.type === newGoalType);
                          if (template) {
                            addGoal(template);
                            triggerHaptic();
                          }
                        }}
                        className="flex-1 bg-primary hover:bg-primary/90"
                        disabled={isCreatingGoal}
                      >
                        {isCreatingGoal ? "Creating..." : "Create Goal"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </section>

        {/* Summary Stats */}
        <Section className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            <div className="text-center p-4 rounded-xl border border-border bg-secondary/30">
              <p className="text-2xl font-bold text-gradient">{activeGoals.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Active</p>
            </div>
            <div className="text-center p-4 rounded-xl border border-border bg-secondary/30">
              <p className="text-2xl font-bold text-primary">{completedGoals.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </div>
            <div className="text-center p-4 rounded-xl border border-border bg-secondary/30">
              <p className="text-2xl font-bold text-foreground">
                {goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Success Rate</p>
            </div>
          </div>
        </Section>

        {/* Active Goals */}
        <Section title="Active Goals" className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeGoals.map((goal) => {
              const Icon = goal.icon || Trophy;
              const isProjectsGoal = goal.type === 'projects';
              const goalTemplate = goalTemplates.find(t => t.type === goal.type);
              return (
                <div
                  key={goal.id}
                  className={`p-4 rounded-xl border border-border bg-secondary/30 transition-all duration-300 group flex flex-col justify-between ${isProjectsGoal ? 'hover:bg-secondary/50' : 'hover:bg-secondary/50'}`}
                >
                  {/* Header with icon, title, and actions */}
                  <div className="flex items-start gap-3 mb-3">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>

                    {/* Title and status - flexible to take available space */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1.5">
                        <p className="font-medium text-sm leading-tight flex-1">{goal.title}</p>
                        {goalTemplate?.description && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <button
                                className="shrink-0 p-1 rounded-lg hover:bg-secondary/50 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Info className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                            </DialogTrigger>
                            <DialogContent className="bg-background border-border max-w-sm">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Icon className="w-5 h-5 text-primary" />
                                  {goalTemplate.title}
                                </DialogTitle>
                                <DialogDescription className="text-left pt-2">
                                  {goalTemplate.description}
                                </DialogDescription>
                              </DialogHeader>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                      {goal.type === 'days' && (() => {
                        const todayIndex = (new Date().getDay() + 6) % 7; // Mon=0, Sun=6
                        const startIndex = daysOfWeek.indexOf(goal.dueDate || "Monday");

                        // How many days of the range have strictly passed before today?
                        const daysPassedInRangeBeforeToday = Math.max(0, todayIndex - startIndex);

                        // If our current consecutive count is less than the days that should have been hit...
                        const isBroken = goal.current < daysPassedInRangeBeforeToday;

                        if (isBroken) return <span className="text-xs font-bold text-destructive flex items-center gap-1 mt-1">Goal Broken</span>;
                        if (goal.completed) return <span className="text-xs font-bold text-green-500 flex items-center gap-1 mt-1">Completed!</span>;
                        return <span className="text-xs text-green-500 flex items-center gap-1 mt-1">On Track</span>;
                      })()}
                      {goal.dueDate && goal.type !== 'days' && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" /> Due: {goal.dueDate}
                        </p>
                      )}
                    </div>

                    {/* Action buttons - always stay on the right */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Dialog open={editingGoal?.id === goal.id} onOpenChange={(open) => !open && setEditingGoal(null)}>
                        <DialogTrigger asChild>
                          <button
                            onClick={() => {
                              setEditingGoal(goal);
                              triggerHaptic();
                            }}
                            className="p-2 rounded-lg hover:bg-secondary transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="bg-background border-border">
                          <DialogHeader>
                            <DialogTitle>Edit Goal</DialogTitle>
                            <div className="sr-only">
                              <DialogDescription>
                                Modify the target of your existing goal.
                              </DialogDescription>
                            </div>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <label className="text-sm text-muted-foreground">Target</label>
                              <input
                                type="number"
                                defaultValue={editingGoal?.target}
                                onChange={(e) => {
                                  if (editingGoal) {
                                    setEditingGoal({ ...editingGoal, target: parseInt(e.target.value) || 1 });
                                  }
                                }}
                                className="w-full mt-2 p-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                                min={1}
                              />
                            </div>
                            <Button
                              onClick={() => editingGoal && updateGoalTarget(editingGoal.id, editingGoal.target)}
                              className="w-full bg-primary hover:bg-primary/90"
                              disabled={isSavingGoal}
                            >
                              {isSavingGoal ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // prevent card click
                              triggerHaptic();
                            }}
                            className="p-2 rounded-lg hover:bg-destructive/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-background border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Goal?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently remove your goal progress.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteGoal(goal.id);
                                triggerHaptic();
                              }}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {isProjectsGoal && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRepoDetailsOpen(true);
                        triggerHaptic();
                      }}
                      className="flex items-center gap-2 text-xs text-primary mb-2 opacity-80 hover:opacity-100 transition-opacity cursor-pointer focus:outline-none"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Details</span>
                    </button>
                  )}

                  <GoalProgress
                    title=""
                    current={goal.current}
                    target={goal.target}
                  />
                </div>
              )
            })}
            {activeGoals.length === 0 && (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-8 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No active goals. Create one to get started!</p>
              </div>
            )}
          </div>
        </Section>

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <Section title="Completed" className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="p-4 rounded-xl border border-primary/30 bg-primary/10 opacity-80"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium line-through truncate">{goal.title}</p>
                        <p className="text-xs text-primary">Completed!</p>
                      </div>
                    </div>
                    <Trophy className="w-5 h-5 text-primary shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Goal Suggestions */}
        <Section title="Suggested Goals" className="animate-fade-up" style={{ animationDelay: "0.25s" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => {
                setIsAddingGoal(true);
                triggerHaptic();
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Flame className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="font-medium">Reach 100-day streak</p>
                  <p className="text-xs text-muted-foreground">53 days remaining</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => {
                setIsAddingGoal(true);
                triggerHaptic();
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <GitCommit className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="font-medium">1000 commits this year</p>
                  <p className="text-xs text-muted-foreground">Based on your current pace</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Repo Details Modal */}
        {isMobile ? (
          <Drawer open={repoDetailsOpen} onOpenChange={setRepoDetailsOpen}>
            <DrawerContent>
              <DrawerHeader className="text-left">
                <DrawerTitle>Repositories Contributed To</DrawerTitle>
                <DrawerDescription>
                  Your contributions tracked by GitHub.
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4 pt-0 h-[60vh]">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-3">
                    {projectsData.length > 0 ? projectsData.map((repo, i) => (
                      <a
                        key={i}
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/10 hover:bg-secondary/30 transition-colors group/item"
                      >
                        <div className="min-w-0 flex-1 mr-3">
                          <p className="font-medium truncate text-foreground group-hover/item:text-primary transition-colors">
                            {repo.nameWithOwner}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Last active: {new Date(repo.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover/item:text-primary transition-colors shrink-0" />
                      </a>
                    )) : (
                      <p className="text-center text-muted-foreground py-8">No repository data available.</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Sheet open={repoDetailsOpen} onOpenChange={setRepoDetailsOpen}>
            <SheetContent side="right" className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Repositories Contributed To</SheetTitle>
                <SheetDescription>
                  Your contributions tracked by GitHub.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 h-[calc(100vh-10rem)]">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-3">
                    {projectsData.length > 0 ? projectsData.map((repo, i) => (
                      <a
                        key={i}
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/10 hover:bg-secondary/30 transition-colors group/item"
                      >
                        <div className="min-w-0 flex-1 mr-3">
                          <p className="font-medium truncate text-foreground group-hover/item:text-primary transition-colors">
                            {repo.nameWithOwner}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Last active: {new Date(repo.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover/item:text-primary transition-colors shrink-0" />
                      </a>
                    )) : (
                      <p className="text-center text-muted-foreground py-8">No repository data available.</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </main>

      <FloatingNav />
    </div >
  );
}
