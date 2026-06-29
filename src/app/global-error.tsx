"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="h-screen w-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white font-sans p-6">
        <div className="max-w-md w-full p-8 rounded-3xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/10 shadow-2xl flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Something went wrong!</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              A critical error occurred. Please try again or return to the safety of the dashboard.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full pt-4">
            <button
              onClick={() => reset()}
              className="w-full sm:w-auto px-5 h-10 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto px-5 h-10 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <Home className="w-4 h-4" />
              Return Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
