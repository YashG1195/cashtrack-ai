"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { NotificationRepository, AppNotification } from "@/repositories/notification.repository";
import UserMenu from "./UserMenu";
import { Menu, Sun, Moon, Search, Bell, ArrowRight } from "lucide-react";
import GlobalSearch from "./GlobalSearch";

interface NavbarProps {
  setMobileOpen: (open: boolean) => void;
}

export default function Navbar({ setMobileOpen }: NavbarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return;

    const unsubscribe = NotificationRepository.subscribe(
      user.uid,
      (list) => {
        setNotifications(list);
      },
      (err) => console.error("Notifications subscription error:", err)
    );

    return () => unsubscribe();
  }, [user]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await NotificationRepository.markAllRead(user.uid);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!user) return;
    try {
      if (!notif.isRead) {
        await NotificationRepository.updateReadStatus(user.uid, notif.id, true);
      }
      setIsDropdownOpen(false);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const formatTime = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const getPageTitle = () => {
    if (pathname.startsWith("/dashboard/advisor")) return "AI Financial Advisor";
    if (pathname.startsWith("/dashboard/analytics")) return "Analytics";
    if (pathname.startsWith("/dashboard/budgets")) return "Budgets";
    if (pathname.startsWith("/dashboard/savings")) return "Savings Goals";
    if (pathname.startsWith("/dashboard/notifications")) return "Notification Center";
    if (pathname.startsWith("/dashboard/reports")) return "Monthly Reports";
    if (pathname.startsWith("/dashboard/settings")) return "Settings";
    if (pathname.startsWith("/dashboard/transactions")) return "Transactions";
    return "Dashboard";
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between w-full h-16 px-6 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 transition-colors duration-200">
      {/* Left section: Hamburger (mobile) + Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-500 md:hidden transition-colors focus:outline-none"
          aria-label="Open navigation sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-white tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right section: Search + Notifications + Theme Toggle + User Dropdown */}
      <div className="flex items-center gap-4">
        {/* Global Search Component */}
        <GlobalSearch />

        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-500 dark:text-neutral-400 transition-colors relative cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 flex items-center justify-center bg-amber-500 text-white text-[9px] font-extrabold rounded-full border border-white dark:border-neutral-950 shadow-sm animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-xs font-bold text-neutral-900 dark:text-white">Recent Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/50">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer flex flex-col gap-0.5 ${
                        !notif.isRead ? "bg-amber-500/5 dark:bg-amber-500/5" : ""
                      }`}
                    >
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate pr-2">
                          {notif.title}
                        </span>
                        <span className="text-[9px] text-neutral-400 whitespace-nowrap">
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-neutral-100 dark:border-neutral-800">
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center justify-center gap-1 w-full py-2.5 text-center text-[10px] font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <span>View All Notifications</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-500 dark:text-neutral-400 transition-colors focus:outline-none"
          aria-label="Toggle theme mode"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5 text-amber-500" />
          ) : (
            <Moon className="w-5 h-5 text-amber-600" />
          )}
        </button>

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  );
}
