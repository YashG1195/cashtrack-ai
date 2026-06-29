"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { NotificationRepository, AppNotification } from "@/repositories/notification.repository";
import { 
  Bell, 
  Trash2, 
  CheckSquare, 
  CheckCircle, 
  Wallet, 
  Target, 
  Sparkles, 
  Info,
  Clock,
  Check
} from "lucide-react";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<"all" | "budget" | "savings" | "ai" | "system">("all");

  // Subscribe to real-time updates
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleToggleRead = async (notif: AppNotification) => {
    if (!user) return;
    try {
      await NotificationRepository.updateReadStatus(user.uid, notif.id, !notif.isRead);
    } catch (err) {
      console.error("Failed to update notification status:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await NotificationRepository.delete(user.uid, id);
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await NotificationRepository.markAllRead(user.uid);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const handleClearAll = async () => {
    if (!user) return;
    if (!confirm("Are you sure you want to clear all notifications?")) return;
    try {
      for (const notif of notifications) {
        await NotificationRepository.delete(user.uid, notif.id);
      }
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  const filteredNotifications = notifications.filter(
    (n) => filter === "all" || n.type === filter
  );

  const getIcon = (type: string) => {
    switch (type) {
      case "budget":
        return <Wallet className="w-4 h-4 text-emerald-500" />;
      case "savings":
        return <Target className="w-4 h-4 text-purple-500" />;
      case "ai":
        return <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500/10" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "budget":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "savings":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "ai":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title & Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Notification Center</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            You have {unreadCount} unread alert{unreadCount !== 1 && "s"} across budgets, goals, and AI insights.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-xs font-semibold text-red-600 dark:text-red-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {(["all", "budget", "savings", "ai", "system"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3.5 h-8 rounded-full text-xs font-semibold border capitalize transition-all cursor-pointer whitespace-nowrap ${
              filter === type
                ? "bg-amber-600 border-amber-600 text-white shadow-sm"
                : "border-neutral-200 dark:border-neutral-800 bg-transparent text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700"
            }`}
          >
            {type === "all" ? "All Alerts" : type === "ai" ? "AI Insights" : type}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl p-16 text-center bg-white dark:bg-neutral-950/10">
          <Bell className="w-10 h-10 mx-auto text-neutral-400 dark:text-neutral-500 mb-3" />
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">All caught up!</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
            You don't have any notifications under the "{filter === "all" ? "All" : filter}" filter right now.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border transition-all duration-200 flex items-start gap-4 hover:shadow-sm ${
                !notif.isRead
                  ? "bg-amber-500/5 border-amber-500/20 shadow-[0_0_15px_rgba(79,70,229,0.02)]"
                  : "bg-white dark:bg-neutral-950/40 border-neutral-200 dark:border-neutral-800/80"
              }`}
            >
              {/* Type Icon Badge */}
              <div className={`p-2.5 rounded-xl border flex-shrink-0 ${getTypeStyle(notif.type)}`}>
                {getIcon(notif.type)}
              </div>

              {/* Message Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <span>{notif.title}</span>
                    {!notif.isRead && (
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    )}
                  </h3>
                  <span className="text-[10px] text-neutral-400 flex items-center gap-1 whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    {notif.createdAt.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {notif.message}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0 self-center">
                <button
                  onClick={() => handleToggleRead(notif)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    notif.isRead
                      ? "text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:text-amber-600 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                      : "text-amber-600 border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 hover:text-amber-700"
                  }`}
                  title={notif.isRead ? "Mark as unread" : "Mark as read"}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(notif.id)}
                  className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-red-500 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                  title="Delete Alert"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
