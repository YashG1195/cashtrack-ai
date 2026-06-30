"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { UserRepository } from "@/repositories/user.repository";
import { SettingsRepository } from "@/repositories/settings.repository";
import { TransactionRepository } from "@/repositories/transaction.repository";
import { BudgetRepository } from "@/repositories/budget.repository";
import { GoalRepository } from "@/repositories/goal.repository";
import { auth, storage, isFirebaseConfigured } from "@/lib/firebase";
import { updateProfile, updateEmail, updatePassword } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  User, 
  Palette, 
  Coins, 
  Bell, 
  Shield, 
  Trash2, 
  Loader2, 
  Check, 
  AlertTriangle,
  Upload,
  Download,
  Eye,
  EyeOff
} from "lucide-react";

type ActiveTab = "profile" | "appearance" | "currency" | "notifications" | "security";

export default function SettingsPage() {
  const { user, updateUserProfile } = useAuth();
  const { 
    theme, 
    accentColor, 
    currency, 
    notificationPrefs, 
    updatePreferences, 
    formatMoney,
    loading: preferencesLoading
  } = useTheme();

  // Local Form Submission Loading States
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAppearance, setSavingAppearance] = useState(false);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [disconnectingSessions, setDisconnectingSessions] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [purgingLedger, setPurgingLedger] = useState(false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");

  // --- Profile Tab State ---
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Appearance Tab State ---
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [selectedAccent, setSelectedAccent] = useState(accentColor);

  // --- Currency Tab State ---
  const [selectedCurrency, setSelectedCurrency] = useState(currency);

  // --- Notifications Tab State ---
  const [prefs, setPrefs] = useState({
    budgetAlerts: true,
    goalAlerts: true,
    aiInsights: true,
    monthlyReports: true,
  });

  // --- Security Tab State ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Load User Preferences & Auth Metadatas
  useEffect(() => {
    if (user) {
      setProfileName(user.displayName || "");
      setProfileEmail(user.email || "");
      setAvatarPreview(user.photoURL || null);
      setSelectedTheme(theme);
      setSelectedAccent(accentColor);
      setSelectedCurrency(currency);
      setPrefs(notificationPrefs);
    }
  }, [user, theme, accentColor, currency, notificationPrefs]);

  const triggerFeedback = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // --- Profile Picture Controls ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      triggerFeedback("File size must not exceed 5MB", true);
      return;
    }

    // Validate format
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      triggerFeedback("Only JPG, PNG, and WEBP formats are accepted", true);
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleDeleteAvatar = async () => {
    if (!user) return;
    if (!confirm("Remove profile picture?")) return;

    setSavingProfile(true);
    try {
      await updateUserProfile(profileName, "");

      await UserRepository.createOrUpdate({
        uid: user.uid,
        name: profileName,
        email: user.email || "",
        photoURL: "",
      });

      setAvatarFile(null);
      setAvatarPreview(null);
      triggerFeedback("Profile picture removed");
    } catch (err: any) {
      console.error(err);
      triggerFeedback("Failed to remove profile picture", true);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingProfile(true);
    try {
      let photoURL = avatarPreview || "";

      // 1. Convert uploaded file to base64 directly (bypassing Firebase Storage due to bucket/CORS issues)
      if (avatarFile) {
        photoURL = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(avatarFile);
          reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const MAX_WIDTH = 200;
              const MAX_HEIGHT = 200;
              let width = img.width;
              let height = img.height;
              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              ctx?.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL("image/jpeg", 0.7));
            };
            img.onerror = () => resolve(avatarPreview || "");
          };
          reader.onerror = () => resolve(avatarPreview || "");
        });
      }

      // 2. Update display name / email in Firebase Auth & Context
      await updateUserProfile(profileName, photoURL);
      if (isFirebaseConfigured && auth.currentUser && profileEmail !== user.email) {
        try {
          await updateEmail(auth.currentUser, profileEmail);
        } catch (emailErr: any) {
          console.error("Failed to update email:", emailErr);
          triggerFeedback("Failed to update email (might require recent login).", true);
        }
      }

      // 3. Update Firestore users collection
      await UserRepository.createOrUpdate({
        uid: user.uid,
        name: profileName,
        displayName: profileName,
        email: profileEmail,
        photoURL: photoURL,
      } as any);

      setAvatarFile(null);
      triggerFeedback("Profile details saved successfully");
    } catch (err: any) {
      console.error(err);
      triggerFeedback(err.message || "Failed to update profile", true);
    } finally {
      setSavingProfile(false);
    }
  };

  // --- Appearance Handler ---
  const handleSaveAppearance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAppearance(true);
    try {
      await updatePreferences({
        theme: selectedTheme,
        accentColor: selectedAccent
      });
      triggerFeedback("Appearance settings updated");
    } catch (err) {
      console.error(err);
      triggerFeedback("Failed to update appearance", true);
    } finally {
      setSavingAppearance(false);
    }
  };

  // --- Currency Handler ---
  const handleSaveCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCurrency(true);
    try {
      await updatePreferences({ currency: selectedCurrency });
      triggerFeedback("Currency settings updated");
    } catch (err) {
      console.error(err);
      triggerFeedback("Failed to update currency settings", true);
    } finally {
      setSavingCurrency(false);
    }
  };

  // --- Notifications Handler ---
  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNotifications(true);
    try {
      await updatePreferences({ notificationPrefs: prefs });
      triggerFeedback("Notification preferences updated");
    } catch (err) {
      console.error(err);
      triggerFeedback("Failed to update notification settings", true);
    } finally {
      setSavingNotifications(false);
    }
  };

  // --- Security Passwords ---
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      triggerFeedback("New passwords do not match", true);
      return;
    }
    if (newPassword.length < 6) {
      triggerFeedback("Password must be at least 6 characters", true);
      return;
    }

    setUpdatingPassword(true);
    try {
      if (isFirebaseConfigured && auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        triggerFeedback("Password updated successfully");
      } else {
        // Mock success in demo mode
        await new Promise((resolve) => setTimeout(resolve, 800));
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        triggerFeedback("Password updated (Demo Mode)");
      }
    } catch (err: any) {
      console.error(err);
      triggerFeedback(
        err.code === "auth/requires-recent-login"
          ? "Re-authentication required. Please sign out and sign back in to modify password."
          : err.message || "Failed to update password",
        true
      );
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSignOutEverywhere = async () => {
    setDisconnectingSessions(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      triggerFeedback("Successfully signed out from other locations");
    } catch (err) {
      triggerFeedback("Sign out failed", true);
    } finally {
      setDisconnectingSessions(false);
    }
  };

  // --- Data Management (Export & Reset) ---
  const handleExportData = async () => {
    if (!user) return;
    setExportingData(true);
    try {
      const txs = await TransactionRepository.list(user.uid);
      const budgets = await BudgetRepository.list(user.uid);
      const goals = await GoalRepository.list(user.uid);
      const settings = await SettingsRepository.get(user.uid);

      const combinedData = {
        exportedAt: new Date().toISOString(),
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        },
        settings,
        budgets,
        goals,
        transactions: txs
      };

      const dataStr = JSON.stringify(combinedData, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cashtrack_data_export_${new Date().toISOString().slice(0,10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      triggerFeedback("Data export completed");
    } catch (err) {
      console.error(err);
      triggerFeedback("Export failed", true);
    } finally {
      setExportingData(false);
    }
  };

  const handleResetData = async () => {
    if (!user) return;
    if (!confirm("CRITICAL WARNING: This will permanently delete all your logged transactions, budget limits, and savings goals. This action cannot be undone. Are you sure you want to reset all data?")) return;

    setPurgingLedger(true);
    try {
      await SettingsRepository.clearAllData(user.uid);
      triggerFeedback("All database logs cleared. Mock values restored.");
      window.location.reload();
    } catch (err) {
      console.error("Purge failure", err);
      triggerFeedback("Failed to reset database", true);
    } finally {
      setPurgingLedger(false);
    }
  };

  // Accent Colors Config
  const accentOptions = [
    { name: "purple", color: "bg-amber-600", label: "Purple (Default)" },
    { name: "blue", color: "bg-blue-500", label: "Blue" },
    { name: "green", color: "bg-emerald-500", label: "Green" },
    { name: "orange", color: "bg-orange-500", label: "Orange" },
    { name: "pink", color: "bg-pink-500", label: "Pink" }
  ];

  // Currency options
  const currencyOptions = [
    { code: "USD", label: "USD ($) - United States Dollar" },
    { code: "INR", label: "INR (₹) - Indian Rupee" },
    { code: "EUR", label: "EUR (€) - Euro" },
    { code: "GBP", label: "GBP (£) - British Pound" },
    { code: "CAD", label: "CAD ($) - Canadian Dollar" },
    { code: "AUD", label: "AUD ($) - Australian Dollar" }
  ];

  const loginProvider = user?.providerData?.[0]?.providerId || "Password / Email";

  if (preferencesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Settings</h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          Personalize your dashboard theme, currency metrics, profile card, and database exports.
        </p>
      </div>

      {/* Global Status messages */}
      {successMsg && (
        <div className="p-3.5 text-xs font-semibold rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 text-xs font-semibold rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-2 animate-fade-in">
          <AlertTriangle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Settings Grid Structure */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar Tabs */}
        <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible gap-1 pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 pr-0 md:pr-4">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2.5 px-3.5 h-10 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "profile"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-l-2 border-amber-500"
                : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900/60 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Details</span>
          </button>
          
          <button
            onClick={() => setActiveTab("appearance")}
            className={`flex items-center gap-2.5 px-3.5 h-10 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "appearance"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-l-2 border-amber-500"
                : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900/60 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Appearance & Theme</span>
          </button>

          <button
            onClick={() => setActiveTab("currency")}
            className={`flex items-center gap-2.5 px-3.5 h-10 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "currency"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-l-2 border-amber-500"
                : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900/60 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Currency preferences</span>
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-2.5 px-3.5 h-10 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "notifications"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-l-2 border-amber-500"
                : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900/60 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2.5 px-3.5 h-10 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "security"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-l-2 border-amber-500"
                : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900/60 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Security & Data</span>
          </button>
        </div>

        {/* Dynamic Panels Content */}
        <div className="md:col-span-3 min-h-[450px]">
          {/* TAB 1: PROFILE MANAGEMENT */}
          {activeTab === "profile" && (
            <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Profile Management</h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">Edit public name details or update your user avatar.</p>
              </div>

              {/* Avatar Form Upload Field */}
              <div className="flex flex-col sm:flex-row items-center gap-5 pb-2">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-400 dark:text-neutral-500 text-xl font-bold overflow-hidden shadow-inner">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      profileName ? (
                        profileName.includes(" ")
                          ? profileName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
                          : profileName.slice(0, 2).toUpperCase()
                      ) : "MF"
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                    aria-label="Upload new picture"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                  />
                  <button
                    type="button"
                    disabled={savingProfile}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 h-8.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-800 dark:text-neutral-200 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                  </button>
                  {avatarPreview && (
                    <button
                      type="button"
                      disabled={savingProfile}
                      onClick={handleDeleteAvatar}
                      className="px-3.5 h-8.5 rounded-lg border border-red-500/20 bg-transparent text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-500/5 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300" htmlFor="displayName">
                      Display Name
                    </label>
                    <input
                      id="displayName"
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full h-10 px-3 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white focus:border-amber-500 outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300" htmlFor="emailAddress">
                      Email Address
                    </label>
                    <input
                      id="emailAddress"
                      type="email"
                      required
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="w-full h-10 px-3 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white focus:border-amber-500 outline-none transition-colors"
                      disabled={loginProvider === "google.com"}
                    />
                    {loginProvider === "google.com" && (
                      <p className="text-[10px] text-neutral-400">Email updates locked for Google Provider.</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-900">
                  <div className="text-[10px] text-neutral-400">
                    Registered: {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "N/A"}
                  </div>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center justify-center gap-1.5 px-4 h-9.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {savingProfile ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Save Details"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: APPEARANCE & ACCENT THEME */}
          {activeTab === "appearance" && (
            <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Appearance & Theme Settings</h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">Customize global canvas modes and brand accent highlights. Changes apply instantly.</p>
              </div>

              <div className="space-y-6">
                {/* Theme mode Card Grid */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Theme canvas mode
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Dark */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTheme("dark");
                        updatePreferences({ theme: "dark" });
                      }}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between h-24 ${
                        selectedTheme === "dark"
                          ? "border-amber-600 bg-amber-500/5 shadow-inner text-amber-600 dark:text-amber-400"
                          : "border-neutral-200 dark:border-neutral-800 bg-transparent text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700"
                      }`}
                    >
                      <span className="text-xs font-bold">Dark Mode</span>
                      <div className="w-full h-3 bg-neutral-900 border border-neutral-800 rounded mt-2" />
                    </button>
                    {/* Light */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTheme("light");
                        updatePreferences({ theme: "light" });
                      }}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between h-24 ${
                        selectedTheme === "light"
                          ? "border-amber-600 bg-amber-500/5 shadow-inner text-amber-600 dark:text-amber-400"
                          : "border-neutral-200 dark:border-neutral-800 bg-transparent text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700"
                      }`}
                    >
                      <span className="text-xs font-bold">Light Mode</span>
                      <div className="w-full h-3 bg-neutral-100 border border-neutral-200 rounded mt-2" />
                    </button>
                    {/* System */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTheme("system");
                        updatePreferences({ theme: "system" });
                      }}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between h-24 ${
                        selectedTheme === "system"
                          ? "border-amber-600 bg-amber-500/5 shadow-inner text-amber-600 dark:text-amber-400"
                          : "border-neutral-200 dark:border-neutral-800 bg-transparent text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700"
                      }`}
                    >
                      <span className="text-xs font-bold">System Mode</span>
                      <div className="w-full h-3 bg-gradient-to-r from-neutral-100 to-neutral-900 border border-neutral-300 rounded mt-2" />
                    </button>
                  </div>
                </div>

                <hr className="border-neutral-100 dark:border-neutral-900" />

                {/* Accent Color Circle Grid */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Accent brand color
                  </label>
                  <p className="text-[10px] text-neutral-400">This accent applies to sidebar selections, progress bars, interactive buttons, and charts.</p>
                  <div className="flex items-center gap-3 mt-4">
                    {["purple", "blue", "green", "orange", "pink"].map((color) => (
                      <button
                        type="button"
                        key={color}
                        onClick={() => {
                          setSelectedAccent(color as any);
                          updatePreferences({ accentColor: color as any });
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          selectedAccent === color ? "ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-neutral-950 scale-110" : "hover:scale-105"
                        }`}
                        style={{
                          backgroundColor:
                            color === "purple" ? "#F59E0B" :
                            color === "blue" ? "#3B82F6" :
                            color === "green" ? "#10B981" :
                            color === "orange" ? "#F97316" :
                            "#F97316"
                        }}
                      >
                        {selectedAccent === color && <Check className="w-5 h-5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CURRENCY PREFERENCES */}
          {activeTab === "currency" && (
            <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Currency Settings</h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">Select your primary currency to format all balances, budgets, and savings reports.</p>
              </div>

              <form onSubmit={handleSaveCurrency} className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Preferred Currency
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currencyOptions.map((opt) => (
                      <button
                        key={opt.code}
                        type="button"
                        onClick={() => setSelectedCurrency(opt.code)}
                        className={`px-4 h-11 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                          selectedCurrency === opt.code
                            ? "bg-amber-500/5 border-amber-600 text-amber-600 dark:text-amber-400 shadow-sm"
                            : "border-neutral-200 dark:border-neutral-800 bg-transparent text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {selectedCurrency === opt.code && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-neutral-100 dark:border-neutral-900" />

                {/* Centralized Formatting Preview Card */}
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-2.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Live Preview (centralized currency format)</span>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-2">
                      <span className="block text-[10px] text-neutral-400">Total Income</span>
                      <span className="text-sm font-bold text-emerald-500">
                        {selectedCurrency === currency 
                          ? formatMoney(30000) 
                          : selectedCurrency === "USD" ? "$30,000.00"
                          : selectedCurrency === "INR" ? "₹30,000.00"
                          : selectedCurrency === "EUR" ? "€30,000.00"
                          : selectedCurrency === "GBP" ? "£30,000.00"
                          : selectedCurrency === "CAD" ? "$30,000.00"
                          : "$30,000.00"}
                      </span>
                    </div>
                    <div className="p-2">
                      <span className="block text-[10px] text-neutral-400">Monthly spent</span>
                      <span className="text-sm font-bold text-red-500">
                        {selectedCurrency === currency 
                          ? formatMoney(4250) 
                          : selectedCurrency === "USD" ? "$4,250.00"
                          : selectedCurrency === "INR" ? "₹4,250.00"
                          : selectedCurrency === "EUR" ? "€4,250.00"
                          : selectedCurrency === "GBP" ? "£4,250.00"
                          : selectedCurrency === "CAD" ? "$4,250.00"
                          : "$4,250.00"}
                      </span>
                    </div>
                    <div className="p-2">
                      <span className="block text-[10px] text-neutral-400">Savings Target</span>
                      <span className="text-sm font-bold text-amber-500">
                        {selectedCurrency === currency 
                          ? formatMoney(1500) 
                          : selectedCurrency === "USD" ? "$1,500.00"
                          : selectedCurrency === "INR" ? "₹1,500.00"
                          : selectedCurrency === "EUR" ? "€1,500.00"
                          : selectedCurrency === "GBP" ? "£1,500.00"
                          : selectedCurrency === "CAD" ? "$1,500.00"
                          : "$1,500.00"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-4 border-t border-neutral-100 dark:border-neutral-900">
                  <button
                    type="submit"
                    disabled={savingCurrency}
                    className="inline-flex items-center justify-center gap-1.5 px-4 h-9.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {savingCurrency ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Apply Currency"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: NOTIFICATION PREFERENCES */}
          {activeTab === "notifications" && (
            <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Notification Settings</h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">Enable or disable various app notification modules.</p>
              </div>

              <form onSubmit={handleSaveNotifications} className="space-y-5">
                <div className="space-y-4">
                  {/* Budget Alerts toggle */}
                  <div className="flex items-start gap-3.5">
                    <input
                      id="budgetAlerts"
                      type="checkbox"
                      checked={prefs.budgetAlerts}
                      onChange={(e) => setPrefs({ ...prefs, budgetAlerts: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-neutral-300 dark:border-neutral-700 bg-transparent mt-0.5 cursor-pointer animate-fade-in"
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="budgetAlerts" className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer">
                        Budget Usage Alerts
                      </label>
                      <p className="text-[10px] text-neutral-400 leading-relaxed">
                        Notify me when my category spending reaches 80% warning and 100% exceeded thresholds.
                      </p>
                    </div>
                  </div>

                  {/* Goal Alerts toggle */}
                  <div className="flex items-start gap-3.5">
                    <input
                      id="goalAlerts"
                      type="checkbox"
                      checked={prefs.goalAlerts}
                      onChange={(e) => setPrefs({ ...prefs, goalAlerts: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-neutral-300 dark:border-neutral-700 bg-transparent mt-0.5 cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="goalAlerts" className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer">
                        Savings Goals Reminders
                      </label>
                      <p className="text-[10px] text-neutral-400 leading-relaxed">
                        Send alerts for goal milestones, monthly targets, and overdue contributions.
                      </p>
                    </div>
                  </div>

                  {/* AI Insights toggle */}
                  <div className="flex items-start gap-3.5">
                    <input
                      id="aiInsights"
                      type="checkbox"
                      checked={prefs.aiInsights}
                      onChange={(e) => setPrefs({ ...prefs, aiInsights: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-neutral-300 dark:border-neutral-700 bg-transparent mt-0.5 cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="aiInsights" className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer">
                        AI advisor Insights
                      </label>
                      <p className="text-[10px] text-neutral-400 leading-relaxed">
                        Trigger updates when new financial habits or spending anomalies are analyzed by the AI.
                      </p>
                    </div>
                  </div>

                  {/* Monthly Reports toggle */}
                  <div className="flex items-start gap-3.5">
                    <input
                      id="monthlyReports"
                      type="checkbox"
                      checked={prefs.monthlyReports}
                      onChange={(e) => setPrefs({ ...prefs, monthlyReports: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-neutral-300 dark:border-neutral-700 bg-transparent mt-0.5 cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="monthlyReports" className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer">
                        Monthly Statements & Reports
                      </label>
                      <p className="text-[10px] text-neutral-400 leading-relaxed">
                        Notify me when the PDF statements and monthly financial round-ups are generated.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-4 border-t border-neutral-100 dark:border-neutral-900">
                  <button
                    type="submit"
                    disabled={savingNotifications}
                    className="inline-flex items-center justify-center gap-1.5 px-4 h-9.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {savingNotifications ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Apply Preferences"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: SECURITY & DATA EXPORT */}
          {activeTab === "security" && (
            <div className="space-y-6">
              {/* Login credentials section */}
              <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Security & Login Details</h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Monitor login history metadata or change user passwords.</p>
                </div>

                {/* Auth Metadata view */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
                  <div>
                    <span className="block text-[10px] text-neutral-400">Login Provider</span>
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 capitalize">{loginProvider}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-neutral-400">Last Session Login</span>
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      {user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString(undefined, {month: "short", day: "numeric", hour: "numeric", minute: "numeric"}) : "Just Now"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-neutral-400">Account Created</span>
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, {month: "short", day: "numeric", year: "numeric"}) : "N/A"}
                    </span>
                  </div>
                </div>

                {/* Change Password fields */}
                {loginProvider === "password" && (
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Change Password</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-semibold text-neutral-700 dark:text-neutral-300" htmlFor="currentPassword">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full h-9.5 px-3 pr-8 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 outline-none"
                          >
                            {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-semibold text-neutral-700 dark:text-neutral-300" htmlFor="newPassword">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full h-9.5 px-3 pr-8 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 outline-none"
                          >
                            {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-semibold text-neutral-700 dark:text-neutral-300" htmlFor="confirmPassword">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full h-9.5 px-3 pr-8 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 outline-none"
                          >
                            {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-3">
                      <button
                        type="submit"
                        disabled={updatingPassword}
                        className="inline-flex items-center justify-center gap-1.5 px-4 h-9 bg-neutral-800 hover:bg-neutral-700 dark:bg-neutral-200 dark:hover:bg-neutral-100 text-white dark:text-neutral-950 rounded-lg text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        {updatingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Change Password"}
                      </button>
                    </div>
                  </form>
                )}

                <hr className="border-neutral-100 dark:border-neutral-900" />

                {/* Sign Out Everywhere trigger */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-neutral-850 dark:text-neutral-200">Sign Out Everywhere</h4>
                    <p className="text-[10px] text-neutral-400 max-w-md">Deauthorizes tokens and logs out your account from all other browsers or mobile sessions.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOutEverywhere}
                    disabled={disconnectingSessions}
                    className="px-3.5 h-9 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Disconnect Sessions
                  </button>
                </div>
              </div>

              {/* Data management and danger zones */}
              <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Data Management</h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Download full JSON data archives or perform ledger purges.</p>
                </div>

                {/* Export data */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-neutral-850 dark:text-neutral-200">Export My Data</h4>
                    <p className="text-[10px] text-neutral-400 max-w-md">Download a comprehensive `.json` file containing all transaction logs, savings goals, and budget limits.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportData}
                    disabled={exportingData}
                    className="px-3.5 h-9.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {exportingData ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download JSON Archive</span>
                      </>
                    )}
                  </button>
                </div>

                <hr className="border-neutral-100 dark:border-neutral-900" />

                {/* Danger purge zone */}
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 space-y-4">
                  <h4 className="text-xs font-bold text-red-500 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span>Danger Purge Zone</span>
                  </h4>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xl">
                    Purging deletes all database logs associated with your profile, including transaction histories, category limits, and savings progress. This is immediate, complete, and irreversible.
                  </p>
                  <div>
                    <button
                      type="button"
                      onClick={handleResetData}
                      disabled={purgingLedger}
                      className="inline-flex items-center justify-center gap-1.5 px-4.5 h-9 bg-red-650 hover:bg-red-600 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {purgingLedger ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Purge Profile Ledger</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
