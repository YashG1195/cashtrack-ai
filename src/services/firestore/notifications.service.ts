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
  onSnapshot,
  orderBy,
  writeBatch
} from "firebase/firestore";
import { Notification } from "@/models/types";

const COLLECTION_NAME = "notifications";

export class NotificationsService {
  private static mapDoc(id: string, data: any): Notification {
    return {
      id,
      userId: data.userId || "",
      title: data.title || "",
      message: data.message || "",
      type: data.type || "system",
      isRead: !!data.isRead,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
    };
  }

  static subscribeByUser(
    userId: string,
    callback: (notifications: Notification[]) => void,
    onError?: (error: any) => void
  ): () => void {
    if (!db) throw new Error("Firestore is not initialized");

    const colRef = collection(db, COLLECTION_NAME);
    const q = query(
      colRef, 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        const list: Notification[] = [];
        querySnapshot.forEach((docSnap) => {
          list.push(this.mapDoc(docSnap.id, docSnap.data()));
        });
        callback(list);
      },
      onError
    );
  }

  static async create(notification: Omit<Notification, "id" | "createdAt">): Promise<Notification> {
    if (!db) throw new Error("Firestore is not initialized");

    const colRef = collection(db, COLLECTION_NAME);
    const docRef = doc(colRef);
    const now = new Date();
    const data = {
      ...notification,
      id: docRef.id,
      createdAt: now,
    };
    await setDoc(docRef, data);
    return {
      ...notification,
      id: docRef.id,
      createdAt: now,
    };
  }

  static async read(id: string): Promise<Notification | null> {
    if (!db) throw new Error("Firestore is not initialized");

    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return this.mapDoc(id, docSnap.data());
  }

  static async listByUser(userId: string): Promise<Notification[]> {
    if (!db) throw new Error("Firestore is not initialized");

    const colRef = collection(db, COLLECTION_NAME);
    const q = query(
      colRef, 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const list: Notification[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(this.mapDoc(docSnap.id, docSnap.data()));
    });
    return list;
  }

  static async update(id: string, updates: Partial<Omit<Notification, "id" | "userId" | "createdAt">>): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized");

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updates);
  }

  static async delete(id: string): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized");

    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }

  static async markAllAsRead(userId: string): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized");

    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, where("userId", "==", userId), where("isRead", "==", false));
    const querySnapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    querySnapshot.forEach((docSnap) => {
      const docRef = doc(db, COLLECTION_NAME, docSnap.id);
      batch.update(docRef, { isRead: true });
    });
    
    await batch.commit();
  }
}
