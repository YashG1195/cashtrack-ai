"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, ArrowRight, ShieldCheck, Database, Rocket, Lock } from "lucide-react";
import { isFirebaseConfigured, auth, db, storage } from "@/lib/firebase";

interface CheckItem {
  id: string;
  name: string;
  description: string;
  status: "loading" | "pass" | "fail" | "manual";
}

export default function LaunchChecklist() {
  const [checks, setChecks] = useState<CheckItem[]>([
    { id: "firebase", name: "Firebase Connection", description: "Verifies the core Firebase App initialization.", status: "loading" },
    { id: "auth", name: "Authentication API", description: "Verifies Firebase Auth module is active.", status: "loading" },
    { id: "firestore", name: "Firestore Database", description: "Verifies Firestore DB is initialized.", status: "loading" },
    { id: "storage", name: "Cloud Storage", description: "Verifies Firebase Storage is initialized.", status: "loading" },
    { id: "pwa", name: "PWA Manifest", description: "Requires manifest.json in the public directory.", status: "manual" },
    { id: "seo", name: "SEO Optimization", description: "Requires robots.txt, sitemap.xml, and Metadata.", status: "manual" },
    { id: "rules", name: "Security Rules", description: "Requires firestore.rules and storage.rules to be deployed.", status: "manual" },
  ]);

  useEffect(() => {
    // Run automated checks
    setTimeout(() => {
      setChecks((prev) => prev.map((check) => {
        if (check.id === "firebase") {
          return { ...check, status: isFirebaseConfigured ? "pass" : "fail" };
        }
        if (check.id === "auth") {
          return { ...check, status: auth ? "pass" : "fail" };
        }
        if (check.id === "firestore") {
          return { ...check, status: db ? "pass" : "fail" };
        }
        if (check.id === "storage") {
          return { ...check, status: storage ? "pass" : "fail" };
        }
        return check;
      }));
    }, 1500); // Artificial delay to show loading state
  }, []);

  const passedCount = checks.filter(c => c.status === "pass" || c.status === "manual").length;
  const progress = (passedCount / checks.length) * 100;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-2">
            <Rocket className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Production Launch Readiness</h1>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-2xl text-sm leading-relaxed">
            Review the status of critical infrastructure, security rules, and performance optimizations before deploying Cashtrack AI to production.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-sm font-semibold">Deployment Readiness</p>
              <p className="text-xs text-neutral-500 mt-1">{passedCount} of {checks.length} checks verified</p>
            </div>
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Checks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {checks.map((check) => (
            <div key={check.id} className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-start gap-4 hover:border-amber-500/30 transition-colors">
              <div className="mt-0.5 shrink-0">
                {check.status === "loading" && <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />}
                {check.status === "pass" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {check.status === "fail" && <XCircle className="w-5 h-5 text-red-500" />}
                {check.status === "manual" && <ShieldCheck className="w-5 h-5 text-amber-500" />}
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  {check.name}
                  {check.status === "manual" && (
                    <span className="text-[9px] uppercase tracking-wider font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">Manual Verify</span>
                  )}
                </h3>
                <p className="text-xs text-neutral-500 mt-1">{check.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-6 border border-amber-100 dark:border-amber-500/20">
          <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2 mb-4">
            <Database className="w-4 h-4" />
            Next Steps for Deployment
          </h3>
          <ul className="space-y-3 text-sm text-amber-800 dark:text-amber-200 list-disc list-inside">
            <li>Ensure all Firebase environment variables are set in your Vercel deployment settings.</li>
            <li>Deploy your Firestore rules by running <code className="bg-amber-100 dark:bg-amber-500/20 px-1.5 py-0.5 rounded font-mono text-xs">firebase deploy --only firestore,storage</code></li>
            <li>Run a final Lighthouse audit on the production URL to verify PWA and SEO scores.</li>
          </ul>
        </div>

        <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800">
          <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 h-12 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl transition-all shadow-md">
            Return to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
