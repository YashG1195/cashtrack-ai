import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

const COLLECTION_NAME = "users";

export interface UserSettings {
  currency: string;
  theme?: "dark" | "light" | "system";
  accentColor?: "purple" | "blue" | "green" | "orange" | "pink";
  notificationPrefs?: {
    budgetAlerts: boolean;
    goalAlerts: boolean;
    aiInsights: boolean;
    monthlyReports: boolean;
  };
  geminiApiKey?: string;
  enableNotifications?: boolean;
  reportsEmailFrequency?: "none" | "daily" | "weekly" | "monthly";
  defaultExportFormat?: "pdf" | "xlsx" | "csv";
}

export class SettingsService {
  static async read(userId: string): Promise<UserSettings | null> {
    if (!db) throw new Error("Firestore is not initialized");

    const docRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      currency: data.currency || "USD",
      theme: data.theme || "dark",
      accentColor: data.accentColor || "purple",
      notificationPrefs: data.notificationSettings || data.notificationPrefs || {
        budgetAlerts: true,
        goalAlerts: true,
        aiInsights: true,
        monthlyReports: true,
      }
    } as UserSettings;
  }

  static async save(userId: string, settings: UserSettings): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized");

    const docRef = doc(db, COLLECTION_NAME, userId);
    const data: any = {
      theme: settings.theme,
      accentColor: settings.accentColor,
      currency: settings.currency,
      updatedAt: new Date()
    };
    if (settings.notificationPrefs) {
      data.notificationSettings = settings.notificationPrefs;
    }
    await setDoc(docRef, data, { merge: true });
  }

  static async delete(userId: string): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized");

    const docRef = doc(db, COLLECTION_NAME, userId);
    await setDoc(docRef, {
      theme: "dark",
      accentColor: "purple",
      currency: "USD",
      notificationSettings: {
        budgetAlerts: true,
        goalAlerts: true,
        aiInsights: true,
        monthlyReports: true,
      },
      updatedAt: new Date()
    }, { merge: true });
  }
}
