import { isFirebaseConfigured } from "@/lib/firebase";
import { AISummariesService, AISummary } from "@/services/firestore/aiSummaries.service";

const LOCAL_STORAGE_KEY = "moneyflow_ai_summaries";

export class AISummaryRepository {
  private static initLocalStorageMock(): AISummary[] {
    if (typeof window === "undefined") return [];

    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        }));
      } catch {
        // Fall through
      }
    }

    const mockSummary: AISummary[] = [
      { 
        id: "sum-1", 
        userId: "demo-user", 
        content: `### Weekly Financial Summary

* **Income vs Expense**: You saved **$2,779** this month. Your total monthly cash inflow is **$2,900** and total monthly cash outflow is **$121**.
* **Budget Warnings**: You do not have any budgets set up. Go to the Budgets page to set targets for Food, Shopping, and Utilities.
* **Goal Milestones**: Your progress on **Emergency Fund** is at **45%** and **New Laptop** is at **48%**.`, 
        createdAt: new Date() 
      }
    ];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockSummary));
    return mockSummary;
  }

  static async getLatest(userId: string): Promise<AISummary | null> {
    if (isFirebaseConfigured) {
      return await AISummariesService.getLatestByUser(userId);
    }
    const list = this.initLocalStorageMock();
    return list.length > 0 ? list[0] : null;
  }

  static async set(userId: string, content: string): Promise<AISummary> {
    if (isFirebaseConfigured) {
      return await AISummariesService.create(userId, content);
    }

    const localList = this.initLocalStorageMock();
    const newSummary: AISummary = {
      id: Math.random().toString(36).substring(2, 9),
      userId,
      content,
      createdAt: new Date()
    };
    localList.unshift(newSummary);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localList));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("local-ai-summaries-updated"));
    }
    return newSummary;
  }

  static async clear(userId: string): Promise<void> {
    if (isFirebaseConfigured) {
      await AISummariesService.clearAll(userId);
      return;
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("local-ai-summaries-updated"));
    }
  }

  static subscribe(
    userId: string,
    callback: (summary: AISummary | null) => void
  ): () => void {
    const handleUpdate = () => {
      this.getLatest(userId).then(callback);
    };

    handleUpdate();

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleUpdate);
      window.addEventListener("local-ai-summaries-updated", handleUpdate);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("local-ai-summaries-updated", handleUpdate);
      }
    };
  }
}
