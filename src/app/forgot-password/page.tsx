"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Mail, Loader2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess("A password reset link has been sent to your email address.");
      setEmail("");
    } catch (err: any) {
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-email") {
        console.warn("Reset password validation warning:", err.message || err);
      } else {
        console.error("Reset password unexpected error:", err);
      }
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else {
        setError(err.message || "Failed to send reset link.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-6 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-amber-500/10 via-yellow-500/5 to-transparent rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f2e_1px,transparent_1px),linear-gradient(to_bottom,#1f1f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.15] pointer-events-none" />

      <div className="w-full max-w-md p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl transition-colors duration-200 z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight bg-gradient-to-r from-neutral-950 to-amber-600 dark:from-white dark:to-amber-400 bg-clip-text text-transparent mb-3">
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500/20" />
            <span>MoneyFlow AI</span>
          </Link>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Reset Password</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">We will email you a link to reset your password</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 text-xs text-red-600 dark:text-red-400 animate-in fade-in duration-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-10 pl-10 pr-4 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-amber-500 dark:focus:border-amber-500 outline-none transition-colors"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        <div className="mt-6 flex justify-center">
          <Link href="/login" className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
