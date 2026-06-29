"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, DollarSign, Tag, FileText, Loader2 } from "lucide-react";
import { Transaction } from "@/repositories/transaction.repository";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: {
    merchant: string;
    category: string;
    amount: number;
    date: string;
    type: "income" | "expense";
    description?: string;
  }) => Promise<void>;
  transactionToEdit?: Transaction | null;
  currency?: string;
}

const INCOME_CATEGORIES = ["Salary", "Freelance", "Investment", "Business", "Other"];
const EXPENSE_CATEGORIES = [
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

export default function TransactionModal({
  isOpen,
  onClose,
  onSave,
  transactionToEdit = null,
  currency = "$"
}: TransactionModalProps) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [merchant, setMerchant] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(Math.abs(transactionToEdit.amount).toString());
      setCategory(transactionToEdit.category);
      setDate(transactionToEdit.date);
      setMerchant(transactionToEdit.merchant);
      setDescription(transactionToEdit.description || "");
    } else {
      setType("expense");
      setAmount("");
      setCategory("Food");
      setDate(new Date().toISOString().split("T")[0]);
      setMerchant("");
      setDescription("");
    }
    setError(null);
  }, [transactionToEdit, isOpen]);

  // Adjust category selection when type changes
  useEffect(() => {
    if (transactionToEdit && transactionToEdit.type === type) {
      setCategory(transactionToEdit.category);
    } else {
      setCategory(type === "income" ? "Salary" : "Food");
    }
  }, [type]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be a positive number greater than 0");
      return;
    }
    if (!category.trim()) {
      setError("Category is required");
      return;
    }
    if (!date) {
      setError("Date is required");
      return;
    }
    if (!merchant.trim()) {
      setError("Merchant / Payee is required");
      return;
    }

    setSubmitting(true);
    try {
      const signedAmount = type === "income" ? parsedAmount : -parsedAmount;
      await onSave({
        merchant: merchant.trim(),
        category,
        amount: signedAmount,
        date,
        type,
        description: description.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the transaction");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
            {transactionToEdit ? "Edit Transaction" : "Add Transaction"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg">
              {error}
            </div>
          )}

          {/* Type Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 dark:bg-neutral-950 rounded-lg">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                type === "expense"
                  ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                type === "income"
                  ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
              }`}
            >
              Income
            </button>
          </div>

          {/* Merchant / Source */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              {type === "income" ? "Source / Payee" : "Merchant / Payee"}
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                required
                placeholder={type === "income" ? "e.g. Salary, Freelance project" : "e.g. Uber, Groceries store"}
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full h-10 pl-10 pr-3 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-amber-500 dark:focus:border-amber-500 outline-none transition-colors"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Amount & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Amount ({currency})
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-neutral-400 pointer-events-none" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-amber-500 dark:focus:border-amber-500 outline-none transition-colors"
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Category
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-3 w-4 h-4 text-neutral-400 pointer-events-none" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 pl-10 pr-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent dark:bg-neutral-900 text-neutral-900 dark:text-white focus:border-amber-500 dark:focus:border-amber-500 outline-none transition-colors appearance-none"
                  disabled={submitting}
                >
                  {type === "income"
                    ? INCOME_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))
                    : EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                </select>
              </div>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 pl-10 pr-3 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white focus:border-amber-500 dark:focus:border-amber-500 outline-none transition-colors"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Description / Note (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Notes about this transaction..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-amber-500 dark:focus:border-amber-500 outline-none transition-colors resize-none"
              disabled={submitting}
            />
          </div>

          {/* Footer buttons */}
          <div className="flex gap-3 justify-end pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 text-xs font-semibold border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg transition-colors cursor-pointer"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 h-10 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors cursor-pointer shadow-[0_0_15px_rgba(79,70,229,0.2)] flex items-center justify-center gap-1.5"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                transactionToEdit ? "Save Changes" : "Save Transaction"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
