import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  onSnapshot
} from "firebase/firestore";
import { Transaction } from "@/models/types";

const COLLECTION_NAME = "transactions";

export class TransactionsService {
  private static mapDoc(id: string, data: any): Transaction {
    return {
      id,
      userId: data.userId || "",
      amount: Number(data.amount) || 0,
      type: data.type || "expense",
      category: data.category || "",
      date: data.date || "",
      note: data.note,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
    };
  }

  static async create(transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">): Promise<Transaction> {
    if (!db) throw new Error("Firestore is not initialized");

    const colRef = collection(db, COLLECTION_NAME);
    const docRef = doc(colRef);
    const now = new Date();
    const data = {
      ...transaction,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef, data);
    return {
      ...transaction,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };
  }

  static async read(id: string): Promise<Transaction | null> {
    if (!db) throw new Error("Firestore is not initialized");

    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return this.mapDoc(id, docSnap.data());
  }

  static async listByUser(userId: string): Promise<Transaction[]> {
    if (!db) throw new Error("Firestore is not initialized");

    const colRef = collection(db, COLLECTION_NAME);
    const q = query(
      colRef, 
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const list: Transaction[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(this.mapDoc(docSnap.id, docSnap.data()));
    });
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }

  static subscribeByUser(
    userId: string, 
    callback: (transactions: Transaction[]) => void, 
    onError?: (error: any) => void
  ): () => void {
    if (!db) return () => {};

    const colRef = collection(db, COLLECTION_NAME);
    const q = query(
      colRef, 
      where("userId", "==", userId)
    );
    return onSnapshot(
      q,
      (querySnapshot) => {
        const list: Transaction[] = [];
        querySnapshot.forEach((docSnap) => {
          list.push(this.mapDoc(docSnap.id, docSnap.data()));
        });
        list.sort((a, b) => b.date.localeCompare(a.date));
        callback(list);
      },
      (error) => {
        if (onError) onError(error);
      }
    );
  }

  static async update(id: string, updates: Partial<Omit<Transaction, "id" | "userId" | "createdAt" | "updatedAt">>): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized");

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  static async delete(id: string): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized");

    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
}
