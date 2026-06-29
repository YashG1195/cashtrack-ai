"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { TransactionRepository, Transaction } from "@/repositories/transaction.repository";
import { BudgetRepository, Budget } from "@/repositories/budget.repository";
import { GoalRepository } from "@/repositories/goal.repository";
import { NotificationRepository, AppNotification } from "@/repositories/notification.repository";

type SearchResultGroup = {
  type: "Transactions" | "Budgets" | "Goals" | "Notifications";
  items: Array<{
    id: string;
    title: string;
    subtitle: string;
    path: string;
    icon?: React.ReactNode;
  }>;
};

export default function GlobalSearch() {
  const { user } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchResultGroup[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch and filter results
  useEffect(() => {
    const fetchResults = async () => {
      if (!user) return;
      if (debouncedQuery.trim().length === 0) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      const searchLower = debouncedQuery.toLowerCase();

      try {
        const [transactions, budgets, goals, notifications] = await Promise.all([
          TransactionRepository.list(user.uid),
          BudgetRepository.list(user.uid),
          GoalRepository.list(user.uid),
          NotificationRepository.list(user.uid),
        ]);

        const matchedGroups: SearchResultGroup[] = [];

        // 1. Transactions
        const matchedTx = transactions.filter((tx) => 
          tx.merchant.toLowerCase().includes(searchLower) ||
          tx.category.toLowerCase().includes(searchLower) ||
          tx.type.toLowerCase().includes(searchLower)
        );
        if (matchedTx.length > 0) {
          matchedGroups.push({
            type: "Transactions",
            items: matchedTx.slice(0, 5).map((tx) => ({
              id: tx.id,
              title: `${tx.merchant} - $${Math.abs(tx.amount).toFixed(2)}`,
              subtitle: `${tx.category} • ${tx.date}`,
              path: "/dashboard/transactions"
            }))
          });
        }

        // 2. Budgets
        const matchedBudgets = budgets.filter((b) => 
          b.category.toLowerCase().includes(searchLower)
        );
        if (matchedBudgets.length > 0) {
          matchedGroups.push({
            type: "Budgets",
            items: matchedBudgets.slice(0, 5).map((b) => ({
              id: b.id || b.category,
              title: `${b.category.charAt(0).toUpperCase() + b.category.slice(1)} Budget`,
              subtitle: `Limit: $${b.amount.toFixed(2)}`,
              path: "/dashboard/budgets"
            }))
          });
        }

        // 3. Goals
        const matchedGoals = goals.filter((g) => 
          g.name.toLowerCase().includes(searchLower)
        );
        if (matchedGoals.length > 0) {
          matchedGroups.push({
            type: "Goals",
            items: matchedGoals.slice(0, 5).map((g) => ({
              id: g.id,
              title: g.name,
              subtitle: `Target: $${g.targetAmount.toLocaleString()}`,
              path: "/dashboard/goals"
            }))
          });
        }

        // 4. Notifications
        const matchedNotifs = notifications.filter((n) => 
          n.title.toLowerCase().includes(searchLower) ||
          n.message.toLowerCase().includes(searchLower)
        );
        if (matchedNotifs.length > 0) {
          matchedGroups.push({
            type: "Notifications",
            items: matchedNotifs.slice(0, 5).map((n) => ({
              id: n.id,
              title: n.title,
              subtitle: n.message.substring(0, 40) + (n.message.length > 40 ? "..." : ""),
              path: "/dashboard/notifications"
            }))
          });
        }

        setResults(matchedGroups);
        setSelectedIndex(0); // Reset selection
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    fetchResults();
  }, [debouncedQuery, user]);

  const flatResults = results.flatMap((g) => g.items);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || flatResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selectedItem = flatResults[selectedIndex];
      if (selectedItem) {
        router.push(selectedItem.path);
        setIsOpen(false);
        setQuery("");
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-60 hidden md:block" ref={dropdownRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-neutral-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          className="w-full h-9 pl-9 pr-8 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 focus:bg-white dark:focus:bg-neutral-950 focus:border-amber-500 dark:focus:border-amber-500 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 transition-all duration-200 outline-none"
        />
        {isSearching && (
          <Loader2 className="absolute right-2.5 w-4 h-4 text-amber-500 animate-spin" />
        )}
      </div>

      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full mt-2 w-80 right-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {results.length === 0 && !isSearching ? (
              <div className="p-4 text-center text-sm text-neutral-500">
                No matching records found.
              </div>
            ) : (
              results.map((group) => (
                <div key={group.type} className="mb-2 last:mb-0">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    {group.type}
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isSelected = flatResults[selectedIndex]?.id === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            router.push(item.path);
                            setIsOpen(false);
                            setQuery("");
                          }}
                          onMouseEnter={() => {
                            const index = flatResults.findIndex((r) => r.id === item.id);
                            if (index !== -1) setSelectedIndex(index);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between group transition-colors ${
                            isSelected 
                              ? "bg-amber-50 dark:bg-amber-500/10" 
                              : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                          }`}
                        >
                          <div>
                            <p className={`text-sm font-semibold truncate ${isSelected ? "text-amber-600 dark:text-amber-400" : "text-neutral-900 dark:text-neutral-100"}`}>
                              {item.title}
                            </p>
                            <p className="text-[10px] text-neutral-500 truncate mt-0.5">
                              {item.subtitle}
                            </p>
                          </div>
                          <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? "text-amber-500 opacity-100 translate-x-0" : "text-neutral-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
