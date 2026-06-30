import { isFirebaseConfigured } from "@/lib/firebase";
import { BudgetsService } from "@/services/firestore/budgets.service";
import { Budget as DBBudget } from "@/models/types";

export interface Budget {
  id?: string;
  userId?: string;
  category: string;
  amount: number;
  period: string; // e.g. "monthly"
  month?: string; // YYYY-MM
  createdAt?: Date;
}

const LOCAL_STORAGE_KEY = "cashtrack_budgets";

export class BudgetRepository {
  private static initLocalStorageMock(): Budget[] {
    if (typeof window === "undefined") return [];

    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fall through to mock init
      }
    }

    const mockBudgets: Budget[] = [
      { category: "Software", amount: 100, period: "monthly" },
      { category: "Groceries", amount: 500, period: "monthly" },
      { category: "Travel", amount: 1000, period: "monthly" },
      { category: "Dining Out", amount: 200, period: "monthly" },
    ];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockBudgets));
    return mockBudgets;
  }

  private static getCurrentMonthString(): string {
    return new Date().toISOString().slice(0, 7); // "YYYY-MM"
  }

  static async list(userId: string): Promise<Budget[]> {
    if (isFirebaseConfigured) {
      const dbList = await BudgetsService.listByUser(userId);
      return dbList.map((dbB) => ({
        id: dbB.id,
        userId: dbB.userId,
        category: dbB.category,
        amount: dbB.limitAmount, // map limitAmount to amount
        period: "monthly",
        month: dbB.month,
        createdAt: dbB.createdAt,
      }));
    }

    return this.initLocalStorageMock();
  }

  static async save(userId: string, budget: Omit<Budget, "userId">): Promise<Budget> {
    const month = budget.month || this.getCurrentMonthString();
    
    if (isFirebaseConfigured) {
      const dbBudgetInput: Omit<DBBudget, "id" | "createdAt"> = {
        userId,
        category: budget.category,
        limitAmount: budget.amount, // map amount to limitAmount
        month,
      };
      const saved = await BudgetsService.create(dbBudgetInput);
      return {
        id: saved.id,
        userId: saved.userId,
        category: saved.category,
        amount: saved.limitAmount,
        period: "monthly",
        month: saved.month,
        createdAt: saved.createdAt,
      };
    }

    const localList = this.initLocalStorageMock();
    const existingIndex = localList.findIndex((b) => b.category.toLowerCase() === budget.category.toLowerCase());
    const newBudget: Budget = {
      ...budget,
      userId,
      period: "monthly",
      month,
      createdAt: new Date(),
    };
    if (existingIndex > -1) {
      localList[existingIndex] = newBudget;
    } else {
      localList.push(newBudget);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localList));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("local-budgets-updated"));
    }
    return newBudget;
  }

  static async delete(userId: string, category: string): Promise<void> {
    if (isFirebaseConfigured) {
      const month = this.getCurrentMonthString();
      const docId = `${userId}_${category}_${month}`.replace(/\s+/g, "_");
      await BudgetsService.delete(docId);
      return;
    }

    const localList = this.initLocalStorageMock();
    const filtered = localList.filter((b) => b.category.toLowerCase() !== category.toLowerCase());
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("local-budgets-updated"));
    }
  }

  static subscribe(
    userId: string,
    callback: (budgets: Budget[]) => void,
    onError?: (error: any) => void
  ): () => void {
    if (isFirebaseConfigured) {
      return BudgetsService.subscribeByUser(
        userId,
        (dbList) => {
          const mapped = dbList.map((dbB) => ({
            id: dbB.id,
            userId: dbB.userId,
            category: dbB.category,
            amount: dbB.limitAmount,
            period: "monthly",
            month: dbB.month,
            createdAt: dbB.createdAt,
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
      window.addEventListener("local-budgets-updated", handleStorageUpdate);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageUpdate);
        window.removeEventListener("local-budgets-updated", handleStorageUpdate);
      }
    };
  }
}
