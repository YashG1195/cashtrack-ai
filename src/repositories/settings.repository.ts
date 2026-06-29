import { isFirebaseConfigured } from "@/lib/firebase";
import { SettingsService, UserSettings } from "@/services/firestore/settings.service";
import { TransactionRepository } from "./transaction.repository";
import { BudgetRepository } from "./budget.repository";
import { GoalRepository } from "./goal.repository";

const LOCAL_STORAGE_KEY = "moneyflow_settings";

export class SettingsRepository {
  private static initLocalStorageMock(): UserSettings {
    if (typeof window === "undefined") return { currency: "$" };

    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fall through
      }
    }

    const mockSettings: UserSettings = { currency: "$" };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockSettings));
    return mockSettings;
  }

  static async get(userId: string): Promise<UserSettings> {
    if (isFirebaseConfigured) {
      const settings = await SettingsService.read(userId);
      return settings || { currency: "$" };
    }

    return this.initLocalStorageMock();
  }

  static async save(userId: string, settings: UserSettings): Promise<void> {
    if (isFirebaseConfigured) {
      await SettingsService.save(userId, settings);
      return;
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
  }

  static async clearAllData(userId: string): Promise<void> {
    if (isFirebaseConfigured) {
      try {
        // Clear transactions
        const txs = await TransactionRepository.list(userId);
        for (const t of txs) {
          await TransactionRepository.delete(userId, t.id);
        }

        // Clear budgets
        const budgets = await BudgetRepository.list(userId);
        for (const b of budgets) {
          await BudgetRepository.delete(userId, b.category);
        }

        // Clear goals
        const goals = await GoalRepository.list(userId);
        for (const g of goals) {
          await GoalRepository.delete(userId, g.id);
        }

        // Clear settings
        await SettingsService.delete(userId);
      } catch (e) {
        console.warn("Firestore error in clearAllData", e);
      }
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem("moneyflow_transactions");
      localStorage.removeItem("moneyflow_budgets");
      localStorage.removeItem("moneyflow_savings");
      localStorage.removeItem("moneyflow_settings");
      localStorage.removeItem("moneyflow_ai_insights");
    }
  }
}
export type { UserSettings };
