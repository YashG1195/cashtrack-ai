"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getCurrencySymbol } from "@/lib/finance";
import { TransactionRepository, Transaction } from "@/repositories/transaction.repository";
import { BudgetRepository, Budget } from "@/repositories/budget.repository";
import { GoalRepository, SavingsGoal } from "@/repositories/goal.repository";
import { SettingsRepository } from "@/repositories/settings.repository";
import { AIChatRepository } from "@/repositories/aiChat.repository";
import { askAIAdvisor, ChatMessage } from "@/lib/ai";
import { 
  Sparkles, 
  Send, 
  Trash2, 
  Loader2, 
  Bot, 
  User as UserIcon, 
  ArrowRight,
  RefreshCw
} from "lucide-react";

export default function AIAdvisorPage() {
  const { user } = useAuth();
  const { currency: currencyCode } = useTheme();
  const currency = getCurrencySymbol(currencyCode);
  // Financial State Context
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [customApiKey, setCustomApiKey] = useState<string | undefined>(undefined);
  const [loadingContext, setLoadingContext] = useState(true);

  // Chat State
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string>("closest");
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const suggestionChips = [
    "Analyze my spending habits",
    "How am I doing on savings?",
    "Give budget recommendations",
    "What is my financial health score?",
    "Review my budget"
  ];

  // Load context data (transactions, budgets, goals) once on load
  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        const [txs, budg, goals, setts] = await Promise.all([
          TransactionRepository.list(user!.uid),
          BudgetRepository.list(user!.uid),
          GoalRepository.list(user!.uid),
          SettingsRepository.get(user!.uid)
        ]);
        setTransactions(txs);
        setBudgets(budg);
        setSavingsGoals(goals);
        setCustomApiKey(setts.geminiApiKey || undefined);
      } catch (err) {
        console.error("Failed to load advisor context:", err);
      } finally {
        setLoadingContext(false);
      }
    }

    loadData();
  }, [user]);

  // Subscribe to chat history from Firestore/LocalStorage in realtime
  useEffect(() => {
    if (!user) return;

    const unsubscribe = AIChatRepository.subscribe(
      user.uid,
      (list) => {
        setMessages(list);
      },
      (err) => console.error("AIChats subscription error:", err)
    );

    return () => unsubscribe();
  }, [user]);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || sending || !user) return;

    const currentText = textToSend;
    setInput("");
    setSending(true);

    try {
      // Fetch fresh context from repositories in real-time
      const [freshTxs, freshBudgets, freshGoals] = await Promise.all([
        TransactionRepository.list(user.uid),
        BudgetRepository.list(user.uid),
        GoalRepository.list(user.uid)
      ]);

      setTransactions(freshTxs);
      setBudgets(freshBudgets);
      setSavingsGoals(freshGoals);

      // 1. Add user message to repo (persisted in Firestore or LocalStorage)
      await AIChatRepository.add(user.uid, "user", currentText);

      // Map messages for API format
      const apiHistory: ChatMessage[] = messages.map(m => ({
        role: m.role,
        parts: m.message
      }));

      // 2. Call API route to query Gemini
      const response = await askAIAdvisor({
        transactions: freshTxs,
        budgets: freshBudgets,
        savingsGoals: freshGoals,
        message: currentText,
        history: apiHistory,
        customApiKey,
        currency,
        selectedGoalId
      });

      // 3. Add assistant response to repo
      await AIChatRepository.add(user.uid, "assistant", response.content);
    } catch (err) {
      console.error(err);
      await AIChatRepository.add(
        user.uid, 
        "assistant", 
        "⚠️ Sorry, I ran into an issue processing your query. Please check your API keys and try again."
      );
    } finally {
      setSending(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const handleClearChat = async () => {
    if (!user) return;
    if (confirm("Are you sure you want to clear chat history?")) {
      try {
        await AIChatRepository.clear(user.uid);
      } catch (err) {
        console.error("Failed to clear chat:", err);
      }
    }
  };

  // Basic custom markdown parser to convert **bold**, *bullet*, and ### headers
  const renderMessageContent = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      // Headers
      if (line.startsWith("### ")) {
        return <h4 key={i} className="text-sm font-bold mt-3 mb-1.5 text-neutral-900 dark:text-white">{line.replace("### ", "")}</h4>;
      }
      
      // Bullets
      if (line.startsWith("* ") || line.startsWith("- ")) {
        const content = line.substring(2);
        return (
          <li key={i} className="ml-4 list-disc text-xs text-neutral-700 dark:text-gray-200 leading-relaxed mb-1">
            {parseBoldText(content)}
          </li>
        );
      }

      // Normal lines
      return (
        <p key={i} className="text-xs text-neutral-800 dark:text-gray-200 leading-relaxed mb-2">
          {parseBoldText(line)}
        </p>
      );
    });
  };

  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-bold text-neutral-900 dark:text-white">{part}</strong>;
      }
      return part;
    });
  };

  const formatTime = (date: any) => {
    if (!date) return "";
    const parsedDate = date instanceof Date ? date : new Date(date);
    return parsedDate.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit"
    });
  };

  const isRealGemini = !!(customApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY);

  if (loadingContext) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 overflow-hidden relative">
      {/* Top Banner */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-900 bg-white dark:bg-neutral-950 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 fill-amber-500/20" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">AI Financial Advisor</h3>
            <p className="text-[10px] text-neutral-400 mt-0.5 font-medium">
              Get personalized financial guidance powered by Gemini AI.
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          disabled={messages.length <= 1}
          className="p-2 text-neutral-400 hover:text-red-500 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
          title="Clear Chat History"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Focus Goal Selector */}
      {savingsGoals.length > 0 && (
        <div className="flex items-center justify-between px-5 py-2.5 bg-neutral-50 dark:bg-neutral-900/20 border-b border-neutral-100 dark:border-neutral-900 text-xs z-10">
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 font-semibold dark:text-neutral-400">Focus Savings Goal:</span>
            <select
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="bg-transparent border border-neutral-200 dark:border-neutral-800 rounded px-2.5 py-1 outline-none text-neutral-800 dark:text-neutral-200 font-semibold cursor-pointer"
            >
              <option value="closest" className="bg-white dark:bg-neutral-900">Closest to Completion (Default)</option>
              {savingsGoals.map((g) => (
                <option key={g.id} value={g.id} className="bg-white dark:bg-neutral-900">{g.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-neutral-50/50 dark:bg-neutral-900/10">
        {messages.map((msg, index) => {
          const isBot = msg.role === "assistant";
          return (
            <div 
              key={index}
              className={`flex gap-3 max-w-[85%] ${isBot ? "self-start" : "self-end flex-row-reverse ml-auto"}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-sm border ${
                isBot 
                  ? "bg-gradient-to-tr from-amber-500 to-yellow-600 border-amber-400/20" 
                  : "bg-neutral-800 border-neutral-700"
              }`}>
                {isBot ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
              </div>

              {/* Message Bubble + Timestamp */}
              <div className="space-y-1 max-w-[calc(100%-3rem)]">
                <div className={`p-4 rounded-2xl ${
                  isBot 
                    ? "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/80 rounded-tl-sm shadow-sm" 
                    : "bg-amber-600 text-white rounded-tr-sm shadow-sm"
                }`}>
                  {isBot ? (
                    <div className="space-y-0.5">
                      {renderMessageContent(msg.message)}
                    </div>
                  ) : (
                    <p className="text-xs leading-relaxed">{msg.message}</p>
                  )}
                </div>
                {msg.timestamp && (
                  <p className={`text-[9px] text-neutral-400 font-medium ${isBot ? "text-left" : "text-right"}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator bubble */}
        {sending && (
          <div className="flex gap-3 max-w-[85%] self-start animate-pulse">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-600 border border-amber-400/20 text-white shadow-sm flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/80 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
              <span className="text-[10px] text-neutral-400 font-semibold">AI is analyzing profile context...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length <= 1 && !sending && (
        <div className="px-5 py-2.5 flex flex-wrap gap-2 justify-center bg-neutral-50/25 dark:bg-neutral-900/5 border-t border-neutral-100 dark:border-neutral-900">
          {suggestionChips.map((chip) => (
            <button
              key={chip}
              onClick={() => handleSendMessage(chip)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-amber-500/30 text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/5 transition-all cursor-pointer shadow-xs"
            >
              <span>{chip}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      {/* Input Form Footer */}
      <div className="p-4 border-t border-neutral-100 dark:border-neutral-900 bg-white dark:bg-neutral-950">
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <input
            type="text"
            required
            disabled={sending}
            placeholder={sending ? "AI is formulating response..." : "Ask your financial advisor..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 h-10 px-4 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 focus:border-amber-500 outline-none transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="w-10 h-10 rounded-xl bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(79,70,229,0.2)]"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
