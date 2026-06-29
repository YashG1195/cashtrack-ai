import { isFirebaseConfigured } from "@/lib/firebase";
import { AIChatsService, AIChatMessage } from "@/services/firestore/aiChats.service";

const LOCAL_STORAGE_KEY = "moneyflow_ai_chats";

export class AIChatRepository {
  private static initLocalStorageMock(): AIChatMessage[] {
    if (typeof window === "undefined") return [];

    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
      } catch {
        // Fall through
      }
    }

    const defaultWelcome: AIChatMessage[] = [
      { 
        userId: "demo-user",
        role: "assistant", 
        message: "### Welcome to your MoneyFlow AI Advisor!\n\nI have access to your budgets, saving goals, and transaction log context.\n\nAsk me anything, or try one of the suggestions below:",
        timestamp: new Date()
      }
    ];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultWelcome));
    return defaultWelcome;
  }

  static async add(userId: string, role: "user" | "assistant", text: string): Promise<AIChatMessage> {
    if (isFirebaseConfigured) {
      return await AIChatsService.add(userId, { role, message: text });
    }

    const localList = this.initLocalStorageMock();
    const newMsg: AIChatMessage = {
      userId,
      role,
      message: text,
      timestamp: new Date()
    };
    localList.push(newMsg);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localList));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("local-ai-chats-updated"));
    }
    return newMsg;
  }

  static async clear(userId: string): Promise<void> {
    if (isFirebaseConfigured) {
      await AIChatsService.clearAll(userId);
      return;
    }

    const defaultWelcome: AIChatMessage[] = [
      { 
        userId: "demo-user",
        role: "assistant", 
        message: "### Welcome to your MoneyFlow AI Advisor!\n\nI have access to your budgets, saving goals, and transaction log context.\n\nAsk me anything, or try one of the suggestions below:",
        timestamp: new Date()
      }
    ];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultWelcome));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("local-ai-chats-updated"));
    }
  }

  static subscribe(
    userId: string,
    callback: (messages: AIChatMessage[]) => void,
    onError?: (error: any) => void
  ): () => void {
    if (isFirebaseConfigured) {
      return AIChatsService.subscribeByUser(userId, callback, onError);
    }

    const handleStorageUpdate = () => {
      const list = this.initLocalStorageMock();
      callback(list);
    };

    setTimeout(handleStorageUpdate, 0);

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageUpdate);
      window.addEventListener("local-ai-chats-updated", handleStorageUpdate);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageUpdate);
        window.removeEventListener("local-ai-chats-updated", handleStorageUpdate);
      }
    };
  }
}
