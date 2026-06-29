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

export interface AISummary {
  id?: string;
  userId: string;
  content: string;
  createdAt: Date;
}

const COLLECTION_NAME = "aiSummaries";

export class AISummariesService {
  private static mapDoc(id: string, data: any): AISummary {
    return {
      id,
      userId: data.userId || "",
      content: data.content || "",
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
    };
  }

  static async getLatestByUser(userId: string): Promise<AISummary | null> {
    if (!db) throw new Error("Firestore is not initialized");

    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const list: AISummary[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(this.mapDoc(docSnap.id, docSnap.data()));
    });
    if (list.length === 0) return null;
    list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return list[0];
  }

  static async create(userId: string, content: string): Promise<AISummary> {
    if (!db) throw new Error("Firestore is not initialized");

    const colRef = collection(db, COLLECTION_NAME);
    const docRef = doc(colRef);
    const now = new Date();
    const data = {
      content,
      userId,
      createdAt: now,
    };
    await setDoc(docRef, data);
    return {
      id: docRef.id,
      userId,
      content,
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
