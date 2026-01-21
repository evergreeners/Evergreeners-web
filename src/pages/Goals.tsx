import { Header } from "@/components/Header";
import { FloatingNav } from "@/components/FloatingNav";
import { Section } from "@/components/Section";
import { GoalProgress } from "@/components/GoalProgress";
import {
  Target, Plus, Edit2, Trash2, Check, Calendar,
  Flame, GitCommit, BookOpen, Trophy, Clock
} from "lucide-react";
import { triggerHaptic } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

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
  { type: "streak", title: "Maintain streak", icon: Flame, defaultTarget: 30 },
  { type: "commits", title: "Weekly commits", icon: GitCommit, defaultTarget: 20 },
  { type: "days", title: "Code X days/week", icon: Calendar, defaultTarget: 5 },
  { type: "projects", title: "Contribute to repos", icon: BookOpen, defaultTarget: 3 },
];

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newGoalType, setNewGoalType] = useState<string | null>(null);
  const [newGoalTarget, setNewGoalTarget] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = authClient.useSession();

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
        const data = await res.json();
        setGoals(data.goals.map((g: any) => ({
          ...g,
          icon: goalTemplates.find(t => t.type === g.type)?.icon || Trophy
        })));
      }
    } catch (error) {
      console.error("Failed to fetch goals", error);
      toast.error("Failed to load goals");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchGoals();
    }
  }, [session]);

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  const addGoal = async (template: typeof goalTemplates[0]) => {
    try {
      const res = await fetch(`${API_URL}/api/goals`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${template.title} (${newGoalTarget})`,
          type: template.type,
          target: newGoalTarget,
          current: 0,
          dueDate: template.type === 'days' || template.type === 'commits' ? 'Sunday' : undefined
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
    }
  };

  if (!session) {
    if (isLoading && !session) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
    // Assuming Header/Layout handles non-auth viewing or redirects, calling fetchGoals normally fails.
  }

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
                    <div>
                      <label className="text-sm text-muted-foreground">Target</label>
                      <input
                        type="number"
                        value={newGoalTarget}
                        onChange={(e) => setNewGoalTarget(parseInt(e.target.value) || 1)}
                        className="w-full mt-2 p-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                        min={1}
                      />
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
                      >
                        Create Goal
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
              return (
                <div
                  key={goal.id}
                  className="p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{goal.title}</p>
                        {goal.dueDate && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> Due: {goal.dueDate}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                            >
                              Save Changes
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <button
                        onClick={() => {
                          deleteGoal(goal.id);
                          triggerHaptic();
                        }}
                        className="p-2 rounded-lg hover:bg-destructive/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
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
      </main>

      <FloatingNav />
    </div>
  );
}
