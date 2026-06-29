"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getCurrencySymbol } from "@/lib/finance";
import { GoalRepository, SavingsGoal } from "@/repositories/goal.repository";
import { GoalContributionRepository, GoalContribution } from "@/repositories/goal-contribution.repository";
import { 
  Plus, 
  Trash2, 
  Target, 
  Calendar, 
  TrendingUp, 
  Loader2,
  X,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingDown
} from "lucide-react";

export default function SavingsPage() {
  const { user } = useAuth();
  const { currency: currencyCode } = useTheme();
  const currency = getCurrencySymbol(currencyCode);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [contributions, setContributions] = useState<GoalContribution[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  
  // Add goal form state
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [color, setColor] = useState("purple");
  const [submitting, setSubmitting] = useState(false);

  // Contribution form state
  const [contribAmount, setContribAmount] = useState("");
  const [contribNote, setContribNote] = useState("");
  const [contribSubmitting, setContribSubmitting] = useState(false);

  const colors = [
    { name: "purple", bg: "bg-purple-500", text: "text-purple-500", border: "border-purple-500/20", progress: "bg-purple-600", badge: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
    { name: "green", bg: "bg-emerald-500", text: "text-emerald-500", border: "border-emerald-500/20", progress: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    { name: "orange", bg: "bg-orange-500", text: "text-orange-500", border: "border-orange-500/20", progress: "bg-orange-500", badge: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
    { name: "pink", bg: "bg-pink-500", text: "text-pink-500", border: "border-pink-500/20", progress: "bg-pink-500", badge: "bg-pink-500/10 text-pink-500 border-pink-500/20" },
    { name: "yellow", bg: "bg-yellow-500", text: "text-yellow-500", border: "border-yellow-500/20", progress: "bg-yellow-600", badge: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" }
  ];

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    const unsubscribeGoals = GoalRepository.subscribe(
      user.uid,
      (list) => {
        setGoals(list);
      },
      (err) => console.error("Goals subscription error:", err)
    );

    const unsubscribeContributions = GoalContributionRepository.subscribe(
      user.uid,
      (list) => {
        setContributions(list);
        setLoading(false);
      },
      (err) => {
        console.error("Contributions subscription error:", err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeGoals();
      unsubscribeContributions();
    };
  }, [user]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !targetAmount || !targetDate) return;

    setSubmitting(true);
    try {
      const target = parseFloat(targetAmount);
      const current = parseFloat(currentAmount || "0");

      const newGoal = await GoalRepository.add(user.uid, {
        name,
        targetAmount: target,
        currentAmount: current,
        targetDate,
        color
      });

      // Also log an initial contribution if current > 0
      if (current > 0) {
        await GoalContributionRepository.add(user.uid, {
          goalId: newGoal.id,
          amount: current,
          note: "Initial savings balance"
        });
      }

      // Reset
      setName("");
      setTargetAmount("");
      setCurrentAmount("");
      setTargetDate("");
      setColor("purple");
      setIsAddOpen(false);
    } catch (err) {
      console.error("Failed to add goal:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenContribution = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setContribAmount("");
    setContribNote("");
    setIsContributionOpen(true);
  };

  const handleSaveContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedGoal || !contribAmount) return;

    const amt = parseFloat(contribAmount);
    if (isNaN(amt) || amt <= 0) return;

    setContribSubmitting(true);
    try {
      const newCurrent = selectedGoal.currentAmount + amt;

      // 1. Create contribution record
      await GoalContributionRepository.add(user.uid, {
        goalId: selectedGoal.id,
        amount: amt,
        note: contribNote.trim()
      });

      // 2. Update goal total
      await GoalRepository.update(user.uid, selectedGoal.id, { 
        currentAmount: newCurrent 
      });

      setIsContributionOpen(false);
      setContribAmount("");
      setContribNote("");
    } catch (err) {
      console.error("Failed to save contribution:", err);
    } finally {
      setContribSubmitting(false);
    }
  };

  const handleUpdateGoalColor = async (id: string, newColor: string) => {
    if (!user) return;
    try {
      await GoalRepository.update(user.uid, id, { color: newColor });
    } catch (err) {
      console.error("Failed to update goal color:", err);
    }
  };

  const handleDeleteGoal = async (id: string, name: string) => {
    if (!user) return;
    if (!confirm(`Are you sure you want to delete the goal: ${name}?`)) return;

    try {
      await GoalRepository.delete(user.uid, id);
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  // Status computation logic
  const getGoalStatus = (goal: SavingsGoal) => {
    const selectedColor = colors.find(c => c.name === goal.color) || colors[0];
    if (goal.currentAmount >= goal.targetAmount) {
      return { 
        label: "Completed", 
        color: selectedColor.badge,
        icon: CheckCircle2 
      };
    }
    
    const targetD = new Date(goal.targetDate);
    const today = new Date();
    
    if (today > targetD) {
      return { 
        label: "Behind Schedule", 
        color: "bg-red-500/10 text-red-500 border-red-500/20",
        icon: Clock 
      };
    }
    
    // Default duration baseline (180 days) if createdAt is missing
    const startD = goal.createdAt ? new Date(goal.createdAt) : new Date(targetD.getTime() - 180 * 24 * 60 * 60 * 1000);
    const totalTime = targetD.getTime() - startD.getTime();
    const elapsedTime = today.getTime() - startD.getTime();
    
    if (totalTime <= 0) {
      return { 
        label: "On Track", 
        color: selectedColor.badge,
        icon: TrendingUp 
      };
    }
    
    const expectedProgressRatio = Math.min(1, Math.max(0, elapsedTime / totalTime));
    const actualProgressRatio = goal.currentAmount / goal.targetAmount;
    
    if (actualProgressRatio >= expectedProgressRatio) {
      return { 
        label: "On Track", 
        color: selectedColor.badge,
        icon: TrendingUp 
      };
    } else {
      return { 
        label: "Behind Schedule", 
        color: "bg-red-500/10 text-red-500 border-red-500/20",
        icon: Clock 
      };
    }
  };

  // Required Monthly Savings
  const calculateMonthlySavings = (goal: SavingsGoal) => {
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining <= 0) return 0;
    
    const targetD = new Date(goal.targetDate);
    const today = new Date();
    
    let months = (targetD.getFullYear() - today.getFullYear()) * 12 + (targetD.getMonth() - today.getMonth());
    const dayDiff = targetD.getDate() - today.getDate();
    months += dayDiff / 30;
    
    const remainingMonths = Math.max(1, months);
    return remaining / remainingMonths;
  };

  // Retrieve completion date (latest contribution date when goal was completed)
  const getGoalCompletionDate = (goal: SavingsGoal, goalContribs: GoalContribution[]) => {
    if (goal.currentAmount < goal.targetAmount) return "";
    
    if (goalContribs.length > 0) {
      const latest = goalContribs.reduce((latest, current) => 
        current.createdAt > latest.createdAt ? current : latest
      , goalContribs[0]);
      return new Date(latest.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "2-digit",
        year: "numeric"
      });
    }

    return goal.createdAt ? new Date(goal.createdAt).toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric"
    }) : new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallPercentage = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Savings Goals</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Define saving targets, track milestones, and view monthly required inputs.
          </p>
        </div>

        <button 
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1.5 justify-center text-xs font-semibold px-4 h-9 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors cursor-pointer shadow-[0_0_15px_rgba(79,70,229,0.2)]"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40">
          <div className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Total Saved</div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white mt-1.5">
            {currency}{totalSaved.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40">
          <div className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Goals Target</div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white mt-1.5">
            {currency}{totalTarget.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40">
          <div className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Overall Savings Progress</div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white mt-1.5 flex items-baseline gap-2">
            <span>{overallPercentage.toFixed(0)}%</span>
            <span className="text-xs font-normal text-neutral-400">Complete</span>
          </div>
        </div>
      </div>

      {/* Goals Display */}
      {goals.length === 0 ? (
        <div className="border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl p-12 text-center bg-white dark:bg-neutral-950/10">
          <Target className="w-10 h-10 mx-auto text-neutral-400 dark:text-neutral-500 mb-3" />
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">No savings goals</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
            Saving without a target is like sailing without a map. Set goals for travel, tech, or emergency funds.
          </p>
          <button 
            onClick={() => setIsAddOpen(true)}
            className="mt-4 inline-flex items-center gap-1 px-4 h-9 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal) => {
            const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            const isFinished = remaining <= 0;

            const selectedColor = colors.find(c => c.name === goal.color) || colors[0];
            const monthlySavingTarget = calculateMonthlySavings(goal);
            const status = getGoalStatus(goal);
            const StatusIcon = status.icon;

            const goalContribs = contributions.filter(c => c.goalId === goal.id);
            const completionDate = getGoalCompletionDate(goal, goalContribs);

            return (
              <div 
                key={goal.id} 
                className={`p-5 rounded-2xl border bg-white dark:bg-neutral-950/40 space-y-4 hover:shadow-md transition-shadow duration-200 ${selectedColor.border}`}
              >
                {/* Title & Status badge */}
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                      <Target className={`w-4 h-4 ${selectedColor.text}`} />
                      <span className="truncate max-w-[150px]">{goal.name}</span>
                    </h3>
                    <p className="text-[10px] text-neutral-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Target: {goal.targetDate}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${status.color} flex items-center gap-1`}>
                      <StatusIcon className="w-2.5 h-2.5" />
                      <span>{status.label}</span>
                    </span>
                    <button
                      onClick={() => handleDeleteGoal(goal.id, goal.name)}
                      className="p-1 rounded-md text-neutral-400 hover:text-red-500 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                      {currency}{goal.currentAmount.toLocaleString()} of {currency}{goal.targetAmount.toLocaleString()} saved
                    </span>
                    <span className={`text-[11px] font-bold ${selectedColor.text}`}>
                      {pct.toFixed(0)}% Complete
                    </span>
                  </div>
                  
                  <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${Math.min(pct, 100)}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${selectedColor.progress}`}
                    />
                  </div>

                  {/* Remaining Amount */}
                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-neutral-400 dark:text-neutral-500">Remaining Amount:</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                      {currency}{remaining.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Status / Monthly required / Completion details */}
                <div className="pt-2.5 border-t border-neutral-100 dark:border-neutral-900 space-y-2.5">
                  {isFinished ? (
                    <div className="text-emerald-500 text-[11px] font-semibold flex flex-col items-center gap-1 bg-emerald-500/10 p-2 rounded-xl justify-center">
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 animate-bounce" />
                        <span>🎉 Goal Achieved!</span>
                      </div>
                      {completionDate && (
                        <span className="text-[9px] text-emerald-600/80 dark:text-emerald-400/80 font-normal">
                          Achieved on {completionDate}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[11px] text-amber-500 dark:text-amber-400 font-semibold bg-amber-500/5 dark:bg-amber-500/10 p-2 rounded-xl">
                        <span>Required Monthly Savings:</span>
                        <span>{currency}{monthlySavingTarget.toLocaleString(undefined, { maximumFractionDigits: 0 })}/month</span>
                      </div>
                    </div>
                  )}

                  {/* Contribution History Log */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">Contribution History</span>
                    <div className="max-h-24 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/20 rounded-xl p-2.5 border border-neutral-100 dark:border-neutral-900">
                      {goalContribs.length === 0 ? (
                        <div className="text-[10px] text-neutral-400 dark:text-neutral-500 text-center py-2">
                          No contributions logged yet.
                        </div>
                      ) : (
                        goalContribs.map((c) => (
                          <div key={c.id} className="flex justify-between items-start py-1.5 first:pt-0 last:pb-0 text-xs">
                            <div className="space-y-0.5">
                              <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                                +{currency}{c.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </div>
                              {c.note && (
                                <div className="text-[9px] text-neutral-400 dark:text-neutral-500 truncate max-w-[130px]" title={c.note}>
                                  {c.note}
                                </div>
                              )}
                            </div>
                            <div className="text-[9px] text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
                              {new Date(c.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "2-digit"
                              })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Add Contribution Action Button */}
                <button
                  onClick={() => handleOpenContribution(goal)}
                  disabled={isFinished}
                  className={`w-full h-9 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    isFinished 
                      ? "bg-neutral-100 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600 cursor-not-allowed border border-neutral-200 dark:border-neutral-800" 
                      : "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Contribution</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Create Savings Goal</h3>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Goal Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Fund, New Phone"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-amber-500 dark:focus:border-amber-500 outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Target Amount ({currency})
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="0"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-amber-500 dark:focus:border-amber-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Initial Balance ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-amber-500 dark:focus:border-amber-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Target Date
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white focus:border-amber-500 dark:focus:border-amber-500 outline-none transition-colors"
                />
              </div>

              {/* Color Scheme Picker */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Theme Color
                </label>
                <div className="flex gap-3">
                  {colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setColor(c.name)}
                      className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${c.bg} ${
                        color === c.name ? "scale-125 ring-2 ring-offset-2 ring-neutral-400" : "hover:scale-110"
                      }`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 h-9 text-xs font-semibold border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg transition-colors cursor-pointer"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 h-9 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors cursor-pointer shadow-[0_0_15px_rgba(79,70,229,0.2)] flex items-center justify-center gap-1"
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Create Target"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contribution Modal */}
      {isContributionOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Add Contribution: {selectedGoal.name}</h3>
              <button 
                onClick={() => setIsContributionOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContribution} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Contribution Amount ({currency})
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={contribAmount}
                  onChange={(e) => setContribAmount(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-amber-500 dark:focus:border-amber-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Optional Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. June savings, Bonus"
                  value={contribNote}
                  onChange={(e) => setContribNote(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-amber-500 dark:focus:border-amber-500 outline-none transition-colors"
                />
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsContributionOpen(false)}
                  className="px-4 h-9 text-xs font-semibold border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg transition-colors cursor-pointer"
                  disabled={contribSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 h-9 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors cursor-pointer shadow-[0_0_15px_rgba(79,70,229,0.2)] flex items-center justify-center gap-1"
                  disabled={contribSubmitting}
                >
                  {contribSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
