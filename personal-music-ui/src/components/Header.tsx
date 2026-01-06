"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

const Header = () => {
  const router = useRouter();
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
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, router]);

  return (
    <header
      className={`sticky top-0 z-40 p-4 transition-colors duration-300 ${
        isScrolled ? "bg-black/80 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="bg-black/50 p-2 rounded-full hover:bg-black/80 transition"
            aria-label="Go back"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={() => router.forward()}
            className="bg-black/50 p-2 rounded-full hover:bg-black/80 transition"
            aria-label="Go forward"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="What do you want to listen to?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-80 bg-neutral-800/80 rounded-full py-3 pl-12 pr-4 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>

        <div>{}</div>
      </div>
    </header>
  );
};

export default Header;
