"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  sendPasswordResetEmail,
  updateProfile,
  User
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import Cookies from "js-cookie";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDemoMode: boolean;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (displayName: string, photoURL: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isExpectedAuthError = (error: any) => {
  const code = error?.code || "";
  const message = error?.message || "";
  return [
    "auth/invalid-credential",
    "auth/user-not-found",
    "auth/wrong-password",
    "auth/email-already-in-use",
    "auth/weak-password",
    "auth/invalid-email",
    "auth/popup-closed-by-user",
    "auth/cancelled-popup-request"
  ].includes(code) || message.includes("invalid-credential") || message.includes("popup-closed-by-user");
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(!isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Demo Mode Initialization
      const mockUserStr = localStorage.getItem("moneyflow_mock_user");
      if (mockUserStr) {
        try {
          const parsed = JSON.parse(mockUserStr);
          setUser(parsed as User);
          Cookies.set("moneyflow_auth_token", "mock-demo-jwt-token", { 
            expires: 7,
            secure: false,
            sameSite: "strict"
          });
        } catch {
          localStorage.removeItem("moneyflow_mock_user");
          Cookies.remove("moneyflow_auth_token");
        }
      } else {
        Cookies.remove("moneyflow_auth_token");
      }
      setLoading(false);
      return;
    }

    // Real Firebase Auth listener
    const unsubscribe = onAuthStateChanged(
      auth, 
      async (currentUser) => {
        if (currentUser) {
          try {
            const token = await currentUser.getIdToken();
            Cookies.set("moneyflow_auth_token", token, { 
              expires: 7, 
              secure: process.env.NODE_ENV === "production",
              sameSite: "strict"
            });
          } catch (error) {
            console.error("Error setting auth token cookie:", error);
          }

          // Sync base64 photoURL and name from Firestore since Firebase Auth limits photoURL size
          if (isFirebaseConfigured) {
            try {
              const { UserRepository } = await import("@/repositories/user.repository");
              const dbUser = await UserRepository.get(currentUser.uid);
              if (dbUser && (dbUser.photoURL || dbUser.displayName)) {
                setUser({
                  ...currentUser,
                  photoURL: dbUser.photoURL || currentUser.photoURL,
                  displayName: dbUser.displayName || currentUser.displayName
                } as unknown as User);
                setLoading(false);
                return;
              }
            } catch(e) {
              console.warn("Failed to sync profile from DB", e);
            }
          }
        }
        
        // Fallback for demo mode or if no DB user exists
        if (currentUser) {
          const localAvatar = localStorage.getItem(`moneyflow_avatar_${currentUser.uid}`);
          setUser({
            ...currentUser,
            photoURL: localAvatar || currentUser.photoURL
          } as unknown as User);
        } else {
          setUser(null);
          Cookies.remove("moneyflow_auth_token");
        }
        setLoading(false);
      },
      (error: any) => {
        console.warn("Firebase Auth observer error. Falling back to Demo Mode:", error.message || error);
        setIsDemoMode(true);
        
        // Restore session from mock storage if it exists
        const mockUserStr = localStorage.getItem("moneyflow_mock_user");
        if (mockUserStr) {
          try {
            setUser(JSON.parse(mockUserStr) as User);
            Cookies.set("moneyflow_auth_token", "mock-demo-jwt-token", { 
              expires: 7,
              secure: false,
              sameSite: "strict"
            });
          } catch {
            localStorage.removeItem("moneyflow_mock_user");
            Cookies.remove("moneyflow_auth_token");
          }
        } else {
          Cookies.remove("moneyflow_auth_token");
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      if (isDemoMode) {
        // Mock Signup
        await new Promise(resolve => setTimeout(resolve, 800));
        const mockUser = {
          uid: "mock-uid-" + Math.random().toString(36).substring(2),
          email,
          displayName,
          photoURL: null,
          emailVerified: true
        } as unknown as User;
        
        localStorage.setItem("moneyflow_mock_user", JSON.stringify(mockUser));
        Cookies.set("moneyflow_auth_token", "mock-demo-jwt-token", { 
          expires: 7,
          secure: false,
          sameSite: "strict"
        });
        setUser(mockUser);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      const token = await userCredential.user.getIdToken(true);
      Cookies.set("moneyflow_auth_token", token, { 
        expires: 7, 
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
      });
      setUser({ ...userCredential.user, displayName });
    } catch (error: any) {
      if (error.code === "auth/api-key-not-valid" || error.message?.includes("api-key-not-valid")) {
        console.warn("Invalid Firebase API Key during signup. Switching to Demo Mode.");
        setIsDemoMode(true);
        // Fallback mock signup
        const mockUser = {
          uid: "mock-uid-" + Math.random().toString(36).substring(2),
          email,
          displayName,
          photoURL: null,
          emailVerified: true
        } as unknown as User;
        localStorage.setItem("moneyflow_mock_user", JSON.stringify(mockUser));
        Cookies.set("moneyflow_auth_token", "mock-demo-jwt-token", { expires: 7 });
        setUser(mockUser);
        return;
      }
      if (isExpectedAuthError(error)) {
        console.warn("Signup warning:", error.message || error);
      } else {
        console.error("Signup error:", error);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (isDemoMode) {
        // Mock Login
        await new Promise(resolve => setTimeout(resolve, 800));
        const mockUser = {
          uid: "mock-uid-12345",
          email,
          displayName: email.split("@")[0],
          photoURL: null,
          emailVerified: true
        } as unknown as User;

        localStorage.setItem("moneyflow_mock_user", JSON.stringify(mockUser));
        Cookies.set("moneyflow_auth_token", "mock-demo-jwt-token", { 
          expires: 7,
          secure: false,
          sameSite: "strict"
        });
        setUser(mockUser);
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      Cookies.set("moneyflow_auth_token", token, { 
        expires: 7, 
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
      });
    } catch (error: any) {
      if (error.code === "auth/api-key-not-valid" || error.message?.includes("api-key-not-valid")) {
        console.warn("Invalid Firebase API Key during login. Switching to Demo Mode.");
        setIsDemoMode(true);
        // Fallback mock login
        const mockUser = {
          uid: "mock-uid-12345",
          email,
          displayName: email.split("@")[0],
          photoURL: null,
          emailVerified: true
        } as unknown as User;
        localStorage.setItem("moneyflow_mock_user", JSON.stringify(mockUser));
        Cookies.set("moneyflow_auth_token", "mock-demo-jwt-token", { expires: 7 });
        setUser(mockUser);
        return;
      }
      if (isExpectedAuthError(error)) {
        console.warn("Login warning:", error.message || error);
      } else {
        console.error("Login error:", error);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      if (isDemoMode) {
        // Mock Google Login
        await new Promise(resolve => setTimeout(resolve, 800));
        const mockUser = {
          uid: "mock-uid-google",
          email: "demo.user@example.com",
          displayName: "Demo User",
          photoURL: null,
          emailVerified: true
        } as unknown as User;

        localStorage.setItem("moneyflow_mock_user", JSON.stringify(mockUser));
        Cookies.set("moneyflow_auth_token", "mock-demo-jwt-token", { 
          expires: 7,
          secure: false,
          sameSite: "strict"
        });
        setUser(mockUser);
        return;
      }

      const userCredential = await signInWithPopup(auth, googleProvider);
      const token = await userCredential.user.getIdToken();
      Cookies.set("moneyflow_auth_token", token, { 
        expires: 7, 
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
      });
    } catch (error: any) {
      if (error.code === "auth/api-key-not-valid" || error.message?.includes("api-key-not-valid")) {
        console.warn("Invalid Firebase API Key during Google login. Switching to Demo Mode.");
        setIsDemoMode(true);
        // Fallback mock google login
        const mockUser = {
          uid: "mock-uid-google",
          email: "demo.user@example.com",
          displayName: "Demo User",
          photoURL: null,
          emailVerified: true
        } as unknown as User;
        localStorage.setItem("moneyflow_mock_user", JSON.stringify(mockUser));
        Cookies.set("moneyflow_auth_token", "mock-demo-jwt-token", { expires: 7 });
        setUser(mockUser);
        return;
      }
      if (isExpectedAuthError(error)) {
        console.warn("Google login warning:", error.message || error);
      } else {
        console.error("Google login error:", error);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log("Mock reset password link requested for:", email);
        return;
      }
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      if (error.code === "auth/api-key-not-valid" || error.message?.includes("api-key-not-valid")) {
        console.warn("Invalid Firebase API Key during reset. Switching to Demo Mode.");
        setIsDemoMode(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log("Mock reset password link requested for (fallback):", email);
        return;
      }
      if (isExpectedAuthError(error)) {
        console.warn("Reset password warning:", error.message || error);
      } else {
        console.error("Reset password error:", error);
      }
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (isDemoMode) {
        localStorage.removeItem("moneyflow_mock_user");
        Cookies.remove("moneyflow_auth_token");
        setUser(null);
        return;
      }

      await signOut(auth);
      Cookies.remove("moneyflow_auth_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (displayName: string, photoURL: string) => {
    if (isDemoMode) {
      const mockUserStr = localStorage.getItem("moneyflow_mock_user");
      if (mockUserStr) {
        const parsed = JSON.parse(mockUserStr);
        const updated = { ...parsed, displayName, photoURL };
        localStorage.setItem("moneyflow_mock_user", JSON.stringify(updated));
        setUser(updated as User);
      }
      return;
    }

    if (auth.currentUser) {
      const updateData: any = { displayName };
      
      // Firebase Auth photoURL has a strict length limit. We cannot pass base64 strings.
      const isBase64 = photoURL && photoURL.startsWith("data:image");
      if (photoURL && !isBase64) {
        updateData.photoURL = photoURL;
      } else if (!photoURL) {
        updateData.photoURL = "";
      }

      await updateProfile(auth.currentUser, updateData);

      // Cache base64 photoURL locally to persist across reloads
      if (isBase64) {
        localStorage.setItem(`moneyflow_avatar_${auth.currentUser.uid}`, photoURL);
      } else if (!photoURL) {
        localStorage.removeItem(`moneyflow_avatar_${auth.currentUser.uid}`);
      }

      setUser({
        ...auth.currentUser,
        displayName,
        photoURL
      } as unknown as User);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isDemoMode, signUpWithEmail, loginWithEmail, loginWithGoogle, resetPassword, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
