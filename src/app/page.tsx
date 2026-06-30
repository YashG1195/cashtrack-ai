"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, ArrowRight, Menu, X, CheckCircle2, ChevronRight, 
  TrendingUp, Shield, BarChart3, Target, Brain, Lock, 
  ChevronDown, Star, Play, MessageSquare, PieChart, Activity
} from "lucide-react";

// --- Components ---

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Analytics", href: "#showcase" },
    { name: "AI Advisor", href: "#advisor" },
    { name: "FAQ", href: "#faq" }
  ];

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled ? "bg-[#050816]/80 backdrop-blur-lg border-b border-white/10 py-4" : "bg-transparent py-6"
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight z-50">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FBBF24] to-[#D97706] flex items-center justify-center shadow-lg shadow-[#FBBF24]/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-white">Cashtrack AI</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} className="text-sm font-medium text-[#94A3B8] hover:text-white transition-colors">
              {link.name}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-white hover:text-[#FBBF24] transition-colors">
            Log In
          </Link>
          <Link href="/signup" className="text-sm font-semibold px-5 py-2.5 bg-white text-[#050816] rounded-full hover:bg-neutral-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]">
            Get Started
          </Link>
        </div>

        <button className="md:hidden text-white z-50" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-[#050816]/95 backdrop-blur-xl border-b border-white/10 py-6 px-6 flex flex-col gap-4 md:hidden"
          >
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} onClick={() => setIsOpen(false)} className="text-lg font-medium text-[#94A3B8] hover:text-white transition-colors">
                {link.name}
              </a>
            ))}
            <div className="h-px bg-white/10 my-2" />
            <Link href="/login" onClick={() => setIsOpen(false)} className="text-lg font-medium text-white">Log In</Link>
            <Link href="/signup" onClick={() => setIsOpen(false)} className="mt-2 text-center text-lg font-semibold px-5 py-3 bg-[#FBBF24] text-white rounded-xl">Get Started Free</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

