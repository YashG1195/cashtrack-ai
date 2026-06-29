"use client";

import React, { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  transactionName: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  transactionName
}: DeleteConfirmModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete transaction");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="p-6 text-center space-y-4">
          {/* Warning Icon */}
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center mx-auto border border-red-200 dark:border-red-900/30">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">Delete Transaction</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-neutral-800 dark:text-neutral-200">&quot;{transactionName}&quot;</strong>? This action is immediate and cannot be undone.
            </p>
          </div>

          {error && (
            <div className="p-2.5 text-left text-[11px] text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 text-xs font-semibold border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg transition-colors cursor-pointer"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 h-9 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
