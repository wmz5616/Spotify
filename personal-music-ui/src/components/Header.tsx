"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, Bell } from "lucide-react";
import { clsx } from "clsx";
import UserMenu from "./UserMenu";
import NotificationPopover from "./NotificationPopover";
import { useNotificationStore } from "@/store/useNotificationStore";

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const unreadCount = useNotificationStore(state => state.getUnreadCount());
  const startPolling = useNotificationStore(state => state.startPolling);
  const stopPolling = useNotificationStore(state => state.stopPolling);

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  useEffect(() => {

    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;

    const handleScroll = () => {
      setIsScrolled(mainContent.scrollTop > 10);
    };

    mainContent.addEventListener("scroll", handleScroll);
    return () => {
      mainContent.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query) {
        router.push(`/search?q=${query}`);
      }
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [query, router]);

  const showSearchBar = pathname === "/search";

  return (
    <header
      className={clsx(
        "sticky top-0 z-50 h-16 px-6 flex items-center justify-between transition-all duration-400 ease-in-out",
        isScrolled
          ? "bg-[#121212]/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      )}
    >
      <div className="flex items-center gap-4 min-w-[80px]">
        <button
          onClick={() => router.back()}
          className="rounded-full bg-black/40 flex items-center justify-center w-8 h-8 transition hover:bg-black/60 border border-transparent hover:border-white/10"
          title="Go Back"
        >
          <ChevronLeft size={22} className="text-white translate-x-[-1px]" />
        </button>
        <button
          onClick={() => router.forward()}
          className="rounded-full bg-black/40 flex items-center justify-center w-8 h-8 transition hover:bg-black/60 border border-transparent hover:border-white/10"
          title="Go Forward"
        >
          <ChevronRight size={22} className="text-white translate-x-[1px]" />
        </button>
      </div>

      <div className="flex-1 max-w-md px-4">
        {showSearchBar ? (
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-white transition-colors">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="What do you want to play?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#242424] rounded-full py-3 pl-10 pr-4 text-sm text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all border border-transparent focus:border-white/10"
              autoFocus
            />
          </div>
        ) : (
          <div />
        )}
      </div>

      <div className="flex items-center gap-4 min-w-[80px] justify-end">
        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="text-neutral-400 hover:text-white transition p-2 hover:bg-neutral-800 rounded-full relative"
          >
            <Bell size={20} />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-[#121212]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : (
              <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-breathe" />
            )}
          </button>
          <NotificationPopover
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
          />
        </div>

        <UserMenu />
      </div>
    </header>
  );
};

export default Header;

