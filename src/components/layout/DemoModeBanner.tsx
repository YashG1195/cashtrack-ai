"use client";

import { useAuth } from "@/context/AuthContext";
import { AlertTriangle } from "lucide-react";

export default function DemoModeBanner() {
  const { isDemoMode } = useAuth();

  if (!isDemoMode) return null;

  return (
    <div className="bg-amber-600/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] sm:text-xs px-4 py-2 flex items-center justify-center gap-2 select-none z-[100] relative font-sans text-center">
      <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-500" />
      <span>
        <strong>Demo Mode Active</strong>: Firebase is not configured. Authentication is simulated. Add valid keys to <code>.env.local</code> to enable real Firebase Authentication.
      </span>
    </div>
  );
}
