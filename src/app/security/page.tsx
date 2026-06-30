"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, Lock, Database, EyeOff, Server, Key } from "lucide-react";
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
        <Link href="/security" className="text-white">Security</Link>
      </div>
    </div>
  </footer>
);

export default function SecurityPage() {
  const securityFeatures = [
    {
      icon: <Lock className="w-6 h-6 text-[#10B981]" />,
      title: "Firebase Authentication",
      description: "We use Google's industry-leading Firebase Auth to handle identity verification. Your passwords are never stored in plain text on our servers."
    },
    {
      icon: <Database className="w-6 h-6 text-[#FBBF24]" />,
      title: "Firestore Security Rules",
      description: "Data isolation is enforced at the database level. Granular Security Rules ensure you can only read, write, and modify your own data."
    },
    {
      icon: <Server className="w-6 h-6 text-[#3B82F6]" />,
      title: "Secure Data Storage",
      description: "All application data and documents are stored securely in Google Cloud data centers, which comply with stringent international security standards."
    },
    {
      icon: <Key className="w-6 h-6 text-[#F59E0B]" />,
      title: "Data Encryption",
      description: "All data transmitted between your browser and our servers is encrypted in transit using TLS 1.3, and all data is encrypted at rest."
    },
    {
      icon: <EyeOff className="w-6 h-6 text-[#F97316]" />,
      title: "User Privacy Protection",
      description: "We do not sell your personal or financial data to third-party advertisers. Our AI strictly processes data to benefit you, the user."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#14B8A6]" />,
      title: "Continuous Audits",
      description: "We routinely perform automated and manual security audits of our codebase, dependencies, and infrastructure to proactively patch vulnerabilities."
    }
  ];

  return (
    <div className="min-h-screen bg-[#050816] text-white font-sans flex flex-col selection:bg-[#FBBF24]/30">
      <Navbar />
      
      <main className="flex-1 max-w-5xl mx-auto px-6 py-32 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981] text-xs font-semibold tracking-wide uppercase mb-6">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Bank-Level Security</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">How We Protect You</h1>
          <p className="text-lg text-[#94A3B8] leading-relaxed max-w-2xl mx-auto">
            Your financial data is highly sensitive. We treat security as our absolute top priority, leveraging enterprise-grade infrastructure to keep your information safe.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {securityFeatures.map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-[#111827]/40 border border-white/5 hover:border-white/10 hover:bg-[#111827]/80 transition-colors rounded-3xl p-8 backdrop-blur-sm"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-[#94A3B8] leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-[#FBBF24]/10 to-[#D97706]/10 border border-[#FBBF24]/30 rounded-3xl p-8 md:p-12 text-center backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4">Found a vulnerability?</h2>
          <p className="text-[#94A3B8] mb-6 max-w-xl mx-auto">
            We actively encourage security researchers to report potential vulnerabilities. Please do not exploit the vulnerability, and allow us time to resolve it.
          </p>
          <Link href="/contact" className="inline-flex items-center justify-center h-12 px-8 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full transition-colors border border-white/10">
            Contact Security Team
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
