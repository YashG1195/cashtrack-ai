"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { SettingsRepository, UserSettings } from "@/repositories/settings.repository";
import { formatCurrencyValue } from "@/lib/finance";

type Theme = "light" | "dark" | "system";
type AccentColor = "purple" | "blue" | "green" | "orange" | "pink";

interface NotificationPrefs {
  budgetAlerts: boolean;
  goalAlerts: boolean;
  aiInsights: boolean;
  monthlyReports: boolean;
}

interface ThemeContextType {
  theme: Theme;
  accentColor: AccentColor;
  currency: string; // E.g. "USD", "INR", "EUR", "GBP", "CAD", "AUD"
  notificationPrefs: NotificationPrefs;
  updatePreferences: (updates: Partial<UserSettings>) => Promise<void>;
  loading: boolean;
  formatMoney: (amount: number) => string;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ACCENT_COLORS = {
  purple: {
    "50": "#EEF2FF",
    "100": "#E0E7FF",
    "300": "#C7D2FE",
    "400": "#818CF8",
    "500": "#F59E0B",
    "600": "#D97706",
    "700": "#4338CA",
  },
  blue: {
    "50": "#EFF6FF",
    "100": "#DBEAFE",
    "300": "#93C5FD",
    "400": "#60A5FA",
    "500": "#3B82F6",
    "600": "#2563EB",
    "700": "#1D4ED8",
  },
  green: {
    "50": "#ECFDF5",
    "100": "#D1FAE5",
    "300": "#6EE7B7",
    "400": "#34D399",
    "500": "#10B981",
    "600": "#059669",
    "700": "#047857",
  },
  orange: {
    "50": "#FFF7ED",
    "100": "#FFEDD5",
    "300": "#FDBA74",
    "400": "#FB923C",
    "500": "#F97316",
    "600": "#EA580C",
    "700": "#C2410C",
  },
  pink: {
    "50": "#FDF2F8",
    "100": "#FCE7F3",
    "300": "#F9A8D4",
    "400": "#F472B6",
    "500": "#F97316",
    "600": "#DB2777",
    "700": "#BE185D",
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  const [theme, setTheme] = useState<Theme>("dark");
  const [accentColor, setAccentColor] = useState<AccentColor>("purple");
  const [currency, setCurrency] = useState<string>("USD");
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({
    budgetAlerts: true,
    goalAlerts: true,
    aiInsights: true,
    monthlyReports: true,
  });
  const [loading, setLoading] = useState(true);

  // Apply visual settings (Theme and Accent Color)
  const applySettings = (t: Theme, c: AccentColor) => {
    if (typeof window === "undefined") return;

    // 1. Resolve and apply theme class
    const root = window.document.documentElement;
    let resolvedTheme: "light" | "dark" = "dark";

    if (t === "system") {
      resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      resolvedTheme = t;
    }

    if (resolvedTheme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }

    // 2. Apply accent color CSS variables
    const palette = ACCENT_COLORS[c] || ACCENT_COLORS.purple;
    Object.entries(palette).forEach(([shade, hex]) => {
      root.style.setProperty(`--brand-${shade}`, hex);
      // Force Tailwind v4 default color mappings to override instantly
      root.style.setProperty(`--color-amber-${shade}`, hex);
    });
  };

  // 1. Initial Load from LocalStorage for instantaneous style rendering
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedTheme = localStorage.getItem("moneyflow_theme") as Theme | null;
    const savedAccent = localStorage.getItem("moneyflow_accent") as AccentColor | null;
    const savedCurrency = localStorage.getItem("moneyflow_currency");

    const activeTheme = savedTheme || "dark";
    const activeAccent = savedAccent || "purple";

    setTheme(activeTheme);
    setAccentColor(activeAccent);
    if (savedCurrency) setCurrency(savedCurrency);

    applySettings(activeTheme, activeAccent);
  }, []);

  // 2. Fetch and synchronize profile settings from DB/Repository upon Auth state resolution
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    SettingsRepository.get(user.uid)
      .then((settings) => {
        if (settings) {
          const t = (settings.theme || "dark") as Theme;
          const a = (settings.accentColor || "purple") as AccentColor;
          // SettingsRepository maps "$" to code, but let's make sure it defaults to USD
          const curr = settings.currency || "USD";
          
          setTheme(t);
          setAccentColor(a);
          setCurrency(curr);
          
          if (settings.notificationPrefs) {
            setNotificationPrefs(settings.notificationPrefs as NotificationPrefs);
          } else {
            // Check if enableNotifications legacy exists
            const val = settings.enableNotifications !== false;
            setNotificationPrefs({
              budgetAlerts: val,
              goalAlerts: val,
              aiInsights: val,
              monthlyReports: val,
            });
          }

          applySettings(t, a);
        }
      })
      .catch((err) => console.error("ThemeContext failed to load Firestore settings:", err))
      .finally(() => setLoading(false));
  }, [user]);

  // 3. Listen to system preference changes when "system" theme is active
  useEffect(() => {
    if (typeof window === "undefined" || theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applySettings("system", accentColor);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, accentColor]);

  // Save updates to state and Repository
  const updatePreferences = async (updates: Partial<UserSettings>) => {
    const nextTheme = updates.theme !== undefined ? (updates.theme as Theme) : theme;
    const nextAccent = updates.accentColor !== undefined ? (updates.accentColor as AccentColor) : accentColor;
    const nextCurrency = updates.currency !== undefined ? updates.currency : currency;
    
    let nextNotifPrefs = notificationPrefs;
    if (updates.notificationPrefs !== undefined) {
      nextNotifPrefs = { ...notificationPrefs, ...updates.notificationPrefs };
    }

    // Update state
    setTheme(nextTheme);
    setAccentColor(nextAccent);
    setCurrency(nextCurrency);
    setNotificationPrefs(nextNotifPrefs);

    // Update style properties
    applySettings(nextTheme, nextAccent);

    // Save to local storage fallbacks
    if (typeof window !== "undefined") {
      localStorage.setItem("moneyflow_theme", nextTheme);
      localStorage.setItem("moneyflow_accent", nextAccent);
      localStorage.setItem("moneyflow_currency", nextCurrency);
    }

    // Save to repository (Firestore / LocalStorage)
    if (user) {
      const dbInput: UserSettings = {
        currency: nextCurrency,
        theme: nextTheme,
        accentColor: nextAccent,
        notificationPrefs: nextNotifPrefs,
        // Preserve other attributes
        enableNotifications: nextNotifPrefs.budgetAlerts,
      };
      await SettingsRepository.save(user.uid, dbInput);
    }
  };

  const formatMoney = (amount: number) => {
    return formatCurrencyValue(amount, currency);
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    updatePreferences({ theme: next });
  };

  return (
    <ThemeContext.Provider value={{ theme, accentColor, currency, notificationPrefs, updatePreferences, loading, formatMoney, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
