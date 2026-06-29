"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getCurrencySymbol } from "@/lib/finance";
import { TransactionRepository, Transaction } from "@/repositories/transaction.repository";
import { 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  Calendar, 
  ChevronDown, 
  SlidersHorizontal, 
  Trash2, 
  Edit3, 
  Plus, 
  Loader2, 
  AlertCircle, 
  X, 
  Tag,
  ArrowUpDown,
  CreditCard
} from "lucide-react";
import TransactionModal from "@/components/dashboard/TransactionModal";
import DeleteConfirmModal from "@/components/dashboard/DeleteConfirmModal";

export default function TransactionsPage() {
  const { user } = useAuth();
  const { currency: currencyCode } = useTheme();
  const currency = getCurrencySymbol(currencyCode);
  // States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search, Filters & Sorting State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [datePreset, setDatePreset] = useState("all"); // "all", "7days", "30days", "thismonth", "custom"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Modal States
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Subscribe to real-time transactions
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    setError(null);

    // Realtime subscription
    const unsubscribe = TransactionRepository.subscribe(
      user.uid,
      (list) => {
        setTransactions(list);
        setLoading(false);
      },
      (err) => {
        console.error("Realtime subscription error:", err);
        setError("Unable to sync transactions in realtime. Please check your credentials.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Dynamically extract unique categories for filter options
  const uniqueCategories = useMemo(() => {
    const categoriesSet = new Set<string>();
    transactions.forEach(t => {
      if (t.category) {
        categoriesSet.add(t.category);
      }
    });
    return Array.from(categoriesSet).sort();
  }, [transactions]);

  // Handle Search, Filters, and Sorting in Memory
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Search Query
    if (searchQuery.trim()) {
      const queryStr = searchQuery.toLowerCase().trim();
      result = result.filter(
        t => t.category.toLowerCase().includes(queryStr) || 
             t.merchant.toLowerCase().includes(queryStr) ||
             (t.note && t.note.toLowerCase().includes(queryStr))
      );
    }

    // Type Filter
    if (filterType !== "all") {
      result = result.filter(t => t.type === filterType);
    }

    // Category Filter
    if (filterCategory !== "all") {
      result = result.filter(t => t.category.toLowerCase() === filterCategory.toLowerCase());
    }

    // Date Range Filter
    const today = new Date();
    if (datePreset === "7days") {
      const cutoff = new Date();
      cutoff.setDate(today.getDate() - 7);
      const cutoffStr = cutoff.toISOString().split("T")[0];
      result = result.filter(t => t.date >= cutoffStr);
    } else if (datePreset === "30days") {
      const cutoff = new Date();
      cutoff.setDate(today.getDate() - 30);
      const cutoffStr = cutoff.toISOString().split("T")[0];
      result = result.filter(t => t.date >= cutoffStr);
    } else if (datePreset === "thismonth") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startStr = startOfMonth.toISOString().split("T")[0];
      result = result.filter(t => t.date >= startStr);
    } else if (datePreset === "custom") {
      if (startDate) {
        result = result.filter(t => t.date >= startDate);
      }
      if (endDate) {
        result = result.filter(t => t.date <= endDate);
      }
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "newest") {
        return b.date.localeCompare(a.date);
      } else if (sortBy === "oldest") {
        return a.date.localeCompare(b.date);
      } else if (sortBy === "highest") {
        return Math.abs(b.amount) - Math.abs(a.amount);
      } else if (sortBy === "lowest") {
        return Math.abs(a.amount) - Math.abs(b.amount);
      }
      return 0;
    });

    return result;
  }, [transactions, searchQuery, filterType, filterCategory, datePreset, startDate, endDate, sortBy]);

  // Actions
  const handleOpenAddModal = () => {
    setSelectedTx(null);
    setIsTxModalOpen(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setSelectedTx(tx);
    setIsTxModalOpen(true);
  };

  const handleOpenDeleteModal = (tx: Transaction) => {
    setSelectedTx(tx);
    setIsDeleteOpen(true);
  };

  const handleSaveTransaction = async (txInput: any) => {
    if (!user) return;
    if (selectedTx) {
      // Edit
      await TransactionRepository.update(user.uid, selectedTx.id, txInput);
    } else {
      // Add
      await TransactionRepository.add(user.uid, txInput);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!user || !selectedTx) return;
    await TransactionRepository.delete(user.uid, selectedTx.id);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setFilterCategory("all");
    setDatePreset("all");
    setStartDate("");
    setEndDate("");
    setSortBy("newest");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Transaction Logs</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Query, manage, and analyze your credit and debit records.
          </p>
        </div>

        <button 
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-1.5 justify-center text-xs font-semibold px-4 h-9 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors cursor-pointer shadow-[0_0_15px_rgba(79,70,229,0.2)]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold">Synchronization Error</p>
            <p className="text-xs mt-0.5 text-neutral-600 dark:text-neutral-400">{error}</p>
          </div>
        </div>
      )}

      {/* Query Filter Toolbar */}
      <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search category, merchant, note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 focus:border-amber-500 dark:focus:border-amber-500 outline-none transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Type Filter Pill Switcher */}
            <div className="inline-flex rounded-lg bg-neutral-100 dark:bg-neutral-900 p-0.5 border border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1 text-[10px] font-semibold rounded-md transition-all ${
                  filterType === "all"
                    ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType("income")}
                className={`px-3 py-1 text-[10px] font-semibold rounded-md transition-all ${
                  filterType === "income"
                    ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                Incomes
              </button>
              <button
                onClick={() => setFilterType("expense")}
                className={`px-3 py-1 text-[10px] font-semibold rounded-md transition-all ${
                  filterType === "expense"
                    ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                Expenses
              </button>
            </div>

            {/* Collapsible Panel Button */}
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`inline-flex items-center gap-1.5 px-3 h-9 border rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                showFiltersPanel || filterCategory !== "all" || datePreset !== "all"
                  ? "border-amber-600/40 bg-amber-500/5 text-amber-600 dark:text-amber-400"
                  : "border-neutral-300 dark:border-neutral-800 bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-400"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {(filterCategory !== "all" || datePreset !== "all") && (
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>

            {/* Sorting Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="pl-3 pr-8 h-9 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-xs font-semibold text-neutral-600 dark:text-neutral-400 focus:border-amber-500 dark:focus:border-amber-500 outline-none transition-colors appearance-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>
              <ArrowUpDown className="absolute right-3 top-3 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
            </div>

            {/* Reset Button */}
            {(searchQuery || filterType !== "all" || filterCategory !== "all" || datePreset !== "all" || sortBy !== "newest") && (
              <button
                onClick={clearAllFilters}
                className="p-1.5 rounded-lg text-xs text-neutral-400 hover:text-red-500 hover:bg-red-500/5 transition-colors cursor-pointer"
                title="Clear Filters"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Advanced Filters Panel */}
        {showFiltersPanel && (
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-900 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200">
            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Category
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full pl-9 pr-3 h-8.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-xs text-neutral-900 dark:text-white outline-none focus:border-amber-500 appearance-none"
                >
                  <option value="all">All Categories</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            {/* Date Preset selection */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Date Range
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                <select
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value)}
                  className="w-full pl-9 pr-3 h-8.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-xs text-neutral-900 dark:text-white outline-none focus:border-amber-500 appearance-none"
                >
                  <option value="all">All Time</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="thismonth">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            {/* Custom Date Inputs */}
            {datePreset === "custom" && (
              <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
                <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Custom Interval
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 px-2.5 h-8.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-xs text-neutral-900 dark:text-white outline-none focus:border-amber-500"
                  />
                  <span className="text-neutral-400 text-xs">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 px-2.5 h-8.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-xs text-neutral-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Results Table */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 overflow-hidden">
        {loading ? (
          // Skeleton Loader
          <div className="divide-y divide-neutral-200 dark:divide-neutral-900">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="p-4 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-24 bg-neutral-300 dark:bg-neutral-800 rounded" />
                    <div className="h-2.5 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
                  </div>
                </div>
                <div className="h-4.5 w-16 bg-neutral-300 dark:bg-neutral-800 rounded" />
              </div>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          // Empty State
          <div className="p-12 text-center">
            <CreditCard className="w-10 h-10 mx-auto text-neutral-400 dark:text-neutral-600 mb-3" />
            <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">No transactions found</h4>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5 max-w-sm mx-auto">
              We couldn&apos;t find matching records. Clear your query filter search, or add a new log to get started.
            </p>
            {transactions.length === 0 ? (
              <button 
                onClick={handleOpenAddModal}
                className="mt-4 inline-flex items-center gap-1 px-4 h-9 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Log Your First Transaction</span>
              </button>
            ) : (
              <button
                onClick={clearAllFilters}
                className="mt-4 px-3.5 h-8 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-lg text-xs font-semibold cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900"
              >
                Clear Active Filters
              </button>
            )}
          </div>
        ) : (
          // Responsive Table View
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 tracking-wider bg-neutral-50/50 dark:bg-neutral-900/10">
                  <th className="py-3 px-5">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Merchant / Note</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                {filteredTransactions.map((tx) => {
                  const isIncome = tx.type === "income";
                  return (
                    <tr 
                      key={tx.id} 
                      className="group hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10 text-xs transition-colors duration-150"
                    >
                      {/* Type column */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <div className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center border ${
                            isIncome 
                              ? "bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                              : "bg-red-500/5 dark:bg-red-500/10 text-red-500 border-red-500/20"
                          }`}>
                            {isIncome ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          </div>
                          <span className={`font-semibold capitalize ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-500"}`}>
                            {tx.type}
                          </span>
                        </div>
                      </td>

                      {/* Category column */}
                      <td className="py-3.5 px-4 font-medium text-neutral-900 dark:text-neutral-200">
                        {tx.category}
                      </td>

                      {/* Merchant/Note */}
                      <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400 max-w-[200px] truncate">
                        <p className="font-semibold text-neutral-900 dark:text-neutral-200 leading-normal">{tx.merchant}</p>
                        {tx.description && <p className="text-[10px] text-neutral-400 font-normal mt-0.5">{tx.description}</p>}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-neutral-500 whitespace-nowrap">
                        {tx.date}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className={`font-bold ${
                          isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-900 dark:text-white"
                        }`}>
                          {isIncome ? "+" : "-"}{currency}{Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEditModal(tx)}
                            className="p-1.5 rounded-md text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(tx)}
                            className="p-1.5 rounded-md text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reusable Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        transactionToEdit={selectedTx}
        currency={currency}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        transactionName={selectedTx ? `${selectedTx.merchant} (${currency}${Math.abs(selectedTx.amount).toFixed(2)})` : ""}
      />
    </div>
  );
}
