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
import { Budget } from "@/models/types";

const COLLECTION_NAME = "budgets";

export class BudgetsService {
  private static mapDoc(id: string, data: any): Budget {
    return {
      id,
      userId: data.userId || "",
      category: data.category || "",
      limitAmount: Number(data.limitAmount) || 0,
      month: data.month || "",
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
    };
  }

  static subscribeByUser(
    userId: string,
    callback: (budgets: Budget[]) => void,
    onError?: (error: any) => void
  ): () => void {
    if (!db) throw new Error("Firestore is not initialized");

    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, where("userId", "==", userId));

    return onSnapshot(
      q,
      (querySnapshot) => {
        const list: Budget[] = [];
        querySnapshot.forEach((docSnap) => {
          list.push(this.mapDoc(docSnap.id, docSnap.data()));
        });
        callback(list);
      },
      onError
    );
  }

  static async create(budget: Omit<Budget, "id" | "createdAt">): Promise<Budget> {
    if (!db) throw new Error("Firestore is not initialized");

    // Use a unique document ID to enforce unique budget per user, category, and month
    const docId = `${budget.userId}_${budget.category}_${budget.month}`.replace(/\s+/g, "_");
    const docRef = doc(db, COLLECTION_NAME, docId);
    const now = new Date();
    const data = {
      ...budget,
      id: docId,
      createdAt: now,
    };
    await setDoc(docRef, data);
    return {
      ...budget,
      id: docId,
      createdAt: now,
    };
  }

  static async read(id: string): Promise<Budget | null> {
    if (!db) throw new Error("Firestore is not initialized");

    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return this.mapDoc(id, docSnap.data());
  }

  static async listByUser(userId: string): Promise<Budget[]> {
    if (!db) throw new Error("Firestore is not initialized");

    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const list: Budget[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(this.mapDoc(docSnap.id, docSnap.data()));
    });
    return list;
  }

  static async update(id: string, updates: Partial<Omit<Budget, "id" | "userId" | "createdAt">>): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized");

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updates);
  }

  static async delete(id: string): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized");

    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
}
