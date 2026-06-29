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
        <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
        <Link href="/terms" className="text-white">Terms</Link>
        <Link href="/security" className="hover:text-white transition-colors">Security</Link>
      </div>
    </div>
  </footer>
);

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
          <p className="text-[#94A3B8] mb-12">Last updated: June 19, 2026</p>

          <div className="space-y-8 text-[#94A3B8] leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-3">1. Agreement to Terms</h2>
              <p>
                These Terms of Service constitute a legally binding agreement made between you and MoneyFlow AI concerning your access to and use of the application as well as any other media form, mobile application, or website related thereto. You agree that by accessing the site, you have read, understood, and agreed to be bound by all of these Terms of Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">2. User Accounts</h2>
              <p>
                You may be required to register with the site. You agree to keep your password confidential and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">3. AI Insights Disclaimer</h2>
              <p>
                MoneyFlow AI uses generative AI to provide automated financial insights, budgeting recommendations, and savings goals tracking. <strong>This information is provided for educational and informational purposes only and does not constitute professional financial advice.</strong> You should always consult with a certified financial planner before making major financial decisions. We are not liable for any financial losses resulting from the use of our AI suggestions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">4. Intellectual Property Rights</h2>
              <p>
                Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site and the trademarks, service marks, and logos contained therein are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">5. Modifications and Interruptions</h2>
              <p>
                We reserve the right to change, modify, or remove the contents of the Site at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our Site. We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the Site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">6. Governing Law</h2>
              <p>
                These Terms shall be governed by and defined following the laws of your jurisdiction. MoneyFlow AI and yourself irrevocably consent that the courts of your jurisdiction shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these terms.
              </p>
            </section>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
