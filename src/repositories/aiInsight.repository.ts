import { isFirebaseConfigured } from "@/lib/firebase";
import { AIInsightsService } from "@/services/firestore/aiInsights.service";
import { AIInsight } from "@/models/types";

const LOCAL_STORAGE_KEY = "moneyflow_ai_insights";

export class AIInsightRepository {
  private static initLocalStorageMock(): AIInsight[] {
    if (typeof window === "undefined") return [];

    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fall through to mock init
      }
    }

    const mockInsights: AIInsight[] = [
      {
        id: "insight-1",
        userId: "demo-user",
        content: "Based on your spending in Software category ($49.00), you are well within your monthly category limit of $100.00.",
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        id: "insight-2",
        userId: "demo-user",
        content: "Great job saving! You have contributed $4,500 towards your Emergency Fund goal ($10,000). Keep going to hit your target by 2026-12-31.",
        createdAt: new Date(Date.now() - 86400000),
      }
    ];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockInsights));
    return mockInsights;
  }

  static async list(userId: string): Promise<AIInsight[]> {
    if (isFirebaseConfigured) {
      return await AIInsightsService.listByUser(userId);
    }

    return this.initLocalStorageMock();
  }

  static subscribe(
    userId: string,
    callback: (insights: AIInsight[]) => void
  ): () => void {
    if (isFirebaseConfigured) {
      return AIInsightsService.subscribeByUser(userId, callback);
    }

    const handleUpdate = () => {
      this.list(userId).then(callback);
    };

    handleUpdate();

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleUpdate);
      window.addEventListener("local-ai-insights-updated", handleUpdate);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("local-ai-insights-updated", handleUpdate);
      }
    };
  }

  static async add(userId: string, content: string): Promise<AIInsight> {
    if (isFirebaseConfigured) {
      return await AIInsightsService.create({
        userId,
        content,
      });
    }

    const localList = this.initLocalStorageMock();
    const newInsight: AIInsight = {
      id: Math.random().toString(36).substring(2, 9),
      userId,
      content,
      createdAt: new Date(),
    };
    localList.unshift(newInsight);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localList));
    return newInsight;
  }

  static async delete(userId: string, id: string): Promise<void> {
    if (isFirebaseConfigured) {
      await AIInsightsService.delete(id);
      return;
    }

    const localList = this.initLocalStorageMock();
    const filtered = localList.filter((ins) => ins.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  }

  static async clear(userId: string): Promise<void> {
    if (isFirebaseConfigured) {
      await AIInsightsService.clearAll(userId);
      return;
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("local-ai-insights-updated"));
    }
  }
}
