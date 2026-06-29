"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getCurrencySymbol } from "@/lib/finance";
import { BudgetRepository, Budget } from "@/repositories/budget.repository";
import { TransactionRepository, Transaction } from "@/repositories/transaction.repository";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Wallet, 
  TrendingUp, 
  AlertTriangle,
  Loader2,
  X 
} from "lucide-react";

export default function BudgetsPage() {
  const { user } = useAuth();
  const { currency: currencyCode } = useTheme();
  const currency = getCurrencySymbol(currencyCode);
  
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState("Food");
  const [modalAmount, setModalAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    "Food",
    "Shopping",
    "Rent",
    "Travel",
    "Entertainment",
    "Bills",
    "Health",
    "Education",
    "Other"
  ];

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    const unsubscribeBudgets = BudgetRepository.subscribe(
      user.uid,
      (list) => {
        setBudgets(list);
      },
      (err) => console.error("Budgets subscription error:", err)
    );

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

    return () => {
      unsubscribeBudgets();
      unsubscribeTransactions();
    };
  }, [user]);

  // Calculate monthly spending by category for the current month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const getMonthlySpendingByCategory = () => {
    const map: Record<string, number> = {};
    
    transactions.forEach(t => {
      if (t.type !== "expense") return;
      
      const tDate = new Date(t.date);
      if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
        map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
      }
    });

    return map;
  };

  const spendingMap = getMonthlySpendingByCategory();

  const handleOpenAddModal = () => {
    setModalCategory("Food");
    setModalAmount("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (budget: Budget) => {
    setModalCategory(budget.category);
    setModalAmount(budget.amount.toString());
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !modalCategory || !modalAmount) return;

    setSubmitting(true);
    try {
      const budgetAmount = parseFloat(modalAmount);
      const newBudget: Budget = {
        category: modalCategory,
        amount: budgetAmount,
        period: "monthly"
      };

      await BudgetRepository.save(user.uid, newBudget);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save budget:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBudget = async (category: string) => {
    if (!user) return;
    if (!confirm(`Are you sure you want to delete the budget for ${category}?`)) return;

    try {
      await BudgetRepository.delete(user.uid, category);
    } catch (err) {
      console.error("Failed to delete budget:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  // Calculate budget statistics
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpentOnBudgets = budgets.reduce((sum, b) => sum + (spendingMap[b.category] || 0), 0);
  const totalRemaining = totalBudgeted - totalSpentOnBudgets;
  const overallPercentage = totalBudgeted > 0 ? (totalSpentOnBudgets / totalBudgeted) * 100 : 0;

  // Calculate active budget alerts (80% used, or exceeded)
  const budgetAlerts = budgets.map(b => {
    const spent = spendingMap[b.category] || 0;
    const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    if (percentage >= 100) {
      return {
        id: `over-${b.category}`,
        type: "exceeded" as const,
        message: `You have exceeded your ${b.category} budget.`,
        percentage
      };
    } else if (percentage >= 80) {
      return {
        id: `near-${b.category}`,
        type: "warning" as const,
        message: `You have used ${percentage.toFixed(0)}% of your ${b.category} budget.`,
        percentage
      };
    }
    return null;
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Budget Guard</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Establish category limits to track and control your monthly outflow.
          </p>
        </div>

        <button 
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-1.5 justify-center text-xs font-semibold px-4 h-9 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors cursor-pointer shadow-[0_0_15px_rgba(79,70,229,0.2)]"
        >
          <Plus className="w-4 h-4" />
          <span>Set Budget</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40">
          <div className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Total Budgeted</div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white mt-1.5">
            {currency}{totalBudgeted.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40">
          <div className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Total Spent</div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white mt-1.5">
            {currency}{totalSpentOnBudgets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            <span className="text-xs font-normal text-neutral-400 ml-1.5">
              ({overallPercentage.toFixed(0)}% used)
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40">
          <div className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Remaining</div>
          <div className="text-xl font-bold mt-1.5 text-neutral-900 dark:text-white">
            <span className={totalRemaining < 0 ? "text-red-500" : "text-emerald-500"}>
              {totalRemaining < 0 ? "-" : ""}{currency}{Math.abs(totalRemaining).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Realtime Budget Alerts notifications */}
      {budgetAlerts.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Active Alerts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {budgetAlerts.map(alert => (
              <div 
                key={alert.id}
                className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                  alert.type === "exceeded" 
                    ? "border-red-500/20 bg-red-500/5 text-red-700 dark:text-red-300" 
                    : "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-300"
                }`}
              >
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${alert.type === "exceeded" ? "text-red-500 animate-bounce" : "text-amber-500"}`} />
                <div className="text-xs font-semibold leading-normal">{alert.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Progress Bar */}
      {totalBudgeted > 0 && (
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Overall Budget Consumption</span>
            <span className="text-neutral-500">{overallPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
            <div 
              style={{ width: `${Math.min(overallPercentage, 100)}%` }}
              className={`h-full transition-all duration-500 ${
                overallPercentage > 100 
                  ? "bg-red-600" 
                  : overallPercentage >= 91 
                    ? "bg-red-500" 
                    : overallPercentage >= 71 
                      ? "bg-amber-500" 
                      : "bg-emerald-500"
              }`}
            />
          </div>
        </div>
      )}

      {/* Budgets Grid */}
      {budgets.length === 0 ? (
        <div className="border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl p-12 text-center bg-white dark:bg-neutral-950/10">
          <Wallet className="w-10 h-10 mx-auto text-neutral-400 dark:text-neutral-500 mb-3" />
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">No active budgets</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
            Establishing budget targets alerts you before you spend, helping you save money automatically.
          </p>
          <button 
            onClick={handleOpenAddModal}
            className="mt-4 inline-flex items-center gap-1 px-4 h-9 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Set Your First Budget</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {budgets.map((budget) => {
            const spent = spendingMap[budget.category] || 0;
            const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            const remaining = budget.amount - spent;
            const isOver = remaining < 0;

            let progressColor = "bg-emerald-500";
            let textColor = "text-emerald-500";
            
            if (percentage > 100) {
              progressColor = "bg-red-600 animate-pulse";
              textColor = "text-red-600 font-semibold";
            } else if (percentage >= 91) {
              progressColor = "bg-red-500";
              textColor = "text-red-500";
            } else if (percentage >= 71) {
              progressColor = "bg-amber-500";
              textColor = "text-amber-500";
            }

            return (
              <div 
                key={budget.category}
                className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 space-y-4 hover:shadow-md transition-shadow duration-200"
              >
                {/* Category Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white capitalize">{budget.category}</h3>
                    <p className="text-[10px] text-neutral-400 mt-0.5">Monthly Limit</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(budget)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                      title="Edit Budget"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBudget(budget.category)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                      title="Delete Budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-500 font-medium">
                      Spent: <strong className="text-neutral-700 dark:text-neutral-300">{currency}{spent.toFixed(0)}</strong>
                    </span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${textColor}`}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                    />
                  </div>
                </div>

                {/* Details Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-900 text-xs">
                  <span className="text-neutral-400">Limit: {currency}{budget.amount}</span>
                  {isOver ? (
                    <span className="text-red-500 flex items-center gap-1 text-[11px] font-medium animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      Over by {currency}{Math.abs(remaining).toFixed(0)}
                    </span>
                  ) : (
                    <span className="text-neutral-500 text-[11px]">
                      {currency}{remaining.toFixed(0)} remaining
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Configure Category Budget</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Category
                </label>
                <select
                  value={modalCategory}
                  onChange={(e) => setModalCategory(e.target.value)}
                  className="w-full h-10 px-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent dark:bg-neutral-900 text-neutral-900 dark:text-white focus:border-amber-500 outline-none transition-colors"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Monthly Limit ({currency})
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 500"
                  value={modalAmount}
                  onChange={(e) => setModalAmount(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 focus:border-amber-500 outline-none transition-colors"
                />
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                    "Save Limit"
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
