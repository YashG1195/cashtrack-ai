"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getCurrencySymbol, calculateGrowthRate } from "@/lib/finance";
import { TransactionRepository, Transaction } from "@/repositories/transaction.repository";
import { BudgetRepository, Budget } from "@/repositories/budget.repository";
import { GoalRepository, SavingsGoal } from "@/repositories/goal.repository";
import { 
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Loader2, 
  PieChart as PieIcon, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Sparkles,
  ArrowRight,
  AlertCircle,
  HelpCircle
} from "lucide-react";

// Category colors mapping
const CATEGORY_COLORS: Record<string, string> = {
  food: "var(--brand-500)",         // Dynamic Brand Color
  shopping: "#F97316",     // Pink
  rent: "#3b82f6",         // Blue
  travel: "#f59e0b",       // Amber
  entertainment: "#a855f7", // Purple
  bills: "#ef4444",        // Red
  health: "#10b981",       // Emerald
  education: "#f43f5e",    // Rose
  other: "#78716c",        // Stone
  salary: "#10b981",       // Green for income
  freelance: "#3b82f6",
  investment: "#8b5cf6",
  business: "#f59e0b"
};

const DEFAULT_COLORS = ["var(--brand-500)", "#8b5cf6", "#F97316", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#a855f7", "#78716c"];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { currency: currencyCode } = useTheme();
  const currency = getCurrencySymbol(currencyCode);
  
  // States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Global filters
  const [dateRangePreset, setDateRangePreset] = useState("30days"); // "7days", "30days", "90days", "6m", "12m", "custom"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [trendGranularity, setTrendGranularity] = useState<"daily" | "monthly">("daily");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    setError(null);

    // Realtime subscriptions
    const unsubscribeTransactions = TransactionRepository.subscribe(
      user.uid,
      (list) => {
        setTransactions(list);
        setLoading(false);
      },
      (err) => {
        console.error("Realtime transactions subscription error:", err);
        setError("Unable to sync transactions in realtime.");
        setLoading(false);
      }
    );

    const unsubscribeBudgets = BudgetRepository.subscribe(
      user.uid,
      (list) => {
        setBudgets(list);
      },
      (err) => console.error("Realtime budgets subscription error:", err)
    );

    const unsubscribeGoals = GoalRepository.subscribe(
      user.uid,
      (list) => {
        setGoals(list);
      },
      (err) => console.error("Realtime goals subscription error:", err)
    );

    return () => {
      unsubscribeTransactions();
      unsubscribeBudgets();
      unsubscribeGoals();
    };
  }, [user]);

  // Handle switching trend chart default granularity based on date range selection
  useEffect(() => {
    if (dateRangePreset === "6m" || dateRangePreset === "12m") {
      setTrendGranularity("monthly");
    } else {
      setTrendGranularity("daily");
    }
  }, [dateRangePreset]);

  // 1. Filter transactions based on date filters in memory
  const filteredTransactions = useMemo(() => {
    const today = new Date();
    let cutoff = new Date();

    if (dateRangePreset === "7days") {
      cutoff.setDate(today.getDate() - 7);
    } else if (dateRangePreset === "30days") {
      cutoff.setDate(today.getDate() - 30);
    } else if (dateRangePreset === "90days") {
      cutoff.setDate(today.getDate() - 90);
    } else if (dateRangePreset === "6m") {
      cutoff.setMonth(today.getMonth() - 6);
    } else if (dateRangePreset === "12m") {
      cutoff.setMonth(today.getMonth() - 12);
    } else if (dateRangePreset === "custom") {
      return transactions.filter(t => {
        if (startDate && t.date < startDate) return false;
        if (endDate && t.date > endDate) return false;
        return true;
      });
    }

    const cutoffStr = cutoff.toISOString().split("T")[0];
    return transactions.filter(t => t.date >= cutoffStr);
  }, [transactions, dateRangePreset, startDate, endDate]);

  // 2. Calculations: KPI overview
  const kpis = useMemo(() => {
    let income = 0;
    let expenses = 0;

    filteredTransactions.forEach(t => {
      const val = Math.abs(t.amount);
      if (t.type === "income") {
        income += val;
      } else {
        expenses += val;
      }
    });

    const savings = income - expenses;
    const rate = income > 0 ? (savings / income) * 100 : 0;

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netSavings: savings,
      savingsRate: rate
    };
  }, [filteredTransactions]);

  // 3. Line Chart - Spending Trend Data
  const trendData = useMemo(() => {
    if (trendGranularity === "daily") {
      // Group by date
      const map: Record<string, number> = {};
      
      // Seed all dates in the range with 0 to avoid charts having gaps
      const today = new Date();
      let daysCount = 30;
      if (dateRangePreset === "7days") daysCount = 7;
      else if (dateRangePreset === "90days") daysCount = 90;
      else if (dateRangePreset === "custom" && startDate && endDate) {
        const diffTime = Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime());
        daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        if (daysCount > 120) daysCount = 120; // Cap daily seed to avoid clutter
      }

      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        if (dateRangePreset === "custom" && endDate) {
          const endD = new Date(endDate);
          endD.setDate(endD.getDate() - i);
          const dateStr = endD.toISOString().split("T")[0];
          map[dateStr] = 0;
        } else {
          d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          map[dateStr] = 0;
        }
      }

      filteredTransactions.forEach(t => {
        if (t.type === "expense" && map[t.date] !== undefined) {
          map[t.date] += Math.abs(t.amount);
        }
      });

      return Object.entries(map).map(([date, amount]) => {
        // Format YYYY-MM-DD to MM/DD for visual polish
        const parts = date.split("-");
        const formattedDate = parts.length === 3 ? `${parts[1]}/${parts[2]}` : date;
        return {
          name: formattedDate,
          dateKey: date,
          amount: parseFloat(amount.toFixed(2))
        };
      }).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    } else {
      // Group by month
      const map: Record<string, number> = {};

      filteredTransactions.forEach(t => {
        if (t.type === "expense") {
          const monthKey = t.date.substring(0, 7); // YYYY-MM
          map[monthKey] = (map[monthKey] || 0) + Math.abs(t.amount);
        }
      });

      // If empty, seed current and previous months
      const today = new Date();
      const currentMonthKey = today.toISOString().substring(0, 7);
      if (Object.keys(map).length === 0) {
        map[currentMonthKey] = 0;
      }

      return Object.entries(map).map(([month, amount]) => {
        const parts = month.split("-");
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formattedMonth = parts.length === 2 ? `${monthNames[parseInt(parts[1]) - 1]} ${parts[0].substring(2)}` : month;
        return {
          name: formattedMonth,
          dateKey: month,
          amount: parseFloat(amount.toFixed(2))
        };
      }).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    }
  }, [filteredTransactions, trendGranularity, dateRangePreset, startDate, endDate]);

  // 4. Bar Chart - Income vs Expense Monthly data
  const incomeVsExpenseData = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};

    filteredTransactions.forEach(t => {
      const monthKey = t.date.substring(0, 7); // YYYY-MM
      if (!map[monthKey]) {
        map[monthKey] = { income: 0, expense: 0 };
      }
      if (t.type === "income") {
        map[monthKey].income += Math.abs(t.amount);
      } else {
        map[monthKey].expense += Math.abs(t.amount);
      }
    });

    // Seed current month if empty
    const today = new Date();
    const currentMonthKey = today.toISOString().substring(0, 7);
    if (Object.keys(map).length === 0) {
      map[currentMonthKey] = { income: 0, expense: 0 };
    }

    return Object.entries(map).map(([month, val]) => {
      const parts = month.split("-");
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedMonth = parts.length === 2 ? `${monthNames[parseInt(parts[1]) - 1]} ${parts[0].substring(2)}` : month;
      return {
        name: formattedMonth,
        monthKey: month,
        income: parseFloat(val.income.toFixed(2)),
        expense: parseFloat(val.expense.toFixed(2))
      };
    }).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [filteredTransactions]);

  // 5. Pie Chart - Category spending distribution data
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    let totalSpent = 0;

    filteredTransactions.forEach(t => {
      if (t.type === "expense") {
        const val = Math.abs(t.amount);
        map[t.category] = (map[t.category] || 0) + val;
        totalSpent += val;
      }
    });

    return Object.entries(map).map(([name, amount]) => {
      const color = CATEGORY_COLORS[name.toLowerCase()] || DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
      return {
        name,
        value: parseFloat(amount.toFixed(2)),
        percentage: totalSpent > 0 ? parseFloat(((amount / totalSpent) * 100).toFixed(1)) : 0,
        color
      };
    }).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  // 6. Cash Flow Monthly Widget Data
  const cashFlowList = useMemo(() => {
    const map: Record<string, { income: number; expense: number; net: number }> = {};

    transactions.forEach(t => {
      const monthKey = t.date.substring(0, 7); // YYYY-MM
      if (!map[monthKey]) {
        map[monthKey] = { income: 0, expense: 0, net: 0 };
      }
      const val = Math.abs(t.amount);
      if (t.type === "income") {
        map[monthKey].income += val;
      } else {
        map[monthKey].expense += val;
      }
    });

    return Object.entries(map).map(([month, val]) => {
      const netVal = val.income - val.expense;
      const parts = month.split("-");
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedMonth = parts.length === 2 ? `${monthNames[parseInt(parts[1]) - 1]} ${parts[0]}` : month;
      return {
        monthKey: month,
        name: formattedMonth,
        net: parseFloat(netVal.toFixed(2)),
        income: val.income,
        expense: val.expense,
        isPositive: netVal >= 0
      };
    }).sort((a, b) => b.monthKey.localeCompare(a.monthKey)); // Descending order: Newest month first
  }, [transactions]);

  // 7. Spending Insights: Top Spending Category
  const topSpendingCategory = useMemo(() => {
    if (categoryData.length === 0) return null;
    return categoryData[0]; // Sort ranked categories descending, index 0 is top
  }, [categoryData]);

  // 8. Month-over-Month growth metrics
  const monthComparison = useMemo(() => {
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth(); // 0-indexed

    const prevMonthDate = new Date(curYear, curMonth - 1, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth();

    const curMonthPrefix = `${curYear}-${String(curMonth + 1).padStart(2, "0")}`;
    const prevMonthPrefix = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}`;

    let curIncome = 0;
    let curExpense = 0;
    let prevIncome = 0;
    let prevExpense = 0;

    transactions.forEach(t => {
      const val = Math.abs(t.amount);
      if (t.date.startsWith(curMonthPrefix)) {
        if (t.type === "income") curIncome += val;
        else curExpense += val;
      } else if (t.date.startsWith(prevMonthPrefix)) {
        if (t.type === "income") prevIncome += val;
        else prevExpense += val;
      }
    });

    const curSavings = curIncome - curExpense;
    const prevSavings = prevIncome - prevExpense;

    return {
      current: { income: curIncome, expense: curExpense, savings: curSavings },
      previous: { income: prevIncome, expense: prevExpense, savings: prevSavings },
      growth: {
        income: calculateGrowthRate(curIncome, prevIncome),
        expense: calculateGrowthRate(curExpense, prevExpense),
        savings: calculateGrowthRate(curSavings, prevSavings)
      }
    };
  }, [transactions]);

  // 9. Budget Performance & Savings Insights calculations
  const budgetPerformance = useMemo(() => {
    // Current month expenses by category
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth();
    const spending: Record<string, number> = {};

    transactions.forEach(t => {
      if (t.type !== "expense") return;
      const tDate = new Date(t.date);
      if (tDate.getMonth() === curMonth && tDate.getFullYear() === curYear) {
        spending[t.category] = (spending[t.category] || 0) + Math.abs(t.amount);
      }
    });

    const exceeded: Array<{ category: string; limit: number; spent: number; overBy: number }> = [];
    const underutilized: Array<{ category: string; limit: number; spent: number; pct: number }> = [];

    budgets.forEach(b => {
      const spent = spending[b.category] || 0;
      const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      
      if (spent > b.amount) {
        exceeded.push({
          category: b.category,
          limit: b.amount,
          spent,
          overBy: spent - b.amount
        });
      } else if (pct < 50) {
        underutilized.push({
          category: b.category,
          limit: b.amount,
          spent,
          pct
        });
      }
    });

    // Sort underutilized lowest ratio first
    underutilized.sort((a, b) => a.pct - b.pct);

    return { exceeded, underutilized };
  }, [transactions, budgets]);

  const savingsInsights = useMemo(() => {
    // Savings this month
    const today = new Date();
    const curMonthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    let savedThisMonth = 0;

    transactions.forEach(t => {
      if (t.date.startsWith(curMonthPrefix)) {
        if (t.type === "income") {
          savedThisMonth += Math.abs(t.amount);
        } else {
          savedThisMonth -= Math.abs(t.amount);
        }
      }
    });

    // Find goal closest to completion (highest percentage but < 100%)
    const incompleteGoals = goals
      .map(g => ({
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        pct: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0
      }))
      .filter(g => g.pct < 100);

    const closestGoal = incompleteGoals.length > 0 
      ? incompleteGoals.sort((a, b) => b.pct - a.pct)[0] 
      : null;

    return { savedThisMonth, closestGoal };
  }, [transactions, goals]);

  // Render skeletons during initial loading
  if (loading || !mounted) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-6 w-48 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          <div className="h-3 w-72 bg-neutral-200 dark:bg-neutral-900 rounded animate-pulse" />
        </div>

        {/* Filters skeleton */}
        <div className="h-14 w-full bg-neutral-200 dark:bg-neutral-800 rounded-2xl animate-pulse" />

        {/* Cards grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-5 h-28 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 rounded-2xl flex flex-col justify-between animate-pulse">
              <div className="h-3.5 w-16 bg-neutral-200 dark:bg-neutral-800 rounded" />
              <div className="h-6 w-28 bg-neutral-300 dark:bg-neutral-800 rounded" />
              <div className="h-3 w-24 bg-neutral-200 dark:bg-neutral-900 rounded" />
            </div>
          ))}
        </div>

        {/* Main Charts skeleton layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 h-96 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 rounded-2xl animate-pulse lg:col-span-2" />
          <div className="p-6 h-96 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Render onboarding empty state when no transactions are configured
  if (transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Financial Analytics</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Detailed charts, spending distributions, and category-wise rankings.
          </p>
        </div>

        <div className="p-12 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-3xl bg-white dark:bg-neutral-950/10">
          <PieIcon className="w-12 h-12 mx-auto text-neutral-400 dark:text-neutral-600 mb-4 animate-bounce" />
          <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">No transaction data available yet</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 max-w-sm mx-auto leading-relaxed">
            Analytics require cash records to render category distribution charts, cash flow lists, and spending trend graphs. Start adding transactions on the dashboard to unlock analytics.
          </p>
        </div>
      </div>
    );
  }

  const renderGrowth = (value: number | null, current: number, isExpense: boolean = false) => {
    if (value === null) {
      const label = current > 0 ? "New" : "N/A";
      return (
        <span className="font-bold text-neutral-500 dark:text-neutral-400">
          {label}
        </span>
      );
    }

    const isPositive = value >= 0;
    const isGood = isExpense ? !isPositive : isPositive;
    const colorClass = isGood ? "text-emerald-500" : "text-red-500";

    return (
      <div className={`flex items-center gap-1 font-bold ${colorClass}`}>
        {isPositive ? "+" : ""}
        {value.toFixed(0)}%
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Preset Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Financial Analytics</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Detailed indicators, outflow distributions, and MoM analytics ranking.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg bg-neutral-100 dark:bg-neutral-900 p-0.5 border border-neutral-200 dark:border-neutral-800 text-[10px] font-semibold text-neutral-500">
            {[
              { id: "7days", name: "7 Days" },
              { id: "30days", name: "30 Days" },
              { id: "90days", name: "90 Days" },
              { id: "6m", name: "6 Months" },
              { id: "12m", name: "12 Months" },
              { id: "custom", name: "Custom" }
            ].map(preset => (
              <button
                key={preset.id}
                onClick={() => setDateRangePreset(preset.id)}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  dateRangePreset === preset.id
                    ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs"
                    : "hover:text-neutral-800 dark:hover:text-neutral-300"
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Custom Date interval range picker */}
          {dateRangePreset === "custom" && (
            <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-150">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 h-7 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent text-[10px] text-neutral-900 dark:text-white focus:border-amber-500 outline-none"
              />
              <span className="text-[10px] text-neutral-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 h-7 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent text-[10px] text-neutral-900 dark:text-white focus:border-amber-500 outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-xs">{error}</p>
        </div>
      )}

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI Income */}
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 relative overflow-hidden group">
          <div className="flex justify-between items-center text-neutral-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Total Income</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/25">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white mt-2">
            {currency}{kpis.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1.5">Selected period inflows</p>
        </div>

        {/* KPI Expenses */}
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 relative overflow-hidden group">
          <div className="flex justify-between items-center text-neutral-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Total Expenses</span>
            <div className="w-7 h-7 rounded-lg bg-red-500/5 dark:bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/25">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white mt-2">
            {currency}{kpis.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1.5">Selected period outflows</p>
        </div>

        {/* KPI Net Savings */}
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 relative overflow-hidden group">
          <div className="flex justify-between items-center text-neutral-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Net Savings</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
              kpis.netSavings >= 0 
                ? "bg-amber-500/5 dark:bg-amber-500/10 text-amber-500 border-amber-500/25" 
                : "bg-amber-500/5 dark:bg-amber-500/10 text-amber-500 border-amber-500/25"
            }`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl font-bold mt-2 ${kpis.netSavings >= 0 ? "text-neutral-900 dark:text-white" : "text-amber-500"}`}>
            {kpis.netSavings < 0 ? "-" : ""}{currency}{Math.abs(kpis.netSavings).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1.5">Net cash margins saved</p>
        </div>

        {/* KPI Savings Rate */}
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 relative overflow-hidden group">
          <div className="flex justify-between items-center text-neutral-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Savings Rate</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/5 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/25">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white mt-2">
            {kpis.savingsRate.toFixed(1)}%
          </div>
          <p className="text-[10px] text-neutral-400 mt-1.5">Saved relative to inflow</p>
        </div>
      </div>

      {/* Row 1: Line Chart Spending Trend & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly/Daily Spending Trend Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 dark:border-neutral-900 pb-4 mb-4 gap-3">
            <div>
              <h3 className="text-xs font-bold text-neutral-900 dark:text-white">Spending Outflow Trend</h3>
              <p className="text-[10px] text-neutral-400 mt-0.5">Tracking debit distributions over time interval presets.</p>
            </div>

            {/* Granularity Switcher */}
            <div className="inline-flex rounded-lg bg-neutral-100 dark:bg-neutral-900 p-0.5 border border-neutral-200 dark:border-neutral-800 text-[9px] font-bold">
              <button 
                onClick={() => setTrendGranularity("daily")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  trendGranularity === "daily" 
                    ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs" 
                    : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
              >
                Daily
              </button>
              <button 
                onClick={() => setTrendGranularity("monthly")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  trendGranularity === "monthly" 
                    ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs" 
                    : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="h-72 w-full text-[10px]">
            {trendData.length === 0 || (trendData.length === 1 && trendData[0].amount === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <p className="text-neutral-500 font-semibold">No expense records found</p>
                <p className="text-[10px] text-neutral-400 max-w-xs mt-1">Change dates or presets to display timeline charts.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.15)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="gray" 
                    tickLine={false} 
                    axisLine={false}
                    dy={10} 
                  />
                  <YAxis 
                    stroke="gray" 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `${currency}${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(23, 23, 23, 0.95)", 
                      borderColor: "rgba(128,128,128,0.2)",
                      borderRadius: "12px", 
                      fontSize: "11px",
                      color: "white" 
                    }}
                    formatter={(val) => [`${currency}${val}`, "Expense"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="var(--brand-500)" 
                    strokeWidth={3} 
                    dot={{ fill: "var(--brand-500)", strokeWidth: 1 }} 
                    activeDot={{ r: 6, fill: "#fff", stroke: "var(--brand-500)", strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Spending Breakdown Pie Chart */}
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 flex flex-col justify-between">
          <div className="border-b border-neutral-100 dark:border-neutral-900 pb-4 mb-4">
            <h3 className="text-xs font-bold text-neutral-900 dark:text-white">Category Distribution</h3>
            <p className="text-[10px] text-neutral-400 mt-0.5">Top expense ranking distribution metrics.</p>
          </div>

          {categoryData.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-center">
              <PieIcon className="w-8 h-8 text-neutral-400 mb-2" />
              <p className="text-neutral-500 text-xs font-semibold">No expenses categorized</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-44 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "rgba(23, 23, 23, 0.95)", 
                        borderColor: "rgba(128,128,128,0.2)",
                        borderRadius: "12px", 
                        fontSize: "11px",
                        color: "white" 
                      }}
                      formatter={(val, name, entry) => [`${currency}${val} (${entry.payload.percentage}%)`, name]}
                    />
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center metric */}
                <div className="absolute text-center flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[9px] text-neutral-400 font-semibold uppercase">Total Out</span>
                  <span className="text-base font-extrabold text-neutral-900 dark:text-white">
                    {currency}{kpis.totalExpenses.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Legends list */}
              <div className="max-h-24 overflow-y-auto pr-1 space-y-1.5 text-[10px]">
                {categoryData.slice(0, 4).map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300 capitalize">{item.name}</span>
                    </div>
                    <span className="text-neutral-500 font-bold">{currency}{item.value.toFixed(0)} ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Income vs Expense comparison Bar Chart & Spending Insights + MoM Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Income vs Expense Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 flex flex-col justify-between">
          <div className="border-b border-neutral-100 dark:border-neutral-900 pb-4 mb-4">
            <h3 className="text-xs font-bold text-neutral-900 dark:text-white">Income vs Expense Monthly Cashflow</h3>
            <p className="text-[10px] text-neutral-400 mt-0.5">Compare credit inflows versus expense outlays side-by-side.</p>
          </div>

          <div className="h-72 w-full text-[10px]">
            {incomeVsExpenseData.length === 0 || (incomeVsExpenseData.length === 1 && incomeVsExpenseData[0].income === 0 && incomeVsExpenseData[0].expense === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <p className="text-neutral-500 font-semibold">No data points available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeVsExpenseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.15)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="gray" 
                    tickLine={false} 
                    axisLine={false}
                    dy={10} 
                  />
                  <YAxis 
                    stroke="gray" 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `${currency}${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(23, 23, 23, 0.95)", 
                      borderColor: "rgba(128,128,128,0.2)",
                      borderRadius: "12px", 
                      fontSize: "11px",
                      color: "white" 
                    }}
                    formatter={(val) => [`${currency}${val}`]}
                    cursor={false}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    height={36} 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "10px", color: "gray" }}
                  />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="expense" name="Expense" fill="var(--brand-500)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Spending Insights & Month-over-Month Comparison */}
        <div className="space-y-6">
          
          {/* Spending Insights Card */}
          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 space-y-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">AI Spending Insights</h3>
            </div>

            {topSpendingCategory ? (
              <div className="space-y-3">
                <p className="text-xs text-neutral-600 dark:text-gray-300 leading-relaxed">
                  Your primary expenditure area is <strong className="text-neutral-900 dark:text-white capitalize">{topSpendingCategory.name}</strong>, accounting for <strong className="text-amber-600 dark:text-amber-400">{topSpendingCategory.percentage}%</strong> of overall outlays in the selected period.
                </p>

                <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-neutral-400">Top Outlay Category</p>
                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 capitalize mt-0.5">{topSpendingCategory.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-neutral-400">Total Charged</p>
                    <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{currency}{topSpendingCategory.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-500 leading-relaxed">
                Log some expense transactions to unlock dynamic spending analytics and alerts.
              </p>
            )}
          </div>

          {/* Month-over-Month Growth comparison card */}
          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 space-y-4">
            <h3 className="text-xs font-bold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-900 pb-3">
              Monthly Comparison (MoM)
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">Income Growth</span>
                {renderGrowth(monthComparison.growth.income, monthComparison.current.income, false)}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">Expense Growth</span>
                {renderGrowth(monthComparison.growth.expense, monthComparison.current.expense, true)}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">Savings Growth</span>
                {renderGrowth(monthComparison.growth.savings, monthComparison.current.savings, false)}
              </div>
            </div>
            
            <p className="text-[10px] text-neutral-400 leading-normal pt-1.5 border-t border-neutral-100 dark:border-neutral-900/60">
              Compares metrics of the current calendar month against the previous month.
            </p>
          </div>

        </div>
      </div>

      {/* Row 3: Monthly Cash Flow widget table */}
      <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 space-y-4">
        <div>
          <h3 className="text-xs font-bold text-neutral-900 dark:text-white">Monthly Cash Flow Breakdown</h3>
          <p className="text-[10px] text-neutral-400 mt-0.5">Historical breakdown of monthly performance margins (Inflow - Outflow).</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 tracking-wider bg-neutral-50/50 dark:bg-neutral-900/10">
                <th className="py-2.5 px-4">Month</th>
                <th className="py-2.5 px-4 text-right">Income</th>
                <th className="py-2.5 px-4 text-right">Expenses</th>
                <th className="py-2.5 px-4 text-right">Net Flow</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
              {cashFlowList.slice(0, 6).map((flow) => (
                <tr key={flow.monthKey} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10 transition-colors">
                  <td className="py-3 px-4 font-semibold text-neutral-800 dark:text-neutral-200">{flow.name}</td>
                  <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-450 font-medium">{currency}{Math.abs(flow.income).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4 text-right text-neutral-800 dark:text-neutral-300">{currency}{Math.abs(flow.expense).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className={`py-3 px-4 text-right font-bold ${flow.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                    {flow.net >= 0 ? "+" : "-"}{currency}{Math.abs(flow.net).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 h-5 rounded-full text-[9px] font-semibold ${
                      flow.isPositive 
                        ? "bg-emerald-500/5 text-emerald-600 border border-emerald-500/20" 
                        : "bg-red-500/5 text-red-500 border border-red-500/20"
                    }`}>
                      {flow.isPositive ? "Positive" : "Negative"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 4: Budget Performance & Savings Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Budget Performance Card */}
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Budget Performance</h3>
            <p className="text-[10px] text-neutral-400 mt-0.5">Category budget usage and compliance alerts.</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Exceeded category limits */}
            <div>
              <span className="font-semibold text-neutral-500 block mb-2">Exceeded Budgets</span>
              {budgetPerformance.exceeded.length === 0 ? (
                <p className="text-[11px] text-emerald-500 font-medium bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl">All active budgets are within limits. Great job!</p>
              ) : (
                <div className="space-y-2">
                  {budgetPerformance.exceeded.map(b => (
                    <div key={b.category} className="p-2.5 rounded-lg border border-red-500/10 bg-red-500/5 text-red-700 dark:text-red-300 flex justify-between items-center capitalize">
                      <span className="font-semibold">{b.category}</span>
                      <span className="font-bold">Over by {currency}{(b.spent - b.limit).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Underutilized category limits (< 50% spent ratio) */}
            <div>
              <span className="font-semibold text-neutral-500 block mb-2">Underutilized Budgets (&lt; 50% Spent)</span>
              {budgetPerformance.underutilized.length === 0 ? (
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900/10 border border-neutral-100 dark:border-neutral-900/50 p-2.5 rounded-xl">No underutilized budgets.</p>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {budgetPerformance.underutilized.map(b => (
                    <div key={b.category} className="p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/10 flex justify-between items-center capitalize">
                      <span className="text-neutral-700 dark:text-gray-300">{b.category}</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">{b.pct.toFixed(0)}% Used</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Savings Insights Card */}
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Savings Insights</h3>
            <p className="text-[10px] text-neutral-400 mt-0.5">Tracking savings growth and targets milestone completion.</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Total monthly savings */}
            <div className="p-3.5 rounded-xl border border-amber-500/15 bg-amber-500/5 dark:bg-amber-500/10 flex justify-between items-center">
              <div>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">Net Savings This Month</span>
                <p className="text-[10px] text-neutral-400 mt-0.5">(Total credit inflows - debits)</p>
              </div>
              <span className={`text-base font-extrabold ${savingsInsights.savedThisMonth >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {savingsInsights.savedThisMonth >= 0 ? "+" : ""}{currency}{savingsInsights.savedThisMonth.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            {/* Closest Goal to completion */}
            <div>
              <span className="font-semibold text-neutral-500 block mb-2">Goal Closest to Completion</span>
              {(() => {
                const closestGoal = savingsInsights.closestGoal;
                if (!closestGoal) {
                  return <p className="text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900/10 border border-neutral-100 dark:border-neutral-900/50 p-2.5 rounded-xl">No active goals found.</p>;
                }
                return (
                  <div className="p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/10 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">{closestGoal.name}</span>
                      <span className="font-extrabold text-amber-600 dark:text-amber-400">{closestGoal.pct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-900 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${closestGoal.pct}%` }}
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      />
                    </div>
                    <p className="text-[10px] text-neutral-400 text-right mt-1.5">
                      {currency}{closestGoal.currentAmount.toLocaleString()} saved of {currency}{closestGoal.targetAmount.toLocaleString()} target
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
