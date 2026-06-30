"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Mail, User, MessageSquare, Send, CheckCircle2, Loader2 } from "lucide-react";
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

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate network request
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white font-sans flex flex-col selection:bg-[#FBBF24]/30">
      <Navbar />
      
      <main className="flex-1 max-w-lg mx-auto px-6 py-32 w-full flex flex-col justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[rgba(17,24,39,0.75)] backdrop-blur-xl border border-white/10 rounded-[24px] p-8 sm:p-10 shadow-2xl shadow-black/50"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Get in Touch</h1>
            <p className="text-[#94A3B8] text-sm">
              Have questions about Cashtrack AI? We're here to help. Drop us a message and we'll get back to you shortly.
            </p>
          </div>

          {success ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-12 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Message Sent!</h2>
              <p className="text-[#94A3B8] text-sm max-w-xs mx-auto">
                Thank you for reaching out. A member of our support team will respond to your email within 24 hours.
              </p>
              <button 
                onClick={() => setSuccess(false)}
                className="mt-6 text-[#FBBF24] text-sm font-semibold hover:text-white transition-colors"
              >
                Send another message
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Name Input */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[#FBBF24] text-[#94A3B8]">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  className="block w-full h-[56px] pl-12 pr-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[#FBBF24]/50 focus:border-[#FBBF24] focus:bg-black/40 transition-all peer"
                  placeholder="Full Name"
                />
                <label 
                  htmlFor="name" 
                  className="absolute left-12 top-4 text-sm text-[#94A3B8] transition-all peer-focus:-top-2 peer-focus:left-4 peer-focus:text-xs peer-focus:text-[#FBBF24] peer-focus:bg-[#111827] peer-focus:px-2 peer-valid:-top-2 peer-valid:left-4 peer-valid:text-xs peer-valid:bg-[#111827] peer-valid:px-2 cursor-text"
                >
                  Full Name
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
                  className="block w-full h-[56px] pl-12 pr-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[#FBBF24]/50 focus:border-[#FBBF24] focus:bg-black/40 transition-all peer"
                  placeholder="Email Address"
                />
                <label 
                  htmlFor="email" 
                  className="absolute left-12 top-4 text-sm text-[#94A3B8] transition-all peer-focus:-top-2 peer-focus:left-4 peer-focus:text-xs peer-focus:text-[#FBBF24] peer-focus:bg-[#111827] peer-focus:px-2 peer-valid:-top-2 peer-valid:left-4 peer-valid:text-xs peer-valid:bg-[#111827] peer-valid:px-2 cursor-text"
                >
                  Email Address
                </label>
              </div>

              {/* Message Input */}
              <div className="relative group pt-2">
                <div className="absolute top-6 left-0 pl-4 flex pointer-events-none transition-colors group-focus-within:text-[#FBBF24] text-[#94A3B8]">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <textarea
                  id="message"
                  required
                  rows={4}
                  className="block w-full pl-12 pr-4 pt-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[#FBBF24]/50 focus:border-[#FBBF24] focus:bg-black/40 transition-all peer resize-none"
                  placeholder="How can we help you?"
                />
                <label 
                  htmlFor="message" 
                  className="absolute left-12 top-6 text-sm text-[#94A3B8] transition-all peer-focus:-top-2 peer-focus:left-4 peer-focus:text-xs peer-focus:text-[#FBBF24] peer-focus:bg-[#111827] peer-focus:px-2 peer-valid:-top-2 peer-valid:left-4 peer-valid:text-xs peer-valid:bg-[#111827] peer-valid:px-2 cursor-text"
                >
                  How can we help you?
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[56px] mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-[#FBBF24] to-[#D97706] hover:from-[#6D28D9] hover:to-[#4338CA] text-white font-semibold rounded-xl shadow-lg shadow-[#FBBF24]/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Send Message <Send className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
