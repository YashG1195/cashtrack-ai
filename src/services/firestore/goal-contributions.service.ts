import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  query, 
  where,
  onSnapshot
} from "firebase/firestore";
import { GoalContribution } from "@/models/types";

const COLLECTION_NAME = "goalContributions";

export class GoalContributionsService {
  private static mapDoc(id: string, data: any): GoalContribution {
    return {
      id,
      goalId: data.goalId || "",
      userId: data.userId || "",
      amount: Number(data.amount) || 0,
      note: data.note || "",
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
    };
  }

  static subscribeByUser(
    userId: string,
    callback: (contributions: GoalContribution[]) => void,
    onError?: (error: any) => void
  ): () => void {
    if (!db) throw new Error("Firestore is not initialized");

    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, where("userId", "==", userId));

    return onSnapshot(
      q,
      (querySnapshot) => {
        const list: GoalContribution[] = [];
        querySnapshot.forEach((docSnap) => {
          list.push(this.mapDoc(docSnap.id, docSnap.data()));
        });
        callback(list);
      },
      onError
    );
  }

  static async create(contrib: Omit<GoalContribution, "id" | "createdAt">): Promise<GoalContribution> {
    if (!db) throw new Error("Firestore is not initialized");

    const colRef = collection(db, COLLECTION_NAME);
    const docRef = doc(colRef);
    const now = new Date();
    const data = {
      ...contrib,
      id: docRef.id,
      createdAt: now,
    };
    await setDoc(docRef, data);
    return {
      ...contrib,
      id: docRef.id,
      createdAt: now,
    };
  }
}
