import { isFirebaseConfigured } from "@/lib/firebase";
import { GoalsService } from "@/services/firestore/goals.service";
import { Goal as DBGoal } from "@/models/types";

export interface SavingsGoal {
  id: string;
  userId?: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  color?: string;
  createdAt?: Date;
}

const LOCAL_STORAGE_KEY = "moneyflow_savings";

export class GoalRepository {
  private static initLocalStorageMock(): SavingsGoal[] {
    if (typeof window === "undefined") return [];

    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fall through to mock init
      }
    }

    const mockSavings: SavingsGoal[] = [
      { id: "s1", userId: "demo-user", name: "Emergency Fund", targetAmount: 10000, currentAmount: 4500, targetDate: "2026-12-31", color: "purple" },
      { id: "s2", userId: "demo-user", name: "New Laptop", targetAmount: 2500, currentAmount: 1200, targetDate: "2026-09-30", color: "green" },
    ];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockSavings));
    return mockSavings;
  }

  static async list(userId: string): Promise<SavingsGoal[]> {
    if (isFirebaseConfigured) {
      const dbList = await GoalsService.listByUser(userId);
      return dbList.map((dbG) => ({
        id: dbG.id,
        userId: dbG.userId,
        name: dbG.goalName, // map goalName to name
        targetAmount: dbG.targetAmount,
        currentAmount: dbG.currentAmount,
        targetDate: dbG.deadline, // map deadline to targetDate
        color: dbG.themeColor || "purple", // map themeColor to color
        createdAt: dbG.createdAt,
      }));
    }

    return this.initLocalStorageMock();
  }

  static async add(userId: string, goal: Omit<SavingsGoal, "id" | "userId" | "createdAt">): Promise<SavingsGoal> {
    if (isFirebaseConfigured) {
      const dbGoalInput: Omit<DBGoal, "id" | "createdAt"> = {
        userId,
        goalName: goal.name, // map name to goalName
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        deadline: goal.targetDate, // map targetDate to deadline
        themeColor: goal.color || "purple",
      };
      const created = await GoalsService.create(dbGoalInput);
      return {
        id: created.id,
        userId: created.userId,
        name: created.goalName,
        targetAmount: created.targetAmount,
        currentAmount: created.currentAmount,
        targetDate: created.deadline,
        color: created.themeColor || "purple",
        createdAt: created.createdAt,
      };
    }

    const localList = this.initLocalStorageMock();
    const newGoal: SavingsGoal = {
      ...goal,
      id: Math.random().toString(36).substring(2, 9),
      userId,
      color: goal.color || "purple",
      createdAt: new Date(),
    };
    localList.push(newGoal);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localList));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("local-goals-updated"));
    }
    return newGoal;
  }

  static async update(userId: string, id: string, updates: Partial<Omit<SavingsGoal, "id" | "userId" | "createdAt">>): Promise<void> {
    if (isFirebaseConfigured) {
      const dbUpdates: Partial<Omit<DBGoal, "id" | "userId" | "createdAt">> = {};
      if (updates.name !== undefined) dbUpdates.goalName = updates.name;
      if (updates.targetAmount !== undefined) dbUpdates.targetAmount = updates.targetAmount;
      if (updates.currentAmount !== undefined) dbUpdates.currentAmount = updates.currentAmount;
      if (updates.targetDate !== undefined) dbUpdates.deadline = updates.targetDate;
      if (updates.color !== undefined) dbUpdates.themeColor = updates.color;

      await GoalsService.update(id, dbUpdates);
      return;
    }

    const localList = this.initLocalStorageMock();
    const index = localList.findIndex((g) => g.id === id);
    if (index > -1) {
      localList[index] = { ...localList[index], ...updates };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localList));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("local-goals-updated"));
      }
    }
  }

  static async delete(userId: string, id: string): Promise<void> {
    if (isFirebaseConfigured) {
      await GoalsService.delete(id);
      return;
    }

    const localList = this.initLocalStorageMock();
    const filtered = localList.filter((g) => g.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("local-goals-updated"));
    }
  }

  static subscribe(
    userId: string,
    callback: (goals: SavingsGoal[]) => void,
    onError?: (error: any) => void
  ): () => void {
    if (isFirebaseConfigured) {
      return GoalsService.subscribeByUser(
        userId,
        (dbList) => {
          const mapped = dbList.map((dbG) => ({
            id: dbG.id,
            userId: dbG.userId,
            name: dbG.goalName,
            targetAmount: dbG.targetAmount,
            currentAmount: dbG.currentAmount,
            targetDate: dbG.deadline,
            color: dbG.themeColor || "purple",
            createdAt: dbG.createdAt,
          }));
          callback(mapped);
        },
        onError
      );
    }

    this.list(userId).then(callback);

    const handleStorageUpdate = () => {
      this.list(userId).then(callback);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageUpdate);
      window.addEventListener("local-goals-updated", handleStorageUpdate);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageUpdate);
        window.removeEventListener("local-goals-updated", handleStorageUpdate);
      }
    };
  }
}
