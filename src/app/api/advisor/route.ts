import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactions, budgets, savingsGoals, message, history = [], customApiKey, currency = "$", selectedGoalId } = body;

    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    // Check if we have an API Key. If not, generate a mock intelligent recommendation
    if (!apiKey || apiKey.trim() === "") {
      return NextResponse.json({
        content: generateMockAdvice(message, transactions, budgets, savingsGoals, currency, selectedGoalId),
        isMock: true
      });
    }

    // Goal selection logic
    let targetGoal: any = null;
    if (savingsGoals && savingsGoals.length > 0) {
      if (selectedGoalId && selectedGoalId !== "closest") {
        targetGoal = savingsGoals.find((g: any) => g.id === selectedGoalId || g.name === selectedGoalId);
      }
      if (!targetGoal) {
        const incompleteGoals = savingsGoals
          .map((g: any) => ({
            ...g,
            pct: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0
          }))
          .filter((g: any) => g.pct < 100);
        
        if (incompleteGoals.length > 0) {
          targetGoal = incompleteGoals.sort((a: any, b: any) => b.pct - a.pct)[0];
        } else {
          targetGoal = savingsGoals[0];
        }
      }
    }

    // Validation Logging
    if (targetGoal) {
      console.log(`[AI Advisor Context] goalId: ${targetGoal.id}, goalName: ${targetGoal.name}, targetAmount: ${targetGoal.targetAmount}, currentAmount: ${targetGoal.currentAmount}`);
    } else {
      console.log("[AI Advisor Context] No savings goals found.");
    }

    const targetGoalInfo = targetGoal ? `
Focus Savings Goal under analysis:
- Goal ID: ${targetGoal.id}
- Goal Name: ${targetGoal.name}
- Target Amount: ${currency}${targetGoal.targetAmount}
- Saved Amount: ${currency}${targetGoal.currentAmount}
- Remaining Amount: ${currency}${targetGoal.targetAmount - targetGoal.currentAmount}
- Progress Percentage: ${((targetGoal.currentAmount / targetGoal.targetAmount) * 100).toFixed(2)}%
- Target Date: ${targetGoal.targetDate}
` : "No focus savings goal configured.";

    // Prepare system instructions and financial context
    const profileContext = `
You are Cashtrack AI, a premium, highly intelligent personal finance advisor.
You are helping the user manage their money flow, establish smart budgets, track saving targets, and improve their financial health.

The user's current financial profile is:
- Preferred Currency: ${currency}
- Total Transactions: ${transactions.length}
- Current Transactions: ${JSON.stringify(transactions.slice(0, 15))}
- Current Budgets: ${JSON.stringify(budgets)}
- All Savings Goals: ${JSON.stringify(savingsGoals)}

${targetGoalInfo}

Guidelines for Savings Goal Analysis:
1. When discussing savings goals or savings advice, analyze and refer to the Focus Savings Goal: "${targetGoal?.name || ""}" with its exact attributes (Target: ${currency}${targetGoal?.targetAmount || 0}, Saved: ${currency}${targetGoal?.currentAmount || 0}, Remaining: ${currency}${(targetGoal?.targetAmount || 0) - (targetGoal?.currentAmount || 0)}, Progress: ${(((targetGoal?.currentAmount || 0) / (targetGoal?.targetAmount || 1)) * 100).toFixed(2)}%, Target Date: ${targetGoal?.targetDate || ""}).
2. Do NOT mention or analyze any other example or hypothetical goals (like Laptop or emergency fund) unless they exist in the user's actual Savings Goals.
3. Be direct, professional, encouraging, and highly analytical.
4. Suggest concrete actions, such as shifting money, adjusting budget thresholds, or reducing specific categories.
5. Keep the response clean and format it with markdown (bullet points, bold text).
6. Do not make up transactions that do not exist.
`;

    // Format contents for Gemini API (user prompts and chatbot history)
    const contents: any[] = [];
    
    // Add history
    history.forEach((h: any) => {
      contents.push({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.parts }]
      });
    });

    // Add current message with context injected
    contents.push({
      role: "user",
      parts: [{ text: `${profileContext}\n\nUser Question: ${message}` }]
    });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ contents })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error Response:", errorText);
      return NextResponse.json({ 
        error: "Failed to connect to Gemini API. Check your API key.",
        fallback: generateMockAdvice(message, transactions, budgets, savingsGoals, currency, selectedGoalId)
      }, { status: 400 });
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return NextResponse.json({
        error: "Empty response from Gemini API.",
        fallback: generateMockAdvice(message, transactions, budgets, savingsGoals, currency, selectedGoalId)
      }, { status: 500 });
    }

    return NextResponse.json({ content: generatedText, isMock: false });
  } catch (error: any) {
    console.error("API Advisor Route Error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

// Function to generate high-quality mock financial advice based on actual data
function generateMockAdvice(
  message: string, 
  transactions: any[], 
  budgets: any[], 
  savingsGoals: any[],
  currency: string,
  selectedGoalId?: string
): string {
  const query = message.toLowerCase();

  // Helper calculations
  const income = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const expenses = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netFlow = income - expenses;
  
  // Categorize expenses
  const categories: Record<string, number> = {};
  transactions.filter(t => t.type === "expense").forEach(t => {
    categories[t.category] = (categories[t.category] || 0) + Math.abs(t.amount);
  });

  // Check top expense category
  let topCategory = "None";
  let topAmount = 0;
  Object.entries(categories).forEach(([cat, val]) => {
    if (val > topAmount) {
      topAmount = val;
      topCategory = cat;
    }
  });

  if (query.includes("analyze") || query.includes("spending") || query.includes("transactions")) {
    return `### 📊 Expense & Spending Analysis

I have completed a review of your current transaction profile. Here is what stands out:

* **Cash Flow Check**: You have received **${currency}${income.toFixed(2)}** in income and spent **${currency}${expenses.toFixed(2)}** on expenses, resulting in a net savings of **${currency}${netFlow.toFixed(2)}** this period.
* **Top Expense Area**: Your largest spending category is **${topCategory}**, totaling **${currency}${topAmount.toFixed(2)}**. This is about **${((topAmount / (expenses || 1)) * 100).toFixed(0)}%** of your total expenses.
* **Budget Tracking**: You have **${budgets.length}** categories with set budgets.
  ${budgets.map(b => {
    const spent = categories[b.category] || 0;
    const pct = (spent / b.amount) * 100;
    return `  - **${b.category}**: ${currency}${spent.toFixed(0)} spent of ${currency}${b.amount.toFixed(0)} budget (${pct.toFixed(0)}% used)`;
  }).join("\n")}

**💡 Actionable Advice:**
Consider setting a tighter budget on your **${topCategory}** spending. Shifting just **10%** of that category's budget into savings could free up **${currency}${(topAmount * 0.1).toFixed(2)}** per month.`;
  }

  if (query.includes("save") || query.includes("saving") || query.includes("goals") || query.includes("goal")) {
    if (savingsGoals.length === 0) {
      return `### 🎯 Savings Recommendations

You currently do not have any Savings Goals configured. Setting targets is one of the most effective ways to build wealth.

**💡 Next Steps:**
1. Navigate to the **Savings Goals** tab.
2. Click **Create Goal** and add an **Emergency Fund** target of 3-6 months of basic living expenses.
3. Create a secondary goal like a **Vacation Fund** or **Major purchase**.`;
    }

    // Goal selection logic for mock generator
    let targetGoal = null;
    if (selectedGoalId && selectedGoalId !== "closest") {
      targetGoal = savingsGoals.find((g: any) => g.id === selectedGoalId || g.name === selectedGoalId);
    }
    if (!targetGoal) {
      const incompleteGoals = savingsGoals
        .map((g: any) => ({
          ...g,
          pct: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0
        }))
        .filter((g: any) => g.pct < 100);
      
      if (incompleteGoals.length > 0) {
        targetGoal = incompleteGoals.sort((a: any, b: any) => b.pct - a.pct)[0];
      } else {
        targetGoal = savingsGoals[0];
      }
    }

    const pct = (targetGoal.currentAmount / targetGoal.targetAmount) * 100;
    const remaining = targetGoal.targetAmount - targetGoal.currentAmount;

    return `### 🎯 Savings & Goal Progress Analysis

Let's check your progress towards your savings goals:

* **Primary Goal**: You are tracking **${targetGoal.name}**.
* **Progress**: You have saved **${currency}${targetGoal.currentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}** out of **${currency}${targetGoal.targetAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}** (**${pct.toFixed(2)}%** complete).
* **Deficit**: You need **${currency}${remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}** more to hit your target by **${targetGoal.targetDate}**.

**💡 Actionable Savings Strategy:**
* Based on your net cash flow of **${currency}${netFlow.toFixed(2)}**, you have the potential to boost your contributions.
* Setting up an **automatic transfer** of **${currency}${(netFlow * 0.25).toFixed(0)}** monthly into your **${targetGoal.name}** account would help you hit your goal ahead of schedule!`;
  }

  if (query.includes("budget") || query.includes("limit")) {
    return `### 🛡️ Budget Optimization Plan

Monitoring category thresholds helps stop accidental overspending before it occurs.

* **Top Budget Warning**:
  ${budgets.length > 0 
    ? `Your budget for **${budgets[0].category}** is set to **${currency}${budgets[0].amount}**. Make sure your recurring transactions do not exceed this.`
    : "You do not have any budgets set up. Go to the Budgets page to set targets for Food, Shopping, and Utilities."
  }
* **Suggested Adjustment**: We noticed you spend money on various categories. Try to keep discretionary items (Dining, Subscriptions) under **30%** of your total monthly income.

**💡 Actionable Suggestion:**
We recommend reviewing your active subscriptions. Deactivating even one unused utility could save you up to **${currency}150** annually!`;
  }

  // General fallback greeting response
  return `### 👋 Hello! I am your Cashtrack AI Advisor.

I can help you analyze your financial health, give budgeting advice, and optimize your savings goals.

Here are a few quick stats from your profile:
* **Current Balance**: **${currency}${netFlow.toFixed(2)}** (Income - Expenses)
* **Categories Tracked**: **${Object.keys(categories).length}** expense categories
* **Active Savings Goals**: **${savingsGoals.length}** goals

**Try asking me:**
1. *"Analyze my spending habits"*
2. *"How am I doing on my savings goals?"*
3. *"Give me recommendations to optimize my monthly budget"*

*(Note: Provide a Gemini API key in Settings to unlock fully generalized AI-driven chat insights!)*`;
}