const Hero = () => {
  return (
    <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Glows */}
      <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-[#FBBF24]/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[500px] h-[500px] bg-[#D97706]/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#FBBF24]/30 bg-[#FBBF24]/10 text-[#FBBF24] text-xs font-semibold tracking-wide uppercase mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Powered by AI</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1] mb-6">
            Your Personal AI-Powered <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FBBF24] to-[#F97316]">
              Financial Command Center
            </span>
          </h1>
          
          <p className="text-lg text-[#94A3B8] leading-relaxed mb-10 max-w-xl">
            Track expenses, manage budgets, achieve savings goals, and receive intelligent financial insights—all in one premium platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Link href="/signup" className="inline-flex items-center justify-center gap-2 h-14 px-8 bg-white text-[#050816] font-bold rounded-full hover:bg-neutral-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)]">
              Get Started Now <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <p className="text-sm text-[#94A3B8] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#10B981]" /> No credit card required. Cancel anytime.
          </p>
        </motion.div>

        {/* Floating Mockup */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, rotateY: 15, rotateX: 10 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0, rotateX: 0 }}
          transition={{ duration: 1, delay: 0.2, type: "spring", stiffness: 50 }}
          className="relative perspective-[1000px] lg:h-[600px] flex items-center justify-center"
        >
          <motion.div 
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="w-full max-w-md bg-[rgba(17,24,39,0.8)] backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-2xl shadow-black/50 overflow-hidden relative"
          >
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FBBF24]/10 to-transparent pointer-events-none" />
            
            <div className="flex justify-between items-start mb-10">
              <div>
                <p className="text-[#94A3B8] text-sm font-medium mb-1">Total Balance</p>
                <h3 className="text-4xl font-bold text-white tracking-tight">₹28,950</h3>
              </div>
              <div className="w-14 h-14 rounded-full border-2 border-white/10 overflow-hidden shadow-md bg-white/10 flex items-center justify-center">
                <span className="text-white font-bold">YG</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-[#10B981] mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-bold">INCOME</span>
                </div>
                <p className="text-xl font-bold text-white">₹30,000</p>
              </div>
              <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-[#F97316] mb-2">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs font-bold">EXPENSES</span>
                </div>
                <p className="text-xl font-bold text-white">₹1,050</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-white">Savings Goal: Macbook Pro</span>
                <span className="text-sm font-bold text-[#FBBF24]">75%</span>
              </div>
              <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-[75%] bg-gradient-to-r from-[#FBBF24] to-[#F97316] rounded-full" />
              </div>
            </div>

            {/* AI Insight Card */}
            <div className="bg-gradient-to-r from-[#FBBF24]/20 to-[#D97706]/20 border border-[#FBBF24]/30 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-2xl rounded-full" />
              <div className="flex items-start gap-3 relative z-10">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FBBF24] to-[#D97706] flex flex-shrink-0 items-center justify-center shadow-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">AI Insight</h4>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    Based on your spending, reducing Health & Dining expenses by 10% will help you achieve your Macbook goal 2 months early.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const TrustMetrics = () => {
  const metrics = [
    { value: "₹10M+", label: "Money Managed" },
    { value: "10,000+", label: "Transactions" },
    { value: "95%", label: "Savings Success" },
    { value: "24/7", label: "AI Insights" }
  ];

  return (
    <section className="py-20 border-y border-white/5 bg-black/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 divide-x divide-white/5">
          {metrics.map((m, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`flex flex-col items-center justify-center text-center ${i === 0 ? "" : "pl-8 lg:pl-12"}`}
            >
              <h3 className="text-4xl lg:text-5xl font-extrabold text-white mb-2 tracking-tight">{m.value}</h3>
              <p className="text-sm font-medium text-[#94A3B8] uppercase tracking-wider">{m.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Features = () => {
  const features = [
    { icon: PieChart, title: "Expense Tracking", desc: "Log and categorize transactions effortlessly. Visualize your spending patterns with stunning, interactive charts." },
    { icon: Target, title: "Budget Management", desc: "Set granular monthly limits across different categories and receive proactive alerts before you overspend." },
    { icon: Star, title: "Savings Goals", desc: "Define financial milestones. Cashtrack AI automatically tracks your progress and suggests optimal contribution rates." },
    { icon: Brain, title: "AI Financial Advisor", desc: "Chat directly with a personalized AI that understands your cash flow and provides actionable wealth-building advice." },
    { icon: BarChart3, title: "Advanced Analytics", desc: "Generate comprehensive monthly reports detailing your net worth trajectory, income ratios, and spending anomalies." },
    { icon: Lock, title: "Secure Authentication", desc: "Enterprise-grade security using Firebase Authentication. Your financial data is encrypted and strictly private." }
  ];

  return (
    <section id="features" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Everything you need to <br className="hidden md:block"/>master your finances</h2>
          <p className="text-lg text-[#94A3B8]">A complete suite of tools designed to give you absolute clarity and control over your wealth generation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative bg-[#111827]/50 backdrop-blur-sm border border-white/10 p-8 rounded-[24px] hover:bg-[#111827] transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#FBBF24]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[24px] pointer-events-none" />
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-white group-hover:text-[#FBBF24] group-hover:scale-110 transition-all">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
              <p className="text-[#94A3B8] leading-relaxed text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ProductShowcase = () => {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ["Dashboard", "Analytics", "Budgets", "Goals", "AI Advisor"];

  return (
    <section id="showcase" className="py-32 bg-black/40 border-y border-white/5 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FBBF24]/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">See Cashtrack AI In Action</h2>
          <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">Experience a beautifully crafted interface that makes managing money not just easy, but enjoyable.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {tabs.map((tab, i) => (
            <button 
              key={i}
              onClick={() => setActiveTab(i)}
              className={`px-6 py-3 rounded-full text-sm font-semibold transition-all ${
                activeTab === i 
                  ? "bg-white text-[#050816] shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
                  : "bg-white/5 text-[#94A3B8] hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="w-full aspect-[16/10] md:aspect-[16/9] bg-[#111827] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden relative flex items-center justify-center">
          {/* Mockup Placeholder - In a real app, use actual screenshots */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center"
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#FBBF24]/20 to-[#F97316]/20 flex items-center justify-center mb-6 border border-white/10">
                <Sparkles className="w-10 h-10 text-[#FBBF24]" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">{tabs[activeTab]} Interface</h3>
              <p className="text-[#94A3B8] max-w-md">
                This area showcases realistic, high-fidelity mockups of the {tabs[activeTab]} view to build immense trust with potential users.
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

const HowItWorks = () => {
  const steps = [
    { num: "01", title: "Create Account", desc: "Sign up securely in 30 seconds." },
    { num: "02", title: "Add Transactions", desc: "Log income and expenses seamlessly." },
    { num: "03", title: "Create Budgets", desc: "Define monthly category limits." },
    { num: "04", title: "Set Savings Goals", desc: "Aim for vacations, cars, or emergencies." },
    { num: "05", title: "Receive AI Insights", desc: "Let the AI optimize your financial flow." }
  ];

  return (
    <section className="py-32">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-20 text-center tracking-tight">Your path to financial freedom</h2>
        
        <div className="relative">
          <div className="hidden lg:block absolute top-[45px] left-[50px] right-[50px] h-0.5 bg-gradient-to-r from-[#FBBF24] via-[#F97316] to-[#D97706] opacity-30" />
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-6">
            {steps.map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative z-10 flex flex-col items-center text-center lg:items-start lg:text-left"
              >
                <div className="w-24 h-24 rounded-full bg-[#050816] border-[4px] border-[#111827] shadow-[0_0_20px_rgba(124,58,237,0.15)] flex items-center justify-center text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#FBBF24] to-[#F97316] mb-6">
                  {step.num}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const AiAdvisorSection = () => {
  return (
    <section id="advisor" className="py-32 bg-[#111827]/30 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Chat UI Mockup */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-[#050816] border border-white/10 rounded-[32px] p-6 shadow-2xl relative overflow-hidden"
        >
          <div className="flex items-center gap-4 border-b border-white/10 pb-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FBBF24] to-[#D97706] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold">Cashtrack AI Advisor</h3>
              <p className="text-xs text-[#10B981] flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#10B981] rounded-full inline-block" /> Online</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-end">
              <div className="bg-[#111827] border border-white/5 text-white px-5 py-3 rounded-2xl rounded-tr-sm max-w-[80%] text-sm">
                How can I save more money for my Bike goal this month?
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-gradient-to-br from-[#FBBF24]/20 to-[#D97706]/10 border border-[#FBBF24]/30 text-white px-5 py-4 rounded-2xl rounded-tl-sm max-w-[90%] text-sm leading-relaxed">
                <p className="mb-3">Based on your recent transactions, here is your action plan:</p>
                <ul className="space-y-2 mb-3">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10B981]" /> Reduce discretionary dining spending by 15% (saves ₹1,500).</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10B981]" /> Shift ₹500 from Entertainment budget to Savings.</li>
                </ul>
                <p className="text-[#94A3B8]">Applying this will put you on track to achieve the Bike goal by August 15th.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-full h-12 px-4 flex items-center text-sm text-[#94A3B8]">
              Type a question...
            </div>
            <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </motion.div>

        <div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Your private wealth advisor, <br/><span className="text-[#FBBF24]">available 24/7.</span></h2>
          <p className="text-lg text-[#94A3B8] mb-10 leading-relaxed">
            Stop guessing. Our generative AI analyzes your unique cash flow, categorizes habits, and provides actionable, personalized steps to accelerate your wealth generation.
          </p>

          <div className="space-y-6">
            {[
              "Smart Spending Insights",
              "Proactive Budget Suggestions",
              "Savings Acceleration Recommendations",
              "Goal Feasibility Planning",
              "Deep Spending Analysis"
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-[#FBBF24]" />
                </div>
                <span className="text-white font-medium">{benefit}</span>
              </div>
            ))}
          </div>

          <Link href="/signup" className="mt-12 inline-flex items-center gap-2 text-white font-bold border-b border-white pb-1 hover:text-[#FBBF24] hover:border-[#FBBF24] transition-all">
            Try AI Advisor Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

const Testimonials = () => {
  const reviews = [
    { name: "Sarah Jenkins", role: "Software Engineer", content: "Cashtrack AI completely changed how I look at my salary. The AI insights caught a leaky subscription I hadn't noticed in months." },
    { name: "David Chen", role: "Freelance Designer", content: "Finally, a finance app that looks as good as the designs I create. The budgeting tools are incredibly intuitive and robust." },
    { name: "Priya Sharma", role: "Marketing Director", content: "I achieved my savings goal for a European vacation 3 months early thanks to the automated suggestions from the AI advisor." },
    { name: "Michael Ross", role: "Product Manager", content: "The level of clarity this dashboard provides is unmatched. It feels like having a CFO in my pocket." },
    { name: "Elena Rodriguez", role: "Entrepreneur", content: "Switching from messy spreadsheets to Cashtrack AI was the best decision for my personal finances this year." },
    { name: "James Wilson", role: "Doctor", content: "Clean, secure, and incredibly smart. The dashboard alone is worth paying for, let alone the generative AI features." },
  ];

  return (
    <section className="py-32">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-20 text-center tracking-tight">Loved by high performers</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#111827]/40 border border-white/5 p-8 rounded-[24px] hover:border-white/10 hover:bg-[#111827]/80 transition-colors flex flex-col"
            >
              <div className="flex gap-1 mb-6 text-[#F59E0B]">
                {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-white text-lg leading-relaxed mb-8 flex-1">"{review.content}"</p>
              <div className="flex items-center gap-4 mt-auto">
                <img src={`https://i.pravatar.cc/100?img=${i + 40}`} alt={review.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <h4 className="text-white font-bold">{review.name}</h4>
                  <p className="text-xs text-[#94A3B8]">{review.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};



const FAQ = () => {
  const faqs = [
    { q: "Is my financial data secure?", a: "Absolutely. We utilize enterprise-grade Firebase Authentication and Firestore security rules. Your personal financial data is strictly private and encrypted." },
    { q: "How does AI Advisor work?", a: "Our AI Advisor securely analyzes your transaction history and budgets to generate hyper-personalized insights, alerting you to spending anomalies and suggesting optimization strategies." },
    { q: "Can I export reports?", a: "Yes. Premium users can generate and export highly detailed financial reports in PDF and CSV formats for use with tax professionals or external tools." },
    { q: "Can I create multiple goals?", a: "Pro and Premium tier users can create unlimited concurrent savings goals and track them seamlessly against their liquid balances." },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-32">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-16 text-center tracking-tight">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-[#111827]/50 border border-white/5 rounded-2xl overflow-hidden transition-colors hover:bg-[#111827]">
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-6 py-5 flex justify-between items-center text-left"
              >
                <span className="font-bold text-white text-lg">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-[#94A3B8] transition-transform ${openIndex === i ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-5 text-[#94A3B8] leading-relaxed"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FinalCTA = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#FBBF24]/10 pointer-events-none" />
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">Start Building Better Financial Habits Today</h2>
        <p className="text-xl text-[#94A3B8] mb-12 max-w-2xl mx-auto">
          Join thousands of users managing money smarter with AI. It takes less than 30 seconds to set up your account.
        </p>
        <Link href="/signup" className="inline-flex items-center justify-center h-16 px-10 bg-white text-[#050816] font-bold text-lg rounded-full hover:bg-neutral-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105">
          Get Started Free
        </Link>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-[#050816] border-t border-white/10 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FBBF24] to-[#D97706] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-white">Cashtrack AI</span>
            </Link>
            <p className="text-[#94A3B8] text-sm max-w-xs leading-relaxed">
              The premier AI-powered financial command center designed for modern wealth builders and ambitious professionals.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-[#94A3B8]">
              <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="#showcase" className="hover:text-white transition-colors">Analytics</Link></li>
              <li><Link href="#advisor" className="hover:text-white transition-colors">AI Advisor</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-[#94A3B8]">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-[#94A3B8]">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#94A3B8] text-sm">© {new Date().getFullYear()} Cashtrack AI. All rights reserved.</p>

        </div>
      </div>
    </footer>
  );
};

// --- Main Page Assembly ---

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050816] text-white font-sans selection:bg-[#FBBF24]/30">
      <Navbar />
      <main>
        <Hero />
        <TrustMetrics />
        <Features />
        <ProductShowcase />
        <HowItWorks />
        <AiAdvisorSection />
        <Testimonials />

        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
