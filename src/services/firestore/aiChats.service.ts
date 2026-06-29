import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  query, 
  where,
  onSnapshot,
  getDocs,
  writeBatch
} from "firebase/firestore";

export interface AIChatMessage {
  id?: string;
  userId: string;
  message: string;
  role: "user" | "assistant";
  timestamp: Date;
}

const COLLECTION_NAME = "aiChats";

export class AIChatsService {
  private static mapDoc(id: string, data: any): AIChatMessage {
    return {
      id,
      userId: data.userId || "",
      message: data.message || "",
      role: data.role || "user",
      timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp || Date.now()),
    };
  }

  static subscribeByUser(
    userId: string,
    callback: (messages: AIChatMessage[]) => void,
    onError?: (error: any) => void
  ): () => void {
    if (!db) throw new Error("Firestore is not initialized");

    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, where("userId", "==", userId));

    return onSnapshot(
      q,
      (querySnapshot) => {
        const list: AIChatMessage[] = [];
        querySnapshot.forEach((docSnap) => {
          list.push(this.mapDoc(docSnap.id, docSnap.data()));
        });
        // Client-side sort to avoid composite index errors
        list.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        callback(list);
      },
      onError
    );
  }

  static async add(userId: string, message: Omit<AIChatMessage, "id" | "userId" | "timestamp">): Promise<AIChatMessage> {
    if (!db) throw new Error("Firestore is not initialized");

    const colRef = collection(db, COLLECTION_NAME);
    const docRef = doc(colRef);
    const now = new Date();
    const data = {
      ...message,
      userId,
      timestamp: now,
    };
    await setDoc(docRef, data);
    return {
      id: docRef.id,
      userId,
      message: message.message,
      role: message.role,
      timestamp: now,
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
