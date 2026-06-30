import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month, transactions, budgets, savingsGoals, currency = "$", customApiKey } = body;

    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    // If no API key, return generated mock summary
    if (!apiKey || apiKey.trim() === "") {
      return NextResponse.json({
        content: generateMockReportSummary(month, transactions, budgets, savingsGoals, currency),
        isMock: true
      });
    }

    // Helper statistics
    const income = transactions.filter((t: any) => t.type === "income").reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
    const expenses = transactions.filter((t: any) => t.type === "expense").reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
    const netFlow = income - expenses;

    const categories: Record<string, number> = {};
    transactions.filter((t: any) => t.type === "expense").forEach((t: any) => {
      categories[t.category] = (categories[t.category] || 0) + Math.abs(t.amount);
    });

    let topCategory = "None";
    let topAmount = 0;
    Object.entries(categories).forEach(([cat, val]) => {
      if (val > topAmount) {
        topAmount = val;
        topCategory = cat;
      }
    });

    const systemPrompt = `
You are Cashtrack AI, an elite SaaS financial advisor.
Generate a structured, professional Monthly Financial Report Summary for the month of ${month}.

User's Financial Summary:
- Currency: ${currency}
- Total Income: ${currency}${income.toFixed(2)}
- Total Expenses: ${currency}${expenses.toFixed(2)}
- Net Cash Flow: ${currency}${netFlow.toFixed(2)}
- Top Expense Category: ${topCategory} (${currency}${topAmount.toFixed(2)})
- Active Budgets: ${JSON.stringify(budgets)}
- Category Spent Breakdown: ${JSON.stringify(categories)}
- Savings Goals Status: ${JSON.stringify(savingsGoals)}

Format requirements:
1. Use clean Markdown headings (e.g., ### 📊 Executive Cash Flow, ### 🛡️ Budget Performance, ### 🎯 Savings Goals Analysis, ### 💡 Key Recommendations).
2. Start with an executive cash flow status.
3. Be analytical: point out budget overruns or highlights.
4. Keep paragraphs short and use bolding and bullet points for scan-readability.
5. Provide 3 specific, actionable recommendations.
6. Do NOT mention hypothetical figures; only use the numbers provided above.
7. Keep text high contrast and readable.
`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt }]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Report Error:", errorText);
      return NextResponse.json({
        error: "Failed to generate AI report summary. Check your API key.",
        fallback: generateMockReportSummary(month, transactions, budgets, savingsGoals, currency)
      }, { status: 400 });
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return NextResponse.json({
        error: "Empty AI response.",
        fallback: generateMockReportSummary(month, transactions, budgets, savingsGoals, currency)
      }, { status: 500 });
    }

    return NextResponse.json({ content: generatedText, isMock: false });
  } catch (error: any) {
    console.error("API Report Route Error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

function generateMockReportSummary(
  month: string, 
  transactions: any[], 
  budgets: any[], 
  savingsGoals: any[], 
  currency: string
): string {
  const income = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const expenses = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netFlow = income - expenses;

  const categories: Record<string, number> = {};
  transactions.filter(t => t.type === "expense").forEach(t => {
    categories[t.category] = (categories[t.category] || 0) + Math.abs(t.amount);
  });

  let topCategory = "None";
  let topAmount = 0;
  Object.entries(categories).forEach(([cat, val]) => {
    if (val > topAmount) {
      topAmount = val;
      topCategory = cat;
    }
  });

  const savingRate = income > 0 ? (netFlow / income) * 100 : 0;
  const budgetAlerts = budgets.map(b => {
    const spent = categories[b.category] || 0;
    const pct = (spent / b.amount) * 100;
    return { category: b.category, pct, limit: b.amount, spent };
  }).filter(b => b.pct >= 80);

  return `### 📊 Executive Cash Flow
During **${month}**, your total income was **${currency}${income.toLocaleString(undefined, { minimumFractionDigits: 2 })}** against expenses of **${currency}${expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}**. This resulted in a **${netFlow >= 0 ? "surplus" : "deficit"}** of **${currency}${netFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}**. 
* Your **savings rate** is **${savingRate.toFixed(1)}%**, which is **${savingRate >= 20 ? "excellent" : "below the recommended 20% target"}**.
* Your single biggest spending category was **${topCategory}**, representing **${currency}${topAmount.toFixed(2)}** (${expenses > 0 ? ((topAmount / expenses) * 100).toFixed(0) : 0}% of all outflows).

### 🛡️ Budget Performance
You tracked budgets across **${budgets.length}** categories:
${budgetAlerts.length > 0 
  ? budgetAlerts.map(b => `* ⚠️ **${b.category}** is at **${b.pct.toFixed(0)}%** of limit (${currency}${b.spent.toFixed(0)} spent of ${currency}${b.limit.toFixed(0)}).`).join("\n")
  : "* 🎉 **Outstanding!** None of your budget categories exceeded 80% usage this month."
}

### 🎯 Savings Goals Analysis
You have **${savingsGoals.length}** active savings goal${savingsGoals.length !== 1 ? "s" : ""}:
${savingsGoals.map(g => {
  const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
  return `* **${g.name}**: **${pct.toFixed(0)}%** complete (${currency}${g.currentAmount.toLocaleString()} saved of ${currency}${g.targetAmount.toLocaleString()}).`;
}).join("\n")}

### 💡 Key Recommendations
1. **Optimize ${topCategory} Outlays**: As your highest expense category, reducing discretionary outflows in **${topCategory}** by **15%** next month will secure an extra **${currency}${(topAmount * 0.15).toFixed(0)}** in cash flow.
2. **Reallocate Surpluses**: Transfer **${currency}${(netFlow > 0 ? netFlow * 0.5 : 50).toFixed(0)}** of your net flow directly to your primary goal${savingsGoals.length > 0 ? ` (${savingsGoals[0].name})` : ""} to compound progress.
3. **Automate Goal Transfers**: Set up automatic savings transfers on paydays to hit target dates stress-free.`;
}
