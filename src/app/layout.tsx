import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import DemoModeBanner from "@/components/layout/DemoModeBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#D97706",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "MoneyFlow AI - Smart Personal Finance Tracker",
  description: "Track your income, expenses, budgets, and savings goals while receiving intelligent AI financial insights. Dark mode first, Linear-inspired design.",
  manifest: "/manifest.json",
  icons: {
    icon: "/window.svg",
    apple: "/globe.svg",
  },
  openGraph: {
    type: "website",
    url: "https://moneyflow-ai.vercel.app",
    title: "MoneyFlow AI - Smart Personal Finance",
    description: "Your intelligent financial companion for budgeting, tracking, and insights.",
    siteName: "MoneyFlow AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "MoneyFlow AI - Smart Personal Finance",
    description: "Your intelligent financial companion for budgeting, tracking, and insights.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans h-full bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 antialiased transition-colors duration-200`}>
        <AuthProvider>
          <ThemeProvider>
            <DemoModeBanner />
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

