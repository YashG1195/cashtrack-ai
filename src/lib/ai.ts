import { Transaction } from "@/repositories/transaction.repository";
import { Budget } from "@/repositories/budget.repository";
import { SavingsGoal } from "@/repositories/goal.repository";

export interface ChatMessage {
  role: "user" | "assistant";
  parts: string;
}

export interface AdvisorRequest {
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  message: string;
  history?: ChatMessage[];
  customApiKey?: string;
  currency?: string;
  selectedGoalId?: string;
}

export interface AdvisorResponse {
  content: string;
  isMock: boolean;
  error?: string;
  fallback?: string;
}

export async function askAIAdvisor(request: AdvisorRequest): Promise<AdvisorResponse> {
  try {
    const res = await fetch("/api/advisor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    });

    if (!res.ok) {
      const errorData = await res.json();
      return {
        content: errorData.fallback || "Sorry, I encountered an error communicating with the advisor. Please check your network or API keys.",
        isMock: true,
        error: errorData.error
      };
    }

    return await res.json();
  } catch (error: any) {
    console.error("Error calling AI Advisor:", error);
    return {
      content: "Sorry, I am unable to connect to the advisor right now. Please try again later.",
      isMock: true,
      error: error.message
    };
  }
}
