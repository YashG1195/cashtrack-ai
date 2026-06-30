import { isFirebaseConfigured } from "@/lib/firebase";
import { NotificationsService } from "@/services/firestore/notifications.service";
import { Notification as DBNotification } from "@/models/types";

export interface AppNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: "budget" | "savings" | "ai" | "system";
  isRead: boolean;
  createdAt: Date;
}

const LOCAL_STORAGE_KEY = "cashtrack_notifications";

export class NotificationRepository {
  private static initLocalStorageMock(userId: string): AppNotification[] {
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

    const mockNotifications: AppNotification[] = [
      {
        id: "n1",
        userId,
        title: "Budget Alert",
        message: "Your Food budget is 80% used ($400 of $500 limit).",
        type: "budget",
        isRead: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
      },
      {
        id: "n2",
        userId,
        title: "Savings Goal Reminder",
        message: "Goal contribution overdue for your Bike goal. Keep saving!",
        type: "savings",
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: "n3",
        userId,
        title: "AI Analysis Complete",
        message: "New financial habit recommendation available. Spending has increased by 15% in Shopping.",
        type: "ai",
        isRead: false,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        id: "n4",
        userId,
        title: "Welcome to Cashtrack AI",
        message: "Your personal financial dashboard is set up. Let's optimize your wealth!",
        type: "system",
        isRead: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
    ];

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockNotifications));
    return mockNotifications;
  }

  static async list(userId: string): Promise<AppNotification[]> {
    if (isFirebaseConfigured) {
      const dbList = await NotificationsService.listByUser(userId);
      return dbList.map((dbN) => ({
        id: dbN.id,
        userId: dbN.userId,
        title: dbN.title,
        message: dbN.message,
        type: dbN.type,
        isRead: dbN.isRead,
        createdAt: dbN.createdAt,
      }));
    }

    return this.initLocalStorageMock(userId);
  }

  static async add(
    userId: string, 
    notification: Omit<AppNotification, "id" | "userId" | "createdAt" | "isRead">
  ): Promise<AppNotification> {
    if (isFirebaseConfigured) {
      const dbInput: Omit<DBNotification, "id" | "createdAt"> = {
        userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: false,
      };
      const created = await NotificationsService.create(dbInput);
      return {
        id: created.id,
        userId: created.userId,
        title: created.title,
        message: created.message,
        type: created.type,
        isRead: created.isRead,
        createdAt: created.createdAt,
      };
    }

    const localList = this.initLocalStorageMock(userId);
    const newNotification: AppNotification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 9),
      userId,
      isRead: false,
      createdAt: new Date(),
    };
    localList.unshift(newNotification);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localList));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("local-notifications-updated"));
    }
    return newNotification;
  }

  static async updateReadStatus(userId: string, id: string, isRead: boolean): Promise<void> {
    if (isFirebaseConfigured) {
      await NotificationsService.update(id, { isRead });
      return;
    }

    const localList = this.initLocalStorageMock(userId);
    const index = localList.findIndex((n) => n.id === id);
    if (index > -1) {
      localList[index].isRead = isRead;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localList));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("local-notifications-updated"));
      }
    }
  }

  static async delete(userId: string, id: string): Promise<void> {
    if (isFirebaseConfigured) {
      await NotificationsService.delete(id);
      return;
    }

    const localList = this.initLocalStorageMock(userId);
    const filtered = localList.filter((n) => n.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("local-notifications-updated"));
    }
  }

  static async markAllRead(userId: string): Promise<void> {
    if (isFirebaseConfigured) {
      await NotificationsService.markAllAsRead(userId);
      return;
    }

    const localList = this.initLocalStorageMock(userId);
    localList.forEach((n) => {
      n.isRead = true;
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localList));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("local-notifications-updated"));
    }
  }

  static subscribe(
    userId: string,
    callback: (notifications: AppNotification[]) => void,
    onError?: (error: any) => void
  ): () => void {
    if (isFirebaseConfigured) {
      return NotificationsService.subscribeByUser(
        userId,
        (dbList) => {
          const mapped = dbList.map((dbN) => ({
            id: dbN.id,
            userId: dbN.userId,
            title: dbN.title,
            message: dbN.message,
            type: dbN.type,
            isRead: dbN.isRead,
            createdAt: dbN.createdAt,
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
      window.addEventListener("local-notifications-updated", handleStorageUpdate);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageUpdate);
        window.removeEventListener("local-notifications-updated", handleStorageUpdate);
      }
    };
  }
}
