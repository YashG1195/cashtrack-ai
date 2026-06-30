import { isFirebaseConfigured } from "@/lib/firebase";
import { GoalContributionsService } from "@/services/firestore/goal-contributions.service";
import { GoalContribution } from "@/models/types";
export type { GoalContribution };

const LOCAL_STORAGE_KEY = "cashtrack_goal_contributions";

export class GoalContributionRepository {
  private static initLocalStorageMock(): GoalContribution[] {
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

    const mockContribs: GoalContribution[] = [
      { id: "c1", goalId: "s1", userId: "demo-user", amount: 1500, note: "Initial savings", createdAt: new Date(Date.now() - 10 * 86400000) },
      { id: "c2", goalId: "s1", userId: "demo-user", amount: 3000, note: "June savings", createdAt: new Date(Date.now() - 2 * 86400000) },
      { id: "c3", goalId: "s2", userId: "demo-user", amount: 1200, note: "Laptop fund start", createdAt: new Date(Date.now() - 5 * 86400000) },
    ];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockContribs));
    return mockContribs;
  }

  static async list(userId: string): Promise<GoalContribution[]> {
    if (isFirebaseConfigured) {
      // Typically we use subscription, but fallback just in case
      return new Promise((resolve) => {
        const unsubscribe = GoalContributionsService.subscribeByUser(
          userId,
          (list) => {
            unsubscribe();
            resolve(list);
          },
          () => {
            resolve([]);
          }
        );
      });
    }

    return this.initLocalStorageMock();
  }

  static async add(userId: string, contrib: Omit<GoalContribution, "id" | "userId" | "createdAt">): Promise<GoalContribution> {
    if (isFirebaseConfigured) {
      const created = await GoalContributionsService.create({
        goalId: contrib.goalId,
        userId,
        amount: contrib.amount,
        note: contrib.note || "",
      });
      return created;
    }

    const localList = this.initLocalStorageMock();
    const newContrib: GoalContribution = {
      ...contrib,
      id: Math.random().toString(36).substring(2, 9),
      userId,
      createdAt: new Date(),
    };
    localList.push(newContrib);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localList));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("local-goal-contributions-updated"));
    }
    return newContrib;
  }

  static subscribe(
    userId: string,
    callback: (contribs: GoalContribution[]) => void,
    onError?: (error: any) => void
  ): () => void {
    if (isFirebaseConfigured) {
      return GoalContributionsService.subscribeByUser(
        userId,
        (dbList) => {
          const sorted = [...dbList].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          callback(sorted);
        },
        onError
      );
    }

    const handleStorageUpdate = () => {
      const list = this.initLocalStorageMock();
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      callback(list);
    };

    // Trigger initial load
    setTimeout(handleStorageUpdate, 0);

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageUpdate);
      window.addEventListener("local-goal-contributions-updated", handleStorageUpdate);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageUpdate);
        window.removeEventListener("local-goal-contributions-updated", handleStorageUpdate);
      }
    };
  }
}
