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
import { Goal } from "@/models/types";

const COLLECTION_NAME = "goals";

export class GoalsService {
  private static mapDoc(id: string, data: any): Goal {
    return {
      id,
      userId: data.userId || "",
      goalName: data.goalName || "",
      targetAmount: Number(data.targetAmount) || 0,
      currentAmount: Number(data.currentAmount) || 0,
      deadline: data.deadline || "",
      themeColor: data.themeColor || "purple",
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
    };
  }

  static subscribeByUser(
    userId: string,
    callback: (goals: Goal[]) => void,
    onError?: (error: any) => void
  ): () => void {
    if (!db) throw new Error("Firestore is not initialized");

    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, where("userId", "==", userId));

    return onSnapshot(
      q,
      (querySnapshot) => {
        const list: Goal[] = [];
        querySnapshot.forEach((docSnap) => {
          list.push(this.mapDoc(docSnap.id, docSnap.data()));
        });
        callback(list);
      },
      onError
    );
  }

  static async create(goal: Omit<Goal, "id" | "createdAt">): Promise<Goal> {
    if (!db) throw new Error("Firestore is not initialized");

    const colRef = collection(db, COLLECTION_NAME);
    const docRef = doc(colRef);
    const now = new Date();
    const data = {
      ...goal,
      id: docRef.id,
      themeColor: goal.themeColor || "purple",
      createdAt: now,
    };
    await setDoc(docRef, data);
    return {
      ...goal,
      id: docRef.id,
      themeColor: goal.themeColor || "purple",
      createdAt: now,
    };
  }

  static async read(id: string): Promise<Goal | null> {
    if (!db) throw new Error("Firestore is not initialized");

    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return this.mapDoc(id, docSnap.data());
  }

  static async listByUser(userId: string): Promise<Goal[]> {
    if (!db) throw new Error("Firestore is not initialized");

    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const list: Goal[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(this.mapDoc(docSnap.id, docSnap.data()));
    });
    return list;
  }

  static async update(id: string, updates: Partial<Omit<Goal, "id" | "userId" | "createdAt">>): Promise<void> {
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
