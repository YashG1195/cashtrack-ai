import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  query, 
  where,
  getDocs,
  writeBatch
} from "firebase/firestore";

export interface AIRecommendation {
  id?: string;
  userId: string;
  type: "budget" | "savings" | "alert";
  content: string;
  createdAt: Date;
}

const COLLECTION_NAME = "aiRecommendations";

export class AIRecommendationsService {
  private static mapDoc(id: string, data: any): AIRecommendation {
    return {
      id,
      userId: data.userId || "",
      type: data.type || "budget",
      content: data.content || "",
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
    };
  }

  static async listByUser(userId: string): Promise<AIRecommendation[]> {
    if (!db) throw new Error("Firestore is not initialized");

    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const list: AIRecommendation[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(this.mapDoc(docSnap.id, docSnap.data()));
    });
    return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  static async create(userId: string, rec: Omit<AIRecommendation, "id" | "userId" | "createdAt">): Promise<AIRecommendation> {
    if (!db) throw new Error("Firestore is not initialized");

    const colRef = collection(db, COLLECTION_NAME);
    const docRef = doc(colRef);
    const now = new Date();
    const data = {
      ...rec,
      userId,
      createdAt: now,
    };
    await setDoc(docRef, data);
    return {
      id: docRef.id,
      userId,
      type: rec.type,
      content: rec.content,
      createdAt: now,
    };
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
