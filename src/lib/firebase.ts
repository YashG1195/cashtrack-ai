import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase keys are provided and are not default placeholders
export const isFirebaseConfigured = !!(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY.trim() !== "" &&
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes("here") &&
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes("your_api_key") &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.trim() !== "" &&
  !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.includes("your_project_id")
);

console.log("DEBUG AUTH:", {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  isFirebaseConfigured
});

// Initialize Firebase
const app = getApps().length > 0 
  ? getApp() 
  : initializeApp(isFirebaseConfigured ? firebaseConfig : {
      apiKey: "dummy-api-key-for-build",
      authDomain: "dummy-project.firebaseapp.com",
      projectId: "dummy-project",
      storageBucket: "dummy-project.appspot.com",
      messagingSenderId: "0000000000",
      appId: "1:0000000000:web:000000000000"
    });

const auth = (isFirebaseConfigured ? getAuth(app) : null) as any;
const db = (isFirebaseConfigured ? getFirestore(app) : null) as any;
const storage = (isFirebaseConfigured ? getStorage(app) : null) as any;
const googleProvider = (isFirebaseConfigured ? new GoogleAuthProvider() : null) as any;
export { app, auth, db, googleProvider, storage };
