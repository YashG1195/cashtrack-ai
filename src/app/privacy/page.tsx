"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const Navbar = () => (
  <header className="fixed top-0 w-full z-50 bg-[#050816]/80 backdrop-blur-lg border-b border-white/10 py-4">
    <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FBBF24] to-[#D97706] flex items-center justify-center shadow-lg shadow-[#FBBF24]/20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="text-white">MoneyFlow AI</span>
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
      <p className="text-[#94A3B8] text-sm">© {new Date().getFullYear()} MoneyFlow AI. All rights reserved.</p>
      <div className="flex items-center gap-6 text-[#94A3B8]">
        <Link href="/privacy" className="text-white">Privacy</Link>
        <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
        <Link href="/security" className="hover:text-white transition-colors">Security</Link>
      </div>
    </div>
  </footer>
);

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-white font-sans flex flex-col selection:bg-[#FBBF24]/30">
      <Navbar />
      
      <main className="flex-1 max-w-4xl mx-auto px-6 py-32 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#111827]/40 border border-white/5 rounded-3xl p-8 md:p-12 backdrop-blur-sm"
        >
          <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-[#94A3B8] mb-12">Last updated: June 19, 2026</p>

          <div className="space-y-8 text-[#94A3B8] leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-3">1. Introduction</h2>
              <p>
                At MoneyFlow AI, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our application. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">2. Information We Collect</h2>
              <p className="mb-2">We may collect information about you in a variety of ways. The information we may collect includes:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, and profile picture, that you voluntarily give to us when you register with the Application.</li>
                <li><strong>Financial Data:</strong> Information related to your income, expenses, budgets, and savings goals that you input into the platform. This data is strictly encrypted.</li>
                <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Application, such as your IP address, your browser type, your operating system, and your access times.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">3. Use of Your Information</h2>
              <p className="mb-2">Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Application to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Create and manage your account.</li>
                <li>Provide generative AI financial insights based strictly on the data you provide.</li>
                <li>Email you regarding your account or order.</li>
                <li>Prevent fraudulent transactions, monitor against theft, and protect against criminal activity.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">4. Disclosure of Your Information</h2>
              <p>
                We do not sell, trade, or rent your personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information regarding visitors and users with our business partners, trusted affiliates, and advertisers. We may disclose your information where we are legally required to do so in order to comply with applicable law, governmental requests, a judicial proceeding, court order, or legal process.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">5. Security of Your Information</h2>
              <p>
                We use administrative, technical, and physical security measures, including Google Firebase Authentication and secure Firestore rules, to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">6. Contact Us</h2>
              <p>
                If you have questions or comments about this Privacy Policy, please contact us at via our <Link href="/contact" className="text-[#FBBF24] hover:underline">Contact Page</Link>.
              </p>
            </section>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
