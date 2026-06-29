"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Wallet, 
  Target, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Sparkles,
  History,
  Bell,
  FileText
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Transactions", href: "/dashboard/transactions", icon: History },
    { name: "AI Advisor", href: "/dashboard/advisor", icon: Sparkles },
    { name: "Analytics", href: "/dashboard/analytics", icon: TrendingUp },
    { name: "Budgets", href: "/dashboard/budgets", icon: Wallet },
    { name: "Savings Goals", href: "/dashboard/savings", icon: Target },
    { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
    { name: "Reports", href: "/dashboard/reports", icon: FileText },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors duration-200">
      {/* Brand logo */}
      <div className={`p-5 flex items-center ${collapsed ? "justify-center" : "justify-between"} border-b border-neutral-100 dark:border-neutral-900`}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg tracking-tight bg-gradient-to-r from-neutral-950 via-neutral-800 to-amber-600 dark:from-white dark:via-neutral-200 dark:to-amber-400 bg-clip-text text-transparent">
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500/20" />
            <span>MoneyFlow AI</span>
          </Link>
        )}
        {collapsed && (
          <Sparkles className="w-6 h-6 text-amber-500 fill-amber-500/20" />
        )}
        
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-500 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                isActive 
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-l-2 border-amber-500" 
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-900/60 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                isActive ? "text-amber-600 dark:text-amber-400" : "text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-neutral-200"
              }`} />
              
              {!collapsed && <span>{item.name}</span>}
              
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 whitespace-nowrap">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

    </div>
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Content */}
      <div className={`fixed inset-y-0 left-0 w-64 z-50 transform md:hidden transition-transform duration-300 ease-out ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {sidebarContent}
      </div>

      {/* Desktop Sidebar (Permanent) */}
      <div className={`hidden md:block h-screen flex-shrink-0 transition-all duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-64"
      }`}>
        {sidebarContent}
      </div>
    </>
  );
}
