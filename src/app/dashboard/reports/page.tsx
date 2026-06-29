"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getCurrencySymbol } from "@/lib/finance";
import { TransactionRepository, Transaction } from "@/repositories/transaction.repository";
import { BudgetRepository, Budget } from "@/repositories/budget.repository";
import { GoalRepository, SavingsGoal } from "@/repositories/goal.repository";
import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Target, 
  Loader2, 
  Sparkles, 
  FileSpreadsheet, 
  TableProperties,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from "lucide-react";
import { Cell, PieChart, Pie, ResponsiveContainer, Tooltip } from "recharts";
import { sanitizeTextForPDF, sanitizeForWinAnsi } from "@/lib/pdf-utils";

export default function ReportsPage() {
  const { user } = useAuth();
  const { currency: currencyCode } = useTheme();
  const currency = getCurrencySymbol(currencyCode);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // Month-Year selection state
  const [selectedMonth, setSelectedMonth] = useState(""); // YYYY-MM
  const [monthsList, setMonthsList] = useState<{ value: string; label: string }[]>([]);

  // AI report states
  const [aiSummary, setAiSummary] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);

  // Load basic lists
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    Promise.all([
      TransactionRepository.list(user.uid),
      BudgetRepository.list(user.uid),
      GoalRepository.list(user.uid)
    ]).then(([txs, bdgts, gls]) => {
      setTransactions(txs);
      setBudgets(bdgts);
      setGoals(gls);

      // Generate list of available months based on transactions
      const months = new Set<string>();
      
      // Default current month
      const now = new Date();
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      months.add(currentMonthStr);

      txs.forEach((t) => {
        if (t.date) {
          months.add(t.date.substring(0, 7)); // get YYYY-MM
        }
      });

      const sortedMonths = Array.from(months).sort((a, b) => b.localeCompare(a));
      const list = sortedMonths.map((m) => {
        const [yr, mn] = m.split("-");
        const date = new Date(parseInt(yr), parseInt(mn) - 1, 1);
        return {
          value: m,
          label: date.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
        };
      });

      setMonthsList(list);
      setSelectedMonth(currentMonthStr);
      setLoading(false);
    }).catch((err) => {
      console.error("Failed to load report data:", err);
      setLoading(false);
    });
  }, [user]);

  // Trigger AI analysis when selectedMonth changes
  useEffect(() => {
    if (!selectedMonth || !user) return;
    handleGenerateAI();
  }, [selectedMonth, user]);

  const handleGenerateAI = async () => {
    if (!user || !selectedMonth) return;
    setGeneratingAi(true);
    setAiSummary("");
    try {
      const monthTxs = transactions.filter(t => t.date.startsWith(selectedMonth));
      const activeBudgets = budgets.filter(b => b.month === selectedMonth);

      const res = await fetch("/api/advisor/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: getMonthLabel(selectedMonth),
          transactions: monthTxs,
          budgets: activeBudgets,
          savingsGoals: goals,
          currency
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.content);
      } else {
        const errData = await res.json();
        setAiSummary(errData.fallback || "Failed to generate report summary.");
      }
    } catch (err) {
      console.error("Failed to run report AI summary:", err);
      setAiSummary("An error occurred during AI analysis. Local fallback summary is unavailable.");
    } finally {
      setGeneratingAi(false);
    }
  };

  const getMonthLabel = (mVal: string) => {
    return monthsList.find(m => m.value === mVal)?.label || mVal;
  };

  // Filtered lists for calculation
  const monthlyTxs = transactions.filter((t) => t.date && t.date.startsWith(selectedMonth));
  const monthlyBudgets = budgets.filter((b) => b.month === selectedMonth);

  // Calculations
  const income = monthlyTxs.filter((t) => t.type === "income").reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const expenses = monthlyTxs.filter((t) => t.type === "expense").reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netFlow = income - expenses;
  const savingsRate = income > 0 ? (netFlow / income) * 100 : 0;

  // Group categories
  const categorySpent: Record<string, number> = {};
  monthlyTxs.filter((t) => t.type === "expense").forEach((t) => {
    categorySpent[t.category] = (categorySpent[t.category] || 0) + Math.abs(t.amount);
  });

  const chartColors = ["var(--brand-500)", "#10b981", "#f59e0b", "#F97316", "#8b5cf6", "#06b6d4", "#ef4444", "#6b7280"];
  const pieData = Object.entries(categorySpent).map(([name, value], i) => ({
    name,
    value,
    color: chartColors[i % chartColors.length]
  }));

  // PDF Export
  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable, applyPlugin } = await import("jspdf-autotable");
      applyPlugin(jsPDF);

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      let fontName = "Helvetica";

      try {
        const [regRes, boldRes] = await Promise.all([
          fetch("/fonts/Roboto-Regular.ttf"),
          fetch("/fonts/Roboto-Bold.ttf")
        ]);
        if (regRes.ok && boldRes.ok) {
          const [regBuffer, boldBuffer] = await Promise.all([
            regRes.arrayBuffer(),
            boldRes.arrayBuffer()
          ]);

          const bufferToBase64 = (buf: ArrayBuffer): Promise<string> => {
            return new Promise((resolve) => {
              const blob = new Blob([buf], { type: "application/octet-stream" });
              const reader = new FileReader();
              reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                const base64 = dataUrl.split(",")[1];
                resolve(base64);
              };
              reader.readAsDataURL(blob);
            });
          };

          const regBase64 = await bufferToBase64(regBuffer);
          const boldBase64 = await bufferToBase64(boldBuffer);

          doc.addFileToVFS("Roboto-Regular.ttf", regBase64);
          doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
          doc.addFileToVFS("Roboto-Bold.ttf", boldBase64);
          doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

          fontName = "Roboto";
        } else {
          console.warn("Could not download Roboto font files, using Helvetica fallback");
        }
      } catch (err) {
        console.warn("Failed to fetch custom fonts, using Helvetica fallback", err);
      }

      // Safe text wrapper that sanitizes and runs win-ansi fallback if using Helvetica
      const cleanText = (text: string) => {
        const sanitized = sanitizeTextForPDF(text);
        if (fontName === "Helvetica") {
          return sanitizeForWinAnsi(sanitized);
        }
        return sanitized;
      };

      doc.setFont(fontName, "normal");

      const monthName = getMonthLabel(selectedMonth);

      // Title & Branding
      doc.setFont(fontName, "bold");
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229); // Amber 600
      doc.text("MoneyFlow AI", 14, 20);

      doc.setFont(fontName, "normal");
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128); // Gray 500
      doc.text("Premium Wealth Management Platform", 14, 25);

      doc.setFont(fontName, "bold");
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39); // Gray 900
      doc.text(`Monthly Financial Report - ${monthName}`, 14, 35);

      doc.setDrawColor(229, 231, 235);
      doc.line(14, 38, 196, 38);

      // KPI Summary Section
      doc.setFont(fontName, "bold");
      doc.setFontSize(10);
      doc.setTextColor(17, 24, 39);
      doc.text("SUMMARY METRICS", 14, 45);

      const cleanCurrency = cleanText(currency);

      doc.setFont(fontName, "normal");
      doc.text(`Total Monthly Income:`, 14, 52);
      doc.setFont(fontName, "bold");
      doc.text(`${cleanCurrency}${income.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 70, 52);

      doc.setFont(fontName, "normal");
      doc.text(`Total Monthly Expenses:`, 14, 58);
      doc.setFont(fontName, "bold");
      doc.text(`${cleanCurrency}${expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 70, 58);

      doc.setFont(fontName, "normal");
      doc.text(`Net Cash Flow surplus:`, 14, 64);
      doc.setFont(fontName, "bold");
      doc.text(`${cleanCurrency}${netFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 70, 64);

      doc.setFont(fontName, "normal");
      doc.text(`Monthly Savings Rate:`, 14, 70);
      doc.setFont(fontName, "bold");
      doc.text(`${savingsRate.toFixed(1)}%`, 70, 70);

      // Budget performance list
      doc.setFont(fontName, "bold");
      doc.text("BUDGET PERFORMANCE", 14, 80);

      const budgetRows = monthlyBudgets.map(b => {
        const spent = categorySpent[b.category] || 0;
        const remaining = b.amount - spent;
        const usage = b.amount > 0 ? (spent / b.amount) * 100 : 0;
        return [
          cleanText(b.category),
          `${cleanCurrency}${b.amount.toFixed(0)}`,
          `${cleanCurrency}${spent.toFixed(0)}`,
          `${cleanCurrency}${remaining.toFixed(0)}`,
          `${usage.toFixed(0)}%`
        ];
      });

      autoTable(doc, {
        startY: 84,
        head: [["Category", "Budget Limit", "Spent Amount", "Remaining", "Usage %"]],
        body: budgetRows.length > 0 ? budgetRows : [["No budgets set up for this month", "-", "-", "-", "-"]],
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229], font: fontName, fontStyle: "bold" },
        styles: { fontSize: 8, font: fontName },
      });

      let currentY = (doc as any).lastAutoTable.finalY + 10;

      // AI summary card
      if (aiSummary) {
        if (currentY > 210) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFont(fontName, "bold");
        doc.setFontSize(10);
        doc.setTextColor(79, 70, 229);
        doc.text("AI ADVISOR REPORT SUMMARY", 14, currentY);
        
        const lines = aiSummary.split("\n");
        doc.setFont(fontName, "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(55, 65, 81); // Gray 700

        let textY = currentY + 6;
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 14;
        const contentWidth = 182; // 210 - 14 * 2

        for (const line of lines) {
          const cleanLine = cleanText(line);
          if (!cleanLine.trim()) {
            // Paragraph spacing
            textY += 3;
            continue;
          }

          // Check if it's a heading
          if (line.trim().startsWith("###")) {
            doc.setFont(fontName, "bold");
            doc.setFontSize(10);
            doc.setTextColor(17, 24, 39); // Gray 900
            
            const cleanHeading = cleanLine.replace(/###\s*/, "").trim();
            
            if (textY + 6 > pageHeight - margin) {
              doc.addPage();
              textY = 20;
            }

            doc.text(cleanHeading, margin, textY);
            textY += 5.5;
            
            doc.setFont(fontName, "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(55, 65, 81);
          } else if (line.trim().startsWith("*") || line.trim().startsWith("-")) {
            // Bullet point
            doc.setFont(fontName, "normal");
            const cleanBulletText = cleanLine.replace(/^[\*\-]\s*/, "").trim();
            const fullText = "- " + cleanBulletText;
            
            const splitBullet = doc.splitTextToSize(fullText, contentWidth);
            const linesCount = splitBullet.length;
            const blockHeight = linesCount * 4;

          if (textY + blockHeight > pageHeight - margin) {
            doc.addPage();
            textY = 20;
          }

          doc.text(splitBullet, margin, textY);
          textY += blockHeight + 1.5;
        } else {
          // Normal paragraph line
          const splitRegular = doc.splitTextToSize(cleanLine, contentWidth);
          const linesCount = splitRegular.length;
          const blockHeight = linesCount * 4;

          if (textY + blockHeight > pageHeight - margin) {
            doc.addPage();
            textY = 20;
          }

          doc.text(splitRegular, margin, textY);
          textY += blockHeight + 1.5;
        }
      }
    }

    doc.save(`MoneyFlow_Report_${monthName.replace(/\s+/g, "_")}.pdf`);
  } catch (err: any) {
    console.error("PDF Export failed:", err);
    alert(`PDF Export failed: ${err.message || err}`);
  }
};

  // Excel Export
  const handleExportXLSX = async () => {
    const XLSX = await import("xlsx");

    const monthLabel = getMonthLabel(selectedMonth).replace(/\s+/g, "_");

    // Transactions Sheet
    const txRows = monthlyTxs.map(t => ({
      Date: t.date,
      Category: t.category,
      Type: t.type,
      Amount: t.amount,
      Note: t.note || "",
    }));

    const budgetsRows = monthlyBudgets.map(b => {
      const spent = categorySpent[b.category] || 0;
      return {
        Category: b.category,
        "Limit Amount": b.amount,
        "Spent Amount": spent,
        Remaining: b.amount - spent,
      };
    });

    const goalsRows = goals.map(g => ({
      "Goal Name": g.name,
      "Target Amount": g.targetAmount,
      "Saved Amount": g.currentAmount,
      "Remaining Amount": Math.max(0, g.targetAmount - g.currentAmount),
      Deadline: g.targetDate,
      Color: g.color || "purple"
    }));

    const wb = XLSX.utils.book_new();

    const wsTxs = XLSX.utils.json_to_sheet(txRows);
    XLSX.utils.book_append_sheet(wb, wsTxs, "Transactions");

    const wsBudgets = XLSX.utils.json_to_sheet(budgetsRows);
    XLSX.utils.book_append_sheet(wb, wsBudgets, "Budgets");

    const wsGoals = XLSX.utils.json_to_sheet(goalsRows);
    XLSX.utils.book_append_sheet(wb, wsGoals, "Savings Goals");

    XLSX.writeFile(wb, `MoneyFlow_Report_${monthLabel}.xlsx`);
  };

  // CSV Export
  const handleExportCSV = () => {
    const monthLabel = getMonthLabel(selectedMonth).replace(/\s+/g, "_");

    // Format Transactions to CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Type,Category,Amount,Date,Note\n";

    monthlyTxs.forEach((t) => {
      const note = t.note ? `"${t.note.replace(/"/g, '""')}"` : "";
      csvContent += `${t.type},${t.category},${t.amount},${t.date},${note}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MoneyFlow_Transactions_${monthLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Month Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Financial Reports</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Download professional financial statements or view interactive health analyses.
          </p>
        </div>

        {/* Month Picker & Button Groups */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-10 px-3 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white outline-none cursor-pointer"
          >
            {monthsList.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Export Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1 px-3 h-10 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-md transition-colors"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            <button
              onClick={handleExportXLSX}
              className="inline-flex items-center gap-1 px-3 h-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-md transition-colors"
              title="Export to Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1 px-3 h-10 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              title="Export to CSV"
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40">
          <div className="flex justify-between items-center text-neutral-400 text-xs font-medium uppercase tracking-wider">
            <span>Income</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white mt-1.5">
            {currency}{income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40">
          <div className="flex justify-between items-center text-neutral-400 text-xs font-medium uppercase tracking-wider">
            <span>Expenses</span>
            <ArrowDownRight className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white mt-1.5">
            {currency}{expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40">
          <div className="flex justify-between items-center text-neutral-400 text-xs font-medium uppercase tracking-wider">
            <span>Net Flow</span>
            <TrendingUp className={`w-4 h-4 ${netFlow >= 0 ? "text-emerald-500" : "text-red-500"}`} />
          </div>
          <div className={`text-xl font-bold mt-1.5 ${netFlow >= 0 ? "text-neutral-900 dark:text-white" : "text-red-500"}`}>
            {currency}{netFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40">
          <div className="flex justify-between items-center text-neutral-400 text-xs font-medium uppercase tracking-wider">
            <span>Savings Rate</span>
            <Target className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white mt-1.5">
            {savingsRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Main Breakdown Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Spending Breakdown & Budgets */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Spending Breakdown Chart */}
          <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Outflow Breakdown</h3>
            
            {pieData.length === 0 ? (
              <p className="text-xs text-neutral-400 py-10 text-center">No expense data available for this month.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val) => [`${currency}${Number(val).toFixed(2)}`, "Outflow"]}
                        contentStyle={{ background: "#171717", borderRadius: "10px", border: "none" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-neutral-700 dark:text-neutral-300 truncate font-medium">{item.name}</span>
                      </div>
                      <span className="text-neutral-500 font-bold ml-2">
                        {currency}{item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Budget Progress Card */}
          <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-amber-500" />
                <span>Budget Health</span>
              </h3>
            </div>

            {monthlyBudgets.length === 0 ? (
              <p className="text-xs text-neutral-400 py-6 text-center">No budgets configured for this month.</p>
            ) : (
              <div className="space-y-4">
                {monthlyBudgets.map((b) => {
                  const spent = categorySpent[b.category] || 0;
                  const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
                  const isOver = spent > b.amount;

                  return (
                    <div key={b.category} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-neutral-800 dark:text-neutral-200">{b.category}</span>
                        <span className={isOver ? "text-red-500" : "text-neutral-500"}>
                          {currency}{spent.toLocaleString()} / {currency}{b.amount.toLocaleString()} ({pct.toFixed(0)}%)
                        </span>
                      </div>

                      <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${Math.min(pct, 100)}%` }}
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOver ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-amber-500"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Insights & Savings Progress */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* AI Advisor Report Summary */}
          <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/10 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-[50px] pointer-events-none" />
            
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 z-10">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500/20 animate-bounce" />
                <span>AI Monthly Performance Report</span>
              </h3>
              <button 
                onClick={handleGenerateAI}
                disabled={generatingAi}
                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-400 cursor-pointer disabled:opacity-50"
                title="Regenerate Summary"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generatingAi ? "animate-spin text-amber-500" : ""}`} />
              </button>
            </div>

            {generatingAi ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">Running AI Analysis...</span>
              </div>
            ) : aiSummary ? (
              <div className="prose prose-sm dark:prose-invert text-xs text-neutral-600 dark:text-neutral-300 max-h-96 overflow-y-auto leading-relaxed space-y-3 pr-2 scrollbar-thin">
                {aiSummary.split("\n").map((line, idx) => {
                  if (line.startsWith("###")) {
                    return (
                      <h4 key={idx} className="text-xs font-bold text-neutral-900 dark:text-white pt-2 first:pt-0">
                        {line.replace("###", "").trim()}
                      </h4>
                    );
                  }
                  if (line.trim().startsWith("*") || line.trim().startsWith("-")) {
                    return (
                      <div key={idx} className="flex gap-2 pl-2 text-neutral-600 dark:text-neutral-300">
                        <span>•</span>
                        <span>{line.replace(/^[\*\-]/, "").trim()}</span>
                      </div>
                    );
                  }
                  if (line.trim().startsWith("1.") || line.trim().startsWith("2.") || line.trim().startsWith("3.")) {
                    return (
                      <div key={idx} className="flex gap-2 pl-2 text-neutral-600 dark:text-neutral-300">
                        <span className="font-bold">{line.substring(0, 2)}</span>
                        <span>{line.substring(2).trim()}</span>
                      </div>
                    );
                  }
                  return line.trim() ? (
                    <p key={idx}>{line.trim()}</p>
                  ) : null;
                })}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 py-8 text-center">Unable to compile report insights.</p>
            )}
          </div>

          {/* Savings Target Checklist */}
          <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <Target className="w-4 h-4 text-purple-500" />
              <span>Savings Targets Progress</span>
            </h3>

            {goals.length === 0 ? (
              <p className="text-xs text-neutral-400 py-6 text-center">No active savings targets.</p>
            ) : (
              <div className="space-y-4">
                {goals.map((g) => {
                  const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
                  const remaining = Math.max(0, g.targetAmount - g.currentAmount);

                  return (
                    <div key={g.id} className="space-y-1.5 border-b border-neutral-100 dark:border-neutral-900/50 last:border-none pb-3 last:pb-0">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-neutral-800 dark:text-neutral-200">{g.name}</span>
                        <span className="text-neutral-500">{pct.toFixed(0)}% Complete</span>
                      </div>
                      
                      <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${Math.min(pct, 100)}%` }}
                          className="h-full bg-purple-500 rounded-full transition-all duration-300"
                        />
                      </div>

                      <div className="flex justify-between text-[10px] text-neutral-400 font-medium">
                        <span>Remaining: {currency}{remaining.toLocaleString()}</span>
                        <span>Deadline: {g.targetDate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
