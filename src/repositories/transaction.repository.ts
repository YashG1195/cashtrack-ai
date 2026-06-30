import { isFirebaseConfigured } from "@/lib/firebase";
import { TransactionsService } from "@/services/firestore/transactions.service";
import { Transaction as DBTransaction } from "@/models/types";

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string; // YYYY-MM-DD
  merchant: string;
  note?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const LOCAL_STORAGE_KEY = "cashtrack_transactions";

export class TransactionRepository {
  private static initLocalStorageMock(): Transaction[] {
    if (typeof window === "undefined") return [];
    
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fall through to mock init
      }
    }

    const mockTx: Transaction[] = [
      { id: "1", userId: "demo-user", merchant: "Framer Inc", category: "Software", amount: -49.00, date: new Date().toISOString().split("T")[0], type: "expense" },
      { id: "2", userId: "demo-user", merchant: "Stripe Payout", category: "Income", amount: 2450.00, date: new Date(Date.now() - 86400000).toISOString().split("T")[0], type: "income" },
      { id: "3", userId: "demo-user", merchant: "Whole Foods", category: "Groceries", amount: -120.40, date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0], type: "expense" },
      { id: "4", userId: "demo-user", merchant: "Airbnb Refund", category: "Travel", amount: 450.00, date: new Date(Date.now() - 8 * 86400000).toISOString().split("T")[0], type: "income" },
    ];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockTx));
    return mockTx;
  }

  static async list(userId: string): Promise<Transaction[]> {
    if (isFirebaseConfigured) {
      const dbList = await TransactionsService.listByUser(userId);
      return dbList.map((dbTx) => ({
        id: dbTx.id,
        userId: dbTx.userId,
        amount: dbTx.amount,
        type: dbTx.type,
        category: dbTx.category,
        date: dbTx.date,
        merchant: dbTx.note || "", // map note to merchant
        note: dbTx.note,
        createdAt: dbTx.createdAt,
        updatedAt: dbTx.updatedAt,
      }));
    }

    return this.initLocalStorageMock();
  }

  static async add(userId: string, transaction: Omit<Transaction, "id" | "userId" | "createdAt" | "updatedAt">): Promise<Transaction> {
    if (isFirebaseConfigured) {
      const dbTxInput: Omit<DBTransaction, "id" | "createdAt" | "updatedAt"> = {
        userId,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        date: transaction.date,
        note: transaction.merchant, // map merchant to note
      };
      const created = await TransactionsService.create(dbTxInput);
      return {
        id: created.id,
        userId: created.userId,
        amount: created.amount,
        type: created.type,
        category: created.category,
        date: created.date,
        merchant: created.note || "",
        note: created.note,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };
    }

    const localList = this.initLocalStorageMock();
    const newTx: Transaction = {
      ...transaction,
      id: Math.random().toString(36).substring(2, 9),
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    localList.unshift(newTx);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localList));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("local-transactions-updated"));
    }
    return newTx;
  }

  static async delete(userId: string, id: string): Promise<void> {
    if (isFirebaseConfigured) {
      await TransactionsService.delete(id);
      return;
    }

    const localList = this.initLocalStorageMock();
    const filtered = localList.filter((tx) => tx.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("local-transactions-updated"));
    }
  }

  static async update(
    userId: string, 
    id: string, 
    updates: Partial<Omit<Transaction, "id" | "userId" | "createdAt" | "updatedAt">>
  ): Promise<void> {
    if (isFirebaseConfigured) {
      const dbUpdates: Partial<Omit<DBTransaction, "id" | "userId" | "createdAt" | "updatedAt">> = {};
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.merchant !== undefined) dbUpdates.note = updates.merchant;
      if (updates.note !== undefined) dbUpdates.note = updates.note;

      await TransactionsService.update(id, dbUpdates);
      return;
    }

    const localList = this.initLocalStorageMock();
    const index = localList.findIndex((tx) => tx.id === id);
    if (index > -1) {
      localList[index] = {
        ...localList[index],
        ...updates,
        updatedAt: new Date(),
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localList));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("local-transactions-updated"));
      }
    }
  }

  static subscribe(
    userId: string, 
    callback: (transactions: Transaction[]) => void, 
    onError?: (error: any) => void
  ): () => void {
    if (isFirebaseConfigured) {
      return TransactionsService.subscribeByUser(
        userId,
        (dbList) => {
          const mapped = dbList.map((dbTx) => ({
            id: dbTx.id,
            userId: dbTx.userId,
            amount: dbTx.amount,
            type: dbTx.type,
            category: dbTx.category,
            date: dbTx.date,
            merchant: dbTx.note || "",
            note: dbTx.note,
            description: dbTx.note,
            createdAt: dbTx.createdAt,
            updatedAt: dbTx.updatedAt,
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
      window.addEventListener("local-transactions-updated", handleStorageUpdate);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageUpdate);
        window.removeEventListener("local-transactions-updated", handleStorageUpdate);
      }
    };
  }
}
