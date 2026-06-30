import { isFirebaseConfigured } from "@/lib/firebase";
import { AIRecommendationsService, AIRecommendation } from "@/services/firestore/aiRecommendations.service";

const LOCAL_STORAGE_KEY = "cashtrack_ai_recommendations";

export class AIRecommendationRepository {
  private static initLocalStorageMock(): AIRecommendation[] {
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

    const mockRecs: AIRecommendation[] = [
      { id: "r1", userId: "demo-user", type: "budget", content: "Reduce Food spending by 10%.", createdAt: new Date() },
      { id: "r2", userId: "demo-user", type: "savings", content: "Increase monthly savings by ₹2,000.", createdAt: new Date() },
      { id: "r3", userId: "demo-user", type: "alert", content: "Entertainment spending increased 35% compared to last month.", createdAt: new Date() },
    ];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockRecs));
    return mockRecs;
  }

  static async list(userId: string): Promise<AIRecommendation[]> {
    if (isFirebaseConfigured) {
      return await AIRecommendationsService.listByUser(userId);
    }
    return this.initLocalStorageMock();
  }

  static async add(userId: string, type: "budget" | "savings" | "alert", content: string): Promise<AIRecommendation> {
    if (isFirebaseConfigured) {
      return await AIRecommendationsService.create(userId, { type, content });
    }

    const localList = this.initLocalStorageMock();
    const newRec: AIRecommendation = {
      id: Math.random().toString(36).substring(2, 9),
      userId,
      type,
      content,
      createdAt: new Date()
    };
    localList.unshift(newRec);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localList));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("local-ai-recommendations-updated"));
    }
    return newRec;
  }

  static async clear(userId: string): Promise<void> {
    if (isFirebaseConfigured) {
      await AIRecommendationsService.clearAll(userId);
      return;
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("local-ai-recommendations-updated"));
    }
  }

  static subscribe(
    userId: string,
    callback: (recs: AIRecommendation[]) => void
  ): () => void {
    const handleUpdate = () => {
      this.list(userId).then(callback);
    };

    handleUpdate();

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleUpdate);
      window.addEventListener("local-ai-recommendations-updated", handleUpdate);
      // We can also poll or listen in background. Since this changes on explicit refresh button click, it's very safe to rely on event triggers!
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("local-ai-recommendations-updated", handleUpdate);
      }
    };
  }
}
