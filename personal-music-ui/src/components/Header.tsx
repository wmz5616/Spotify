"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

const Header = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  // 监听主内容区的滚动
  useEffect(() => {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;

    const handleScroll = () => {
      setIsScrolled(mainContent.scrollTop > 10); // 滚动超过10px就改变状态
    };

    mainContent.addEventListener("scroll", handleScroll);
    return () => {
      mainContent.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 当用户在搜索框输入时，延迟跳转到搜索页面
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query) {
        router.push(`/search?q=${query}`);
      }
    }, 300); // 延迟300毫秒

    return () => clearTimeout(debounceTimer);
  }, [query, router]);

  return (
    // 1. 使用 sticky 定位让它始终在主内容区顶部
    // 2. 根据 isScrolled 状态动态改变背景色和模糊效果
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

        <div>{/* 用户头像等可以放这里 */}</div>
      </div>
    </header>
  );
};

export default Header;
