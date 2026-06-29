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
  orderBy,
  writeBatch,
  onSnapshot
} from "firebase/firestore";
import { AIInsight } from "@/models/types";

const COLLECTION_NAME = "aiInsights";

export class AIInsightsService {
  private static mapDoc(id: string, data: any): AIInsight {
    return {
      id,
      userId: data.userId || "",
      content: data.content || "",
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
    };
  }

  static async create(insight: Omit<AIInsight, "id" | "createdAt">): Promise<AIInsight> {
    if (!db) throw new Error("Firestore is not initialized");

    const colRef = collection(db, COLLECTION_NAME);
    const docRef = doc(colRef);
    const now = new Date();
    const data = {
      ...insight,
      id: docRef.id,
      createdAt: now,
    };
    await setDoc(docRef, data);
    return {
      ...insight,
      id: docRef.id,
      createdAt: now,
    };
  }

  static async read(id: string): Promise<AIInsight | null> {
    if (!db) throw new Error("Firestore is not initialized");

    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return this.mapDoc(id, docSnap.data());
  }

  static async listByUser(userId: string): Promise<AIInsight[]> {
    if (!db) throw new Error("Firestore is not initialized");

    const colRef = collection(db, COLLECTION_NAME);
    const q = query(
      colRef, 
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const list: AIInsight[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(this.mapDoc(docSnap.id, docSnap.data()));
    });
    return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  static subscribeByUser(
    userId: string,
    callback: (insights: AIInsight[]) => void,
    onError?: (error: any) => void
  ): () => void {
    if (!db) throw new Error("Firestore is not initialized");

    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, where("userId", "==", userId));

    return onSnapshot(
      q,
      (querySnapshot) => {
        const list: AIInsight[] = [];
        querySnapshot.forEach((docSnap) => {
          list.push(this.mapDoc(docSnap.id, docSnap.data()));
        });
        list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        callback(list);
      },
      onError
    );
  }

  static async update(id: string, updates: Partial<Omit<AIInsight, "id" | "userId" | "createdAt">>): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized");

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updates);
  }

  static async delete(id: string): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized");

    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }

  static async clearAll(userId: string): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized");

    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const batch = writeBatch(db);
    querySnapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  }
}
