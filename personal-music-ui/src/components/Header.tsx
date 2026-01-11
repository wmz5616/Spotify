"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Search, ChevronLeft, ChevronRight, User, Bell } from "lucide-react";
import { clsx } from "clsx";

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

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
      <div className="flex items-center gap-2 min-w-[80px]">
        <button
          onClick={() => router.back()}
          className="bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition disabled:opacity-50 cursor-pointer"
          title="Go back"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={() => router.forward()}
          className="bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition disabled:opacity-50 cursor-pointer"
          title="Go forward"
        >
          <ChevronRight size={22} />
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
        <button className="text-neutral-400 hover:text-white transition p-2 hover:bg-neutral-800 rounded-full">
          <Bell size={20} />
        </button>

        <button className="bg-neutral-800 p-1.5 rounded-full hover:scale-105 transition border-2 border-black">
          <div className="w-7 h-7 bg-orange-600 rounded-full flex items-center justify-center">
            <span className="font-bold text-xs text-black">U</span>
          </div>
        </button>
      </div>
    </header>
  );
};

export default Header;
