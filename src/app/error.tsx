"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCcw, ArrowLeft } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Route Error Caught:", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/50 shadow-sm flex flex-col items-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Page Error</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            We encountered an unexpected issue while loading this page. Our team has been notified.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 h-10 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Try again
          </button>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-5 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
