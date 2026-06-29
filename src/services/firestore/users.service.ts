import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { User } from "@/models/types";

const COLLECTION_NAME = "users";

export class UsersService {
  /**
   * Helper to map Firestore data to User interface
   */
  private static mapDoc(uid: string, data: any): User {
    return {
      uid,
      name: data.displayName || data.name || "",
      displayName: data.displayName || data.name || "",
      email: data.email || "",
      photoURL: data.photoURL || "",
      theme: data.theme || "dark",
      accentColor: data.accentColor || "purple",
      currency: data.currency || "USD",
      notificationSettings: data.notificationSettings || {},
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
    };
  }

  static async create(user: Omit<User, "createdAt" | "updatedAt">): Promise<User> {
    if (!db) throw new Error("Firestore is not initialized");

    const docRef = doc(db, COLLECTION_NAME, user.uid);
    const now = new Date();
    const data = {
      displayName: user.displayName || user.name || "",
      email: user.email || "",
      photoURL: user.photoURL || "",
      theme: user.theme || "dark",
      accentColor: user.accentColor || "purple",
      currency: user.currency || "USD",
      notificationSettings: user.notificationSettings || {
        budgetAlerts: true,
        goalAlerts: true,
        aiInsights: true,
        monthlyReports: true
      },
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef, data);
    return {
      uid: user.uid,
      name: data.displayName,
      displayName: data.displayName,
      email: data.email,
      photoURL: data.photoURL,
      theme: data.theme,
      accentColor: data.accentColor,
      currency: data.currency,
      notificationSettings: data.notificationSettings,
      createdAt: now,
      updatedAt: now,
    };
  }

  static async read(uid: string): Promise<User | null> {
    if (!db) throw new Error("Firestore is not initialized");

    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return this.mapDoc(uid, docSnap.data());
  }

  static async update(uid: string, updates: Partial<Omit<User, "uid" | "createdAt" | "updatedAt">>): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized");

    const docRef = doc(db, COLLECTION_NAME, uid);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  static async delete(uid: string): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized");

    const docRef = doc(db, COLLECTION_NAME, uid);
    await deleteDoc(docRef);
  }
}
