import { isFirebaseConfigured } from "@/lib/firebase";
import { UsersService } from "@/services/firestore/users.service";
import { User } from "@/models/types";

const LOCAL_STORAGE_KEY = "moneyflow_user";

export class UserRepository {
  private static getDemoUser(): User {
    return {
      uid: "demo-user",
      name: "Demo User",
      email: "demo@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static async get(uid: string): Promise<User | null> {
    if (isFirebaseConfigured) {
      return await UsersService.read(uid);
    }

    if (typeof window === "undefined") return null;
    const dataStr = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (dataStr) {
      try {
        const parsed = JSON.parse(dataStr);
        return {
          ...parsed,
          createdAt: new Date(parsed.createdAt),
          updatedAt: new Date(parsed.updatedAt),
        };
      } catch {
        return this.getDemoUser();
      }
    }
    return this.getDemoUser();
  }

  static async createOrUpdate(user: Omit<User, "createdAt" | "updatedAt">): Promise<User> {
    if (isFirebaseConfigured) {
      const existing = await UsersService.read(user.uid);
      if (existing) {
        const updates: any = {
          displayName: user.displayName || user.name || "",
          name: user.displayName || user.name || "",
          email: user.email,
          photoURL: user.photoURL || "",
        };
        if (user.theme) updates.theme = user.theme;
        if (user.accentColor) updates.accentColor = user.accentColor;
        if (user.currency) updates.currency = user.currency;
        if (user.notificationSettings) updates.notificationSettings = user.notificationSettings;

        await UsersService.update(user.uid, updates);
        return {
          ...existing,
          ...updates,
          updatedAt: new Date(),
        };
      } else {
        return await UsersService.create(user);
      }
    }

    if (typeof window === "undefined") return this.getDemoUser();
    const now = new Date();
    const updatedUser: User = {
      ...user,
      displayName: user.displayName || user.name || "",
      createdAt: now,
      updatedAt: now,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  }

  static async delete(uid: string): Promise<void> {
    if (isFirebaseConfigured) {
      await UsersService.delete(uid);
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }
}
