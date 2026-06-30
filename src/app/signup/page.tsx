"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Mail, Lock, User as UserIcon, Loader2, Eye, EyeOff, CheckCircle2, ChevronRight } from "lucide-react";

type PasswordStrength = "weak" | "fair" | "good" | "strong" | "";

export default function SignupPage() {
  const { signUpWithEmail, loginWithGoogle } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | null>(null);
  const [success, setSuccess] = useState(false);

  // Password strength meter logic
  const [strength, setStrength] = useState<PasswordStrength>("");

  useEffect(() => {
    if (!password) {
      setStrength("");
      return;
    }
    let score = 0;
    if (password.length > 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) setStrength("weak");
    else if (score === 2 || score === 3) setStrength("fair");
    else if (score === 4) setStrength("good");
    else setStrength("strong");
  }, [password]);

  const getStrengthColor = () => {
    switch (strength) {
      case "weak": return "bg-red-500 w-1/4";
      case "fair": return "bg-amber-400 w-2/4";
      case "good": return "bg-emerald-400 w-3/4";
      case "strong": return "bg-amber-500 w-full shadow-[0_0_10px_rgba(99,102,241,0.8)]";
      default: return "bg-white/10 w-0";
    }
  };

  const getStrengthLabel = () => {
    switch (strength) {
      case "weak": return "Weak";
      case "fair": return "Fair";
      case "good": return "Good";
      case "strong": return "Strong";
      default: return "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (strength === "weak") {
      setError("Please choose a stronger password");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await signUpWithEmail(email, password, name);
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      if (!success) setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google") => {
    setError(null);
    setSocialLoading(provider);
    try {
      if (provider === "google") await loginWithGoogle();
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        setError(err.message || `Failed to sign up with ${provider}`);
      }
    } finally {
      if (!success) setSocialLoading(null);
    }
  };

  const features = [
    "Expense Tracking",
    "Smart Budgets",
    "Savings Goals",
    "AI Financial Advisor"
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#050816] text-white font-sans selection:bg-[#FBBF24]/30">
      
      {/* Left Branding Panel (55%) */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-16">
        {/* Animated Gradient Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FBBF24]/20 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#D97706]/20 blur-[120px] rounded-full mix-blend-screen animate-pulse" style={{ animationDelay: "2s" }} />
        
        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-3 font-bold text-2xl tracking-tight group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FBBF24] to-[#D97706] flex items-center justify-center shadow-lg shadow-[#FBBF24]/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span>Cashtrack AI</span>
        </Link>

        {/* Hero Content */}
        <div className="relative z-10 max-w-xl mt-12 mb-auto">
          <h1 className="text-5xl font-bold leading-[1.15] tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/70">
            Take Control of Your Financial Future
          </h1>
          <p className="text-[#94A3B8] text-lg leading-relaxed mb-10">
            Join thousands of users tracking expenses, managing budgets, and achieving goals with our AI-powered financial advisor.
          </p>

          <div className="grid grid-cols-2 gap-y-6 gap-x-8">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#FBBF24]/20 flex items-center justify-center border border-[#FBBF24]/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#FBBF24]" />
                </div>
                <span className="font-medium text-white/90">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer / Trust Badge */}
        <div className="relative z-10 flex items-center gap-4 text-sm text-[#94A3B8]">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-[#111827] border-2 border-[#050816] flex items-center justify-center overflow-hidden">
                <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover opacity-80" />
              </div>
            ))}
          </div>
          <p>Join <span className="text-white font-semibold">10,000+</span> users managing wealth</p>
        </div>
      </div>

      {/* Right Auth Panel (45%) */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-16 relative z-10 overflow-y-auto min-h-screen">
        
        {/* Mobile Logo */}
        <Link href="/" className="lg:hidden flex items-center gap-3 font-bold text-2xl tracking-tight my-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FBBF24] to-[#D97706] flex items-center justify-center shadow-lg shadow-[#FBBF24]/25">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span>Cashtrack AI</span>
        </Link>

        {/* Auth Card */}
        <div className="w-full max-w-[480px] bg-[rgba(17,24,39,0.75)] backdrop-blur-xl border border-white/10 rounded-[24px] p-8 sm:p-10 shadow-2xl shadow-black/50 my-auto">
          
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Create an account</h2>
            <p className="text-[#94A3B8]">Start your financial journey today.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 animate-in fade-in zoom-in duration-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <p className="text-sm text-emerald-400 font-medium">Account created successfully! Redirecting...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[#FBBF24] text-[#94A3B8]">
                <UserIcon className="w-5 h-5" />
              </div>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full h-[56px] pl-12 pr-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[#FBBF24]/50 focus:border-[#FBBF24] focus:bg-black/40 transition-all peer"
                placeholder="Full name"
              />
              <label 
                htmlFor="name" 
                className="absolute left-12 top-4 text-sm text-[#94A3B8] transition-all peer-focus:-top-2 peer-focus:left-4 peer-focus:text-xs peer-focus:text-[#FBBF24] peer-focus:bg-[#111827] peer-focus:px-2 peer-valid:-top-2 peer-valid:left-4 peer-valid:text-xs peer-valid:bg-[#111827] peer-valid:px-2 cursor-text"
              >
                Full name
              </label>
            </div>

            {/* Email Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[#FBBF24] text-[#94A3B8]">
                <Mail className="w-5 h-5" />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full h-[56px] pl-12 pr-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[#FBBF24]/50 focus:border-[#FBBF24] focus:bg-black/40 transition-all peer"
                placeholder="Email address"
              />
              <label 
                htmlFor="email" 
                className="absolute left-12 top-4 text-sm text-[#94A3B8] transition-all peer-focus:-top-2 peer-focus:left-4 peer-focus:text-xs peer-focus:text-[#FBBF24] peer-focus:bg-[#111827] peer-focus:px-2 peer-valid:-top-2 peer-valid:left-4 peer-valid:text-xs peer-valid:bg-[#111827] peer-valid:px-2 cursor-text"
              >
                Email address
              </label>
            </div>

            {/* Password Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[#FBBF24] text-[#94A3B8]">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full h-[56px] pl-12 pr-12 bg-black/20 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[#FBBF24]/50 focus:border-[#FBBF24] focus:bg-black/40 transition-all peer"
                placeholder="Password"
              />
              <label 
                htmlFor="password" 
                className="absolute left-12 top-4 text-sm text-[#94A3B8] transition-all peer-focus:-top-2 peer-focus:left-4 peer-focus:text-xs peer-focus:text-[#FBBF24] peer-focus:bg-[#111827] peer-focus:px-2 peer-valid:-top-2 peer-valid:left-4 peer-valid:text-xs peer-valid:bg-[#111827] peer-valid:px-2 cursor-text"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#94A3B8] hover:text-white transition-colors focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Strength Meter */}
            {password && (
              <div className="px-1 pt-1 pb-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[#94A3B8] font-medium tracking-wide">Password strength</span>
                  <span className={`text-xs font-bold tracking-wide uppercase ${
                    strength === "weak" ? "text-red-400" :
                    strength === "fair" ? "text-amber-400" :
                    strength === "good" ? "text-emerald-400" : "text-amber-400"
                  }`}>
                    {getStrengthLabel()}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ease-out rounded-full ${getStrengthColor()}`} />
                </div>
              </div>
            )}

            {/* Confirm Password Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[#FBBF24] text-[#94A3B8]">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`block w-full h-[56px] pl-12 pr-4 bg-black/20 border ${
                  confirmPassword && password !== confirmPassword ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/50" : "border-white/10 focus:border-[#FBBF24] focus:ring-[#FBBF24]/50"
                } rounded-xl text-white placeholder-transparent focus:outline-none focus:ring-2 focus:bg-black/40 transition-all peer`}
                placeholder="Confirm Password"
              />
              <label 
                htmlFor="confirmPassword" 
                className={`absolute left-12 top-4 text-sm transition-all peer-focus:-top-2 peer-focus:left-4 peer-focus:text-xs peer-focus:bg-[#111827] peer-focus:px-2 peer-valid:-top-2 peer-valid:left-4 peer-valid:text-xs peer-valid:bg-[#111827] peer-valid:px-2 cursor-text ${
                  confirmPassword && password !== confirmPassword ? "text-red-400 peer-focus:text-red-400" : "text-[#94A3B8] peer-focus:text-[#FBBF24]"
                }`}
              >
                {confirmPassword && password !== confirmPassword ? "Passwords do not match" : "Confirm password"}
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || success || (confirmPassword !== password) || strength === "weak"}
              className="w-full h-[56px] flex items-center justify-center gap-2 bg-gradient-to-r from-[#FBBF24] to-[#D97706] hover:from-[#6D28D9] hover:to-[#4338CA] text-white font-semibold rounded-xl shadow-lg shadow-[#FBBF24]/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 mt-6"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : success ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <>
                  Create Account <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social Login Divider */}
          <div className="flex items-center my-8">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-semibold text-[#94A3B8] tracking-widest">
              CONTINUE WITH GOOGLE
            </span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Social Buttons */}
          <div className="w-full">
            <button
              type="button"
              onClick={() => handleSocialLogin("google")}
              disabled={!!socialLoading || success}
              className="w-full h-[48px] flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-colors disabled:opacity-50"
            >
              {socialLoading === "google" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-[#94A3B8]">
            Already have an account?{" "}
            <Link href="/login" className="text-white font-semibold hover:text-[#FBBF24] transition-colors">
              Log in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
