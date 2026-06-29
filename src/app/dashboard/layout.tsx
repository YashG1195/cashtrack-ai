"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { Loader2 } from "lucide-react";
import { BudgetRepository, Budget } from "@/repositories/budget.repository";
import { TransactionRepository, Transaction } from "@/repositories/transaction.repository";
import { NotificationRepository, AppNotification } from "@/repositories/notification.repository";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[] | null>(null);
  const processingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Real-time subscriptions for budget alert matching
  useEffect(() => {
    if (!user) return;

    const unsubBudgets = BudgetRepository.subscribe(
      user.uid,
      (list) => setBudgets(list),
      (err) => console.error("Layout budget subscription error:", err)
    );

    const unsubTransactions = TransactionRepository.subscribe(
      user.uid,
      (list) => setTransactions(list),
      (err) => console.error("Layout transactions subscription error:", err)
    );

    const unsubNotifications = NotificationRepository.subscribe(
      user.uid,
      (list) => setNotifications(list),
      (err) => console.error("Layout notifications subscription error:", err)
    );

    return () => {
      unsubBudgets();
      unsubTransactions();
      unsubNotifications();
    };
  }, [user]);

  // Sync effect to compute and generate budget alert notifications
  useEffect(() => {
    if (!user || budgets.length === 0 || transactions.length === 0 || !notifications) return;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // 1. Calculate spending by category
    const spendingMap: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.type !== "expense") return;
      const tDate = new Date(t.date);
      if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
        spendingMap[t.category] = (spendingMap[t.category] || 0) + Math.abs(t.amount);
      }
    });

    // 2. Loop budgets and verify limits
    budgets.forEach(async (b) => {
      const spent = spendingMap[b.category] || 0;
      const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;

      let alertType: "exceeded" | "warning" | null = null;
      let title = "";
      let message = "";

      if (percentage >= 100) {
        alertType = "exceeded";
        title = "Budget Exceeded";
        message = `You have exceeded your ${b.category} budget.`;
      } else if (percentage >= 80) {
        alertType = "warning";
        title = "Budget Warning";
        message = `You have used ${percentage.toFixed(0)}% of your ${b.category} budget.`;
      }

      if (!alertType) return;

      const key = `${user.uid}-${b.category}-${alertType}-${currentMonth}-${currentYear}`;
      if (processingRef.current.has(key)) return;

      const exists = notifications.some((n) => {
        const nDate = new Date(n.createdAt);
        const matchesCategory = n.message.includes(b.category);
        const matchesTitle = n.title === title;
        const matchesMonth = nDate.getMonth() === currentMonth && nDate.getFullYear() === currentYear;
        return n.type === "budget" && matchesCategory && matchesTitle && matchesMonth;
      });

      if (!exists) {
        processingRef.current.add(key);
        try {
          await NotificationRepository.add(user.uid, {
            title,
            message,
            type: "budget"
          });
        } catch (err) {
          console.error("Failed to sync budget alert notification:", err);
          processingRef.current.delete(key);
        }
      }
    });
  }, [user, budgets, transactions, notifications]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-amber-600 dark:text-amber-400" />
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      {/* Sidebar Navigation */}
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header */}
        <Navbar setMobileOpen={setMobileOpen} />

        {/* Dynamic Page Scroll Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-neutral-50 dark:bg-neutral-900/10">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
