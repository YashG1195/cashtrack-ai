"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User as UserIcon, Settings, HelpCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const getInitials = () => {
    if (user.displayName) {
      return user.displayName.includes(" ")
        ? user.displayName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
        : user.displayName.slice(0, 2).toUpperCase();
    }
    return user.email ? user.email.substring(0, 2).toUpperCase() : "U";
  };

  return (
    <div className="relative animate-in fade-in duration-300" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200 text-left focus:outline-none"
        id="user-menu-button"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-white font-medium text-sm border border-amber-400/20 shadow-sm overflow-hidden">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
          ) : (
            getInitials()
          )}
        </div>
        <div className="hidden md:block">
          <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 leading-tight">
            {user.displayName || "User"}
          </p>
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate max-w-[120px]">
            {user.email}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 hidden md:block ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 backdrop-blur-md shadow-lg py-1.5 z-50 overflow-hidden"
          >
            <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800">
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                {user.displayName || "Signed in"}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                {user.email}
              </p>
            </div>
            
            <div className="p-1">
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors text-left"
              >
                <UserIcon className="w-4 h-4 text-neutral-400" />
                <span>My Profile</span>
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors text-left"
              >
                <Settings className="w-4 h-4 text-neutral-400" />
                <span>Settings</span>
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors text-left"
              >
                <HelpCircle className="w-4 h-4 text-neutral-400" />
                <span>Support</span>
              </button>
            </div>

            <div className="border-t border-neutral-100 dark:border-neutral-800 p-1 mt-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
