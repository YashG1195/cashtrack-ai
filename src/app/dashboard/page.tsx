"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getCurrencySymbol } from "@/lib/finance";
import { TransactionRepository, Transaction } from "@/repositories/transaction.repository";
import { BudgetRepository, Budget } from "@/repositories/budget.repository";
import { GoalRepository, SavingsGoal } from "@/repositories/goal.repository";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  Sparkles, 
  Plus,
  ArrowRight,
  TrendingDown,
  X,
  Trash2,
  Calendar,
  Loader2,
  Bell,
  Edit3
} from "lucide-react";
import Link from "next/link";
import TransactionModal from "@/components/dashboard/TransactionModal";
import DeleteConfirmModal from "@/components/dashboard/DeleteConfirmModal";
import { AISummaryRepository } from "@/repositories/aiSummary.repository";
import { AIRecommendationRepository } from "@/repositories/aiRecommendation.repository";
import { AIInsightRepository } from "@/repositories/aiInsight.repository";
import { NotificationRepository, AppNotification } from "@/repositories/notification.repository";
import { RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const { currency: currencyCode } = useTheme();
  const currency = getCurrencySymbol(currencyCode);
  
  // States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // AI Summary State
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    const unsubscribeTransactions = TransactionRepository.subscribe(
      user.uid,
      (list) => {
        setTransactions(list);
        setLoading(false);
      },
      (err) => {
        console.error("Transactions subscription error:", err);
        setLoading(false);
      }
    );

    const unsubscribeBudgets = BudgetRepository.subscribe(
      user.uid,
      (list) => {
        setBudgets(list);
      },
      (err) => console.error("Budgets subscription error:", err)
    );

    const unsubscribeGoals = GoalRepository.subscribe(
      user.uid,
      (list) => {
        setGoals(list);
      },
      (err) => console.error("Goals subscription error:", err)
    );

    const unsubscribeSummary = AISummaryRepository.subscribe(
      user.uid,
      (sum) => {
        setAiSummary(sum);
      }
    );

    const unsubscribeRecommendations = AIRecommendationRepository.subscribe(
      user.uid,
      (recs) => {
        setAiRecommendations(recs);
      }
    );

    const unsubscribeInsights = AIInsightRepository.subscribe(
      user.uid,
      (ins) => {
        setAiInsights(ins);
      }
    );

    const unsubscribeNotifications = NotificationRepository.subscribe(
      user.uid,
      (list) => {
        setNotifications(list);
      },
      (err) => console.error("Notifications subscription error:", err)
    );

    return () => {
      unsubscribeTransactions();
      unsubscribeBudgets();
      unsubscribeGoals();
      unsubscribeNotifications();
      unsubscribeSummary();
      unsubscribeRecommendations();
      unsubscribeInsights();
    };
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Calculations
  const totalBalance = transactions.reduce((sum, t) => sum + t.amount, 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
  });

  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const monthlyExpenses = currentMonthTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Financial health calculation
  const getHealthScore = () => {
    if (transactions.length === 0) return 100;
    if (monthlyIncome === 0) {
      return monthlyExpenses > 0 ? 30 : 100;
    }
    const ratio = monthlyExpenses / monthlyIncome;
    if (ratio >= 1) {
      return Math.max(10, Math.round(50 - (ratio - 1) * 30));
    }
    return Math.min(100, Math.round(70 + (1 - ratio) * 30));
  };

  const healthScore = getHealthScore();

  // Generate last 7 days chart data
  const getChartData = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const chartList = [];

    // Calculate dates for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayName = days[d.getDay()];

      const dayTransactions = transactions.filter(t => t.date === dateStr);
      const dayIncome = dayTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const dayExpense = dayTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Math.abs(t.amount), 0);

      chartList.push({ day: dayName, income: dayIncome, expense: dayExpense });
    }

    // Determine scale (max value to set 100% height limit)
    const maxVal = Math.max(...chartList.map(item => Math.max(item.income, item.expense)), 100);

    return chartList.map(item => ({
      day: item.day,
      incomePct: (item.income / maxVal) * 100,
      expensePct: (item.expense / maxVal) * 100,
      rawIncome: item.income,
      rawExpense: item.expense
    }));
  };

  const chartData = getChartData();

  // Budget summary calculations
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const spendingMap = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === "expense")
      .reduce((map: Record<string, number>, t) => {
        map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
        return map;
      }, {});
  }, [currentMonthTransactions]);

  const totalSpentOnBudgets = budgets.reduce((sum, b) => sum + (spendingMap[b.category] || 0), 0);
  const totalRemainingBudget = totalBudgeted - totalSpentOnBudgets;
  
  const overBudgetsCount = budgets.filter(b => {
    const spent = spendingMap[b.category] || 0;
    return spent > b.amount;
  }).length;

  // Savings goals calculations
  const totalActiveGoals = goals.filter(g => g.currentAmount < g.targetAmount).length;
  const totalGoalSavings = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTargetGoals = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallGoalsProgress = totalTargetGoals > 0 ? (totalGoalSavings / totalTargetGoals) * 100 : 0;

  // Find goal closest to completion (highest percentage but < 100%)
  const nextMilestoneGoal = useMemo(() => {
    if (goals.length === 0) return null;
    const incompleteGoals = goals
      .map(g => ({
        ...g,
        pct: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0
      }))
      .filter(g => g.pct < 100);
    
    if (incompleteGoals.length === 0) return null;
    return incompleteGoals.sort((a, b) => b.pct - a.pct)[0];
  }, [goals]);

  // Handle transaction creation / edits
  const handleSaveTransaction = async (txInput: any) => {
    if (!user) return;
    if (selectedTx) {
      await TransactionRepository.update(user.uid, selectedTx.id, txInput);
    } else {
      await TransactionRepository.add(user.uid, txInput);
    }
  };

  // Handle delete trigger
  const handleOpenDeleteConfirm = (tx: Transaction) => {
    setSelectedTx(tx);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!user || !selectedTx) return;
    await TransactionRepository.delete(user.uid, selectedTx.id);
  };

  // Generate AI Dashboard Analysis
  const handleGenerateAI = async () => {
    if (!user || generatingAI) return;
    setGeneratingAI(true);
    try {
      // Fetch fresh data in real-time before sending to advisor dashboard route
      const [freshTxs, freshBudgets, freshGoals] = await Promise.all([
        TransactionRepository.list(user.uid),
        BudgetRepository.list(user.uid),
        GoalRepository.list(user.uid)
      ]);

      setTransactions(freshTxs);
      setBudgets(freshBudgets);
      setGoals(freshGoals);

      const res = await fetch("/api/advisor/dashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          transactions: freshTxs,
          budgets: freshBudgets,
          savingsGoals: freshGoals,
          currency
        })
      });

      if (!res.ok) {
        throw new Error("Failed to generate AI insights");
      }

      const result = await res.json();

      // Clear old cached records
      await Promise.all([
        AISummaryRepository.clear(user.uid),
        AIRecommendationRepository.clear(user.uid),
        AIInsightRepository.clear(user.uid)
      ]);

      // Save new summary
      await AISummaryRepository.set(user.uid, result.weeklySummary);

      // Save new recommendations
      for (const rec of result.recommendations) {
        await AIRecommendationRepository.add(user.uid, rec.type, rec.content);
      }

      // Save new insights
      for (const ins of result.insights) {
        await AIInsightRepository.add(user.uid, ins);
      }
    } catch (err) {
      console.error("Failed to generate AI dashboard insights:", err);
    } finally {
      setGeneratingAI(false);
    }
  };

  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-bold text-neutral-900 dark:text-white">{part}</strong>;
      }
      return part;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            {getGreeting()}, {user?.displayName || "User"}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Here is your financial status overview for this month.
          </p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 justify-center text-xs font-semibold px-4 h-9 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors duration-200 cursor-pointer shadow-[0_0_15px_rgba(79,70,229,0.2)]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* AI Financial Advisor summary card */}
      <div className="p-6 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-yellow-500/5 to-transparent backdrop-blur-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 fill-amber-500/20 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">AI Financial Summary & Recommendations</h3>
              <p className="text-[10px] text-neutral-400 mt-0.5">Personalized guidance powered by Gemini AI.</p>
            </div>
          </div>

          <button
            onClick={handleGenerateAI}
            disabled={generatingAI}
            className="self-start sm:self-center inline-flex items-center gap-1.5 justify-center text-[10px] font-bold px-3 h-8 bg-amber-600/10 hover:bg-amber-600/20 text-amber-600 dark:text-amber-400 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {generatingAI ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing Profile...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh AI analysis</span>
              </>
            )}
          </button>
        </div>

        {generatingAI ? (
          <div className="space-y-3 animate-pulse py-2">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
            <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6" />
            <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-2/3" />
          </div>
        ) : aiSummary ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* Summary details */}
            <div className="lg:col-span-2 space-y-2 border-b lg:border-b-0 lg:border-r border-neutral-100 dark:border-neutral-900 pb-4 lg:pb-0 lg:pr-6">
              <span className="text-[10px] font-bold text-neutral-500 dark:text-gray-400 uppercase tracking-wider block mb-2">Weekly Summary</span>
              <div className="text-xs text-neutral-700 dark:text-gray-200 space-y-2 leading-relaxed">
                {aiSummary.content.split("\n").map((line: string, i: number) => {
                  if (line.startsWith("### ")) {
                    return null; // Omit main title
                  }
                  if (line.startsWith("* ") || line.startsWith("- ")) {
                    const content = line.substring(2);
                    return (
                      <div key={i} className="flex items-start gap-2 text-xs text-neutral-700 dark:text-gray-200">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{parseBoldText(content)}</span>
                      </div>
                    );
                  }
                  return line.trim() ? <p key={i} className="text-neutral-700 dark:text-gray-200">{parseBoldText(line)}</p> : null;
                })}
              </div>

              {/* Insights list */}
              {aiInsights.length > 0 && (
                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-900 space-y-1.5">
                  <span className="text-[9px] font-bold text-neutral-400 dark:text-gray-400 uppercase tracking-wider block">Automated Insights</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {aiInsights.slice(0, 3).map((ins, i) => (
                      <div key={i} className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-900/50 text-[10px] text-neutral-600 dark:text-neutral-400 font-medium">
                        {ins.content}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recommendations column */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-neutral-500 dark:text-gray-400 uppercase tracking-wider block">Actionable Recommendations</span>
              <div className="space-y-2">
                {aiRecommendations.length === 0 ? (
                  <div className="text-[10px] text-neutral-400 dark:text-neutral-500 py-4 text-center">
                    No active recommendations. Click refresh above to generate.
                  </div>
                ) : (
                  aiRecommendations.slice(0, 3).map((rec, i) => {
                    let typeBadgeColor = "bg-amber-500/10 text-amber-600 dark:text-yellow-400 border-amber-500/20";
                    if (rec.type === "alert") {
                      typeBadgeColor = "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
                    } else if (rec.type === "savings") {
                      typeBadgeColor = "bg-emerald-500/10 text-emerald-600 dark:text-green-400 border-emerald-500/20";
                    }

                    return (
                      <div key={i} className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-900 bg-white/50 dark:bg-neutral-900/30 flex items-start gap-2.5">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase flex-shrink-0 mt-0.5 ${typeBadgeColor}`}>
                          {rec.type}
                        </span>
                        <p className="text-[11px] text-neutral-700 dark:text-gray-200 leading-relaxed font-medium">
                          {rec.content}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-white/20">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              No financial analysis cache found for this session.
            </p>
            <button
              onClick={handleGenerateAI}
              className="mt-3 inline-flex items-center gap-1.5 justify-center text-xs font-semibold px-4 h-9 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate AI Analysis</span>
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Balance Card */}
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 transition-all duration-200 hover:shadow-md">
          <div className="flex justify-between items-center text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Balance</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {currency}{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
              <span>All-time balance status</span>
            </p>
          </div>
        </div>

        {/* Income Card */}
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 transition-all duration-200 hover:shadow-md">
          <div className="flex justify-between items-center text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Monthly Income</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {currency}{monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">This Month</span>
            </p>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 transition-all duration-200 hover:shadow-md">
          <div className="flex justify-between items-center text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Monthly Expenses</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {currency}{monthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
              <span className="text-red-600 dark:text-red-400 font-medium">This Month</span>
            </p>
          </div>
        </div>

        {/* Health score */}
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 transition-all duration-200 hover:shadow-md">
          <div className="flex justify-between items-center text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Financial Health</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{healthScore} / 100</p>
            <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
              <span className={healthScore > 75 ? "text-emerald-500" : healthScore > 50 ? "text-amber-500" : "text-red-500"}>
                {healthScore > 75 ? "Excellent score" : healthScore > 50 ? "Healthy ratio" : "High expense ratio"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Cash Flow Overview Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Cash Flow Overview</h3>
            <span className="text-xs text-neutral-400">Last 7 Days</span>
          </div>
          
          <div className="h-64 w-full flex items-end justify-between pt-6 px-2 border-b border-neutral-100 dark:border-neutral-900 gap-3">
            {chartData.map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-2 bg-neutral-900 text-white text-[9px] rounded p-1.5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-10 whitespace-nowrap shadow-md">
                  In: {currency}{bar.rawIncome.toFixed(0)} <br />
                  Out: {currency}{bar.rawExpense.toFixed(0)}
                </div>

                <div className="w-full flex items-end gap-1.5 h-full max-w-[45px]">
                  {/* Income bar */}
                  <div 
                    style={{ height: `${Math.max(bar.incomePct, 2)}%` }}
                    className={`flex-1 bg-amber-500 rounded-t-sm transition-all duration-300 shadow-sm ${
                      bar.rawIncome > 0 ? "opacity-80 hover:opacity-100" : "opacity-10"
                    }`}
                  />
                  {/* Expense bar */}
                  <div 
                    style={{ height: `${Math.max(bar.expensePct, 2)}%` }}
                    className={`flex-1 bg-yellow-400 rounded-t-sm transition-all duration-300 shadow-sm ${
                      bar.rawExpense > 0 ? "opacity-50 hover:opacity-80" : "opacity-10"
                    }`}
                  />
                </div>
                <span className="text-[10px] text-neutral-400 mt-1">{bar.day}</span>
              </div>
            ))}
          </div>
          
          <div className="flex gap-4 text-xs justify-center pt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-amber-500 rounded-sm" />
              <span className="text-neutral-500">Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-yellow-400 rounded-sm opacity-80" />
              <span className="text-neutral-500">Expenses</span>
            </div>
          </div>
        </div>

        {/* Dynamic Recent Transactions List */}
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Recent Transactions</h3>
            <span className="text-xs text-neutral-400">{transactions.length} total</span>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-900 overflow-y-auto max-h-72 pr-1">
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-xs text-neutral-400">
                No transactions yet. Click &quot;Add Transaction&quot; to begin.
              </div>
            ) : (
              transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="py-3 flex justify-between items-center group/item">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      tx.type === "income" 
                        ? "bg-emerald-500/10 text-emerald-500" 
                        : "bg-red-500/10 text-red-500"
                    }`}>
                      {tx.merchant[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">{tx.merchant}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{tx.category} • {tx.date}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${
                      tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-900 dark:text-white"
                    }`}>
                      {tx.type === "income" ? "+" : ""}{currency}{Math.abs(tx.amount).toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setSelectedTx(tx);
                          setIsModalOpen(true);
                        }}
                        className="p-1 rounded-md text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all cursor-pointer"
                        title="Edit transaction"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleOpenDeleteConfirm(tx)}
                        className="p-1 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Budget Summary, Savings Goals & Recent Notifications Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Summary Widget */}
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-amber-500" />
              <span>Budget Planner Summary</span>
            </h3>
            <span className="text-xs text-neutral-400">{budgets.length} budgets active</span>
          </div>

          {budgets.length === 0 ? (
            <div className="text-center py-8 text-xs text-neutral-500 dark:text-neutral-400">
              No budgets established this month.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-900 rounded-xl">
                  <div className="text-[10px] text-neutral-400 font-semibold uppercase">Total Budgeted</div>
                  <div className="text-sm font-bold text-neutral-900 dark:text-white mt-1">
                    {currency}{totalBudgeted.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="p-3 bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-900 rounded-xl">
                  <div className="text-[10px] text-neutral-400 font-semibold uppercase">Over Budget</div>
                  <div className={`text-sm font-bold mt-1 ${overBudgetsCount > 0 ? "text-red-500" : "text-emerald-500"}`}>
                    {overBudgetsCount} Categories
                  </div>
                </div>
                <div className="p-3 bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-900 rounded-xl">
                  <div className="text-[10px] text-neutral-400 font-semibold uppercase">Remaining</div>
                  <div className={`text-sm font-bold mt-1 ${totalRemainingBudget < 0 ? "text-red-500" : "text-emerald-500"}`}>
                    {totalRemainingBudget < 0 ? "-" : ""}{currency}{Math.abs(totalRemainingBudget).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>

              {/* Progress items for top budgets */}
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {budgets.slice(0, 3).map((b) => {
                  const spent = spendingMap[b.category] || 0;
                  const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
                  return (
                    <div key={b.category} className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300 capitalize">{b.category}</span>
                        <span className={`text-[10px] font-bold ${pct > 100 ? "text-red-500" : pct >= 80 ? "text-amber-500" : "text-neutral-500 dark:text-neutral-400"}`}>
                          {currency}{spent.toFixed(0)} / {currency}{b.amount.toFixed(0)} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${Math.min(pct, 100)}%` }}
                          className={`h-full rounded-full ${pct > 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Savings Goals Widget */}
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span>Savings Targets</span>
            </h3>
            <span className="text-xs text-neutral-400">{goals.length} goals active</span>
          </div>

          {goals.length === 0 ? (
            <div className="text-center py-8 text-xs text-neutral-500 dark:text-neutral-400">
              No savings goals established yet.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-900 rounded-xl">
                  <div className="text-[10px] text-neutral-400 font-semibold uppercase">Active Goals</div>
                  <div className="text-sm font-bold text-neutral-900 dark:text-white mt-1">
                    {totalActiveGoals}
                  </div>
                </div>
                <div className="p-3 bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-900 rounded-xl">
                  <div className="text-[10px] text-neutral-400 font-semibold uppercase">Total Savings</div>
                  <div className="text-sm font-bold text-neutral-900 dark:text-white mt-1">
                    {currency}{totalGoalSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="p-3 bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-900 rounded-xl">
                  <div className="text-[10px] text-neutral-400 font-semibold uppercase">Closest Goal</div>
                  <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1 truncate" title={nextMilestoneGoal ? `${nextMilestoneGoal.name} (${nextMilestoneGoal.pct.toFixed(0)}%)` : "None"}>
                    {nextMilestoneGoal ? `${nextMilestoneGoal.name} (${nextMilestoneGoal.pct.toFixed(0)}%)` : "None"}
                  </div>
                </div>
              </div>

              {/* Progress items for top goals */}
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {goals.slice(0, 3).map((g) => {
                  const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
                  return (
                    <div key={g.id} className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">{g.name}</span>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold">
                          {currency}{g.currentAmount.toLocaleString()} / {currency}{g.targetAmount.toLocaleString()} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${Math.min(pct, 100)}%` }}
                          className="h-full rounded-full bg-amber-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Recent Notifications Widget */}
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-amber-500" />
              <span>Recent Alerts</span>
            </h3>
            <Link 
              href="/dashboard/notifications" 
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-0.5"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-900 max-h-56 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-xs text-neutral-400 dark:text-neutral-500">
                No new notifications.
              </div>
            ) : (
              notifications.slice(0, 3).map((notif) => (
                <div key={notif.id} className="py-2.5 flex flex-col gap-0.5 first:pt-0 last:pb-0">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      {!notif.isRead && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0" />}
                      <span className="truncate max-w-[150px]">{notif.title}</span>
                    </span>
                    <span className="text-[9px] text-neutral-400">
                      {new Date(notif.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reusable Modals */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTx(null);
        }}
        onSave={handleSaveTransaction}
        transactionToEdit={selectedTx}
        currency={currency}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedTx(null);
        }}
        onConfirm={handleDeleteConfirm}
        transactionName={selectedTx ? `${selectedTx.merchant} (${currency}${Math.abs(selectedTx.amount).toFixed(2)})` : ""}
      />
    </div>
  );
}
