"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Target, Shield, Brain, Rocket, Activity, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const Navbar = () => (
  <header className="fixed top-0 w-full z-50 bg-[#050816]/80 backdrop-blur-lg border-b border-white/10 py-4">
    <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FBBF24] to-[#D97706] flex items-center justify-center shadow-lg shadow-[#FBBF24]/20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="text-white">Cashtrack AI</span>
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/login" className="text-sm font-medium text-white hover:text-[#FBBF24] transition-colors">
          Log In
        </Link>
        <Link href="/signup" className="text-sm font-semibold px-5 py-2.5 bg-white text-[#050816] rounded-full hover:bg-neutral-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]">
          Get Started
        </Link>
      </div>
    </div>
  </header>
);

const Footer = () => (
  <footer className="bg-[#050816] border-t border-white/10 pt-10 pb-10 mt-auto">
    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <p className="text-[#94A3B8] text-sm">© {new Date().getFullYear()} Cashtrack AI. All rights reserved.</p>
      <div className="flex items-center gap-6 text-[#94A3B8]">
        <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
        <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
        <Link href="/security" className="hover:text-white transition-colors">Security</Link>
      </div>
    </div>
  </footer>
);

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-white font-sans flex flex-col selection:bg-[#FBBF24]/30">
      <Navbar />
      
      <main className="flex-1 max-w-4xl mx-auto px-6 py-32 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#FBBF24]/30 bg-[#FBBF24]/10 text-[#FBBF24] text-xs font-semibold tracking-wide uppercase mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Our Story</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">About Cashtrack AI</h1>
          <p className="text-lg text-[#94A3B8] leading-relaxed max-w-2xl mx-auto">
            We are building the intelligent financial command center for modern professionals, combining intuitive design with powerful generative AI.
          </p>
        </motion.div>

        {/* What is Cashtrack AI */}
        <div className="bg-[#111827]/40 border border-white/5 rounded-3xl p-8 md:p-12 mb-8 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FBBF24] to-[#D97706] flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            What is Cashtrack AI?
          </h2>
          <p className="text-[#94A3B8] leading-relaxed text-lg">
            Cashtrack AI is a premium SaaS platform designed to replace messy spreadsheets and fragmented banking apps. By aggregating your cash flow into beautifully designed, actionable dashboards, we empower you to track expenses, set granular budgets, and establish powerful savings goals—all monitored and analyzed by your personal 24/7 AI financial advisor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Mission */}
          <div className="bg-gradient-to-br from-[#FBBF24]/10 to-[#111827]/40 border border-white/5 hover:border-[#FBBF24]/30 transition-colors rounded-3xl p-8 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-white">
              <Target className="w-6 h-6 text-[#FBBF24]" />
              Our Mission
            </h2>
            <p className="text-[#94A3B8] leading-relaxed">
              To democratize elite-tier wealth management. We believe everyone deserves access to the same level of financial clarity and intelligent advisory previously reserved for the ultra-wealthy.
            </p>
          </div>

          {/* Vision */}
          <div className="bg-gradient-to-br from-[#F97316]/10 to-[#111827]/40 border border-white/5 hover:border-[#F97316]/30 transition-colors rounded-3xl p-8 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-white">
              <Rocket className="w-6 h-6 text-[#F97316]" />
              Our Vision
            </h2>
            <p className="text-[#94A3B8] leading-relaxed">
              A future where financial anxiety is obsolete, replaced by total automation and proactive AI insights that guide individuals to continuous financial growth and stability.
            </p>
          </div>
        </div>

        {/* Why Trust Us */}
        <div className="bg-[#111827]/40 border border-white/5 rounded-3xl p-8 md:p-12 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10B981] to-emerald-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            Why Trust Us?
          </h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-[#10B981] shrink-0" />
              <div>
                <h4 className="text-white font-bold mb-1">Enterprise-Grade Security</h4>
                <p className="text-sm text-[#94A3B8]">We utilize Google Firebase Authentication and stringent Firestore security rules. We don't sell your data, ever.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-[#10B981] shrink-0" />
              <div>
                <h4 className="text-white font-bold mb-1">Unbiased AI Insights</h4>
                <p className="text-sm text-[#94A3B8]">Our Generative AI models analyze your data strictly to benefit you, without hidden financial product kickbacks.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-[#10B981] shrink-0" />
              <div>
                <h4 className="text-white font-bold mb-1">Absolute Transparency</h4>
                <p className="text-sm text-[#94A3B8]">From our pricing structure to our data handling protocols, everything is built in plain sight.</p>
              </div>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
