import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactions, budgets, savingsGoals, currency = "$" } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    // Fallback Mock data if Gemini API Key is missing
    if (!apiKey || apiKey.trim() === "") {
      return NextResponse.json(generateMockDashboardAI(transactions, budgets, savingsGoals, currency));
    }

    // Goal selection logic (closest to completion)
    let targetGoal: any = null;
    if (savingsGoals && savingsGoals.length > 0) {
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

    // Prepare system instructions and financial context to ask Gemini for a structured JSON response
    const profileContext = `
You are MoneyFlow AI, a premium, highly intelligent personal finance analyzer.
Analyze the user's current monthly financial profile:
- Preferred Currency: ${currency}
- Transactions (last 30): ${JSON.stringify(transactions.slice(0, 30))}
- Budgets: ${JSON.stringify(budgets)}
- All Savings Goals: ${JSON.stringify(savingsGoals)}

${targetGoalInfo}

Provide a response strictly in JSON format. The JSON must contain exactly these three keys:
1. "weeklySummary": A markdown string containing a "Weekly Financial Summary" that highlights:
   - Income vs Expense trend (how much saved this month, balance status).
   - Budget warnings (which category budgets are near limits or exceeded).
   - Savings goal progress (status updates for milestones, specifically focusing on the Focus Savings Goal).
2. "insights": An array of exactly 3 strings representing automated financial observations (e.g. including details of the Focus Savings Goal progress).
3. "recommendations": An array of exactly 3 objects, each containing:
   - "type": "budget", "savings", or "alert"
   - "content": A concrete recommendation or alert. Examples:
     - { "type": "budget", "content": "Reduce Food spending by 10%." }
     - { "type": "savings", "content": "Increase monthly savings by ${currency}2,000." }
     - { "type": "alert", "content": "Entertainment spending increased 35% compared to last month." }

Guidelines:
1. When summarizing savings goal progress or giving savings recommendations/insights in the JSON keys, focus on the Focus Savings Goal: "${targetGoal?.name || ""}" with its exact attributes (Target: ${currency}${targetGoal?.targetAmount || 0}, Saved: ${currency}${targetGoal?.currentAmount || 0}, Remaining: ${currency}${(targetGoal?.targetAmount || 0) - (targetGoal?.currentAmount || 0)}, Progress: ${(((targetGoal?.currentAmount || 0) / (targetGoal?.targetAmount || 1)) * 100).toFixed(2)}%, Target Date: ${targetGoal?.targetDate || ""}).
2. Do NOT mention or analyze any other example or hypothetical goals (like Laptop or emergency fund) unless they exist in the user's actual Savings Goals.

Return ONLY the raw JSON object. Do not include markdown code block syntax (like \`\`\`json) or any wrapper text.
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
            parts: [{ text: profileContext }]
          }
        ]
      })
    });

    if (!response.ok) {
      console.warn("Gemini dashboard call failed. Using mock fallback.");
      return NextResponse.json(generateMockDashboardAI(transactions, budgets, savingsGoals, currency));
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json(generateMockDashboardAI(transactions, budgets, savingsGoals, currency));
    }

    // Clean markdown code blocks if Gemini returned them
    text = text.trim();
    if (text.startsWith("```json")) {
      text = text.substring(7);
    }
    if (text.endsWith("```")) {
      text = text.substring(0, text.length - 3);
    }
    text = text.trim();

    try {
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON output:", text);
      return NextResponse.json(generateMockDashboardAI(transactions, budgets, savingsGoals, currency));
    }
  } catch (error: any) {
    console.error("API Advisor Dashboard Route Error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

function generateMockDashboardAI(transactions: any[], budgets: any[], savingsGoals: any[], currency: string) {
  const income = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const expenses = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netFlow = income - expenses;
  
  const categories: Record<string, number> = {};
  transactions.filter(t => t.type === "expense").forEach(t => {
    categories[t.category] = (categories[t.category] || 0) + Math.abs(t.amount);
  });

  let topCategory = "Food";
  let topAmount = 0;
  Object.entries(categories).forEach(([cat, val]) => {
    if (val > topAmount) {
      topAmount = val;
      topCategory = cat;
    }
  });

  const foodPct = expenses > 0 ? ((categories["Food"] || 0) / expenses) * 100 : 0;
  const foodText = foodPct > 0 
    ? `You spent ${foodPct.toFixed(0)}% of your expenses on Food this month.` 
    : `You spent ${currency}${topAmount.toFixed(0)} on ${topCategory} this month.`;

  const budgetWarning = budgets.length > 0 
    ? `Your ${budgets[0].category} budget is set to ${currency}${budgets[0].amount.toFixed(0)}.`
    : "No category budgets configured yet.";

  // Goal selection logic for mock generator
  let targetGoal: any = null;
  if (savingsGoals && savingsGoals.length > 0) {
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

  const goalText = targetGoal
    ? `You're on track to reach your ${targetGoal.name} goal.`
    : "Create a savings goal to start tracking target milestones.";

  const targetGoalPct = targetGoal && targetGoal.targetAmount > 0 
    ? ((targetGoal.currentAmount / targetGoal.targetAmount) * 100).toFixed(0)
    : "0";

  return {
    weeklySummary: `### Weekly Financial Summary

* **Income vs Expense**: You saved **${currency}${netFlow.toLocaleString()}** this month. Your total monthly cash inflow is **${currency}${income.toLocaleString()}** and total monthly cash outflow is **${currency}${expenses.toLocaleString()}**.
* **Budget Warnings**: ${budgets.length > 0 ? `Verify limits on **${budgets[0].category}**.` : "Create a budget to track limits."}
* **Goal Milestones**: ${targetGoal ? `Your progress on **${targetGoal.name}** is at **${targetGoalPct}%**.` : "No active savings goals."}
    `,
    insights: [
      foodText,
      budgetWarning,
      goalText
    ],
    recommendations: [
      { type: "budget", content: `Reduce ${topCategory} spending by 10%.` },
      { type: "savings", content: targetGoal ? `Increase savings towards ${targetGoal.name} by ${currency}2,000.` : `Increase monthly savings by ${currency}2,000.` },
      { type: "alert", content: `${topCategory} is your largest expense category at ${currency}${topAmount.toLocaleString()}.` }
    ]
  };
}
