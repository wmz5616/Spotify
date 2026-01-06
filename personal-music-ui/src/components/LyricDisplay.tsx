// wmz5616/spotify/Spotify-9066fa224a745f28239d78f8b1c7728a5a21a932/personal-music-ui/src/components/LyricDisplay.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { parseLRC, type LyricLine } from "@/lib/lrc-parser";
import clsx from "clsx";

// 间奏动画组件，保持不变
const Interlude = () => (
  <div className="flex justify-center items-center gap-1.5 h-full">
    {[0, 1, 2, 3].map((i) => (
      <span
        key={i}
        className="w-1.5 h-5 bg-neutral-500 rounded-full animate-music-bars"
        style={{ animationDelay: `${i * 150}ms`, animationDuration: "1.5s" }}
      />
    ))}
  </div>
);

const LyricDisplay = () => {
  const { currentSong, currentTime } = usePlayerStore();
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [scrollY, setScrollY] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const lyrics: LyricLine[] = useMemo(() => {
    return currentSong?.lyrics ? parseLRC(currentSong.lyrics) : [];
  }, [currentSong?.lyrics]);

  useEffect(() => {
    if (!lyrics.length) return;
    const newIndex = lyrics.findIndex(
      (line, i) =>
        currentTime >= line.time &&
        (i === lyrics.length - 1 || currentTime < lyrics[i + 1].time)
    );
    if (newIndex !== -1) {
      setCurrentLineIndex(newIndex);
    }
  }, [currentTime, lyrics]);

  useEffect(() => {
    if (currentLineIndex > -1 && containerRef.current && listRef.current) {
      const activeLineElement = listRef.current.children[
        currentLineIndex
      ] as HTMLLIElement;
      if (activeLineElement) {
        const containerHeight = containerRef.current.clientHeight;
        const targetOffset =
          activeLineElement.offsetTop - containerHeight * 0.4; // 滚动到容器 40% 的位置
        setScrollY(targetOffset);
      }
    }
  }, [currentLineIndex]);

  useEffect(() => {
    setCurrentLineIndex(-1);
    setScrollY(0);
  }, [currentSong?.id]);

  if (lyrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-400 text-2xl font-semibold">
        <p>No lyrics for this song.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full overflow-hidden relative">
      {/* 歌词列表本身不做滚动，只作为定位参考 */}
      <ul
        ref={listRef}
        style={{
          // 使用 CSS transform 实现硬件加速的丝滑滚动
          transform: `translateY(-${scrollY}px)`,
          // 添加平滑过渡效果
          transition: "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)",
        }}
        className="w-full px-4 md:px-8"
      >
        {/* 顶部和底部的空白占位 */}
        <div style={{ height: "40vh" }} />
        {lyrics.map((line, index) => {
          const isActive = currentLineIndex === index;
          return (
            <li
              key={index}
              className={clsx(
                "py-3 text-center transition-all duration-500 ease-in-out",
                isActive
                  ? "text-white text-4xl font-bold opacity-100"
                  : "text-neutral-400 text-3xl font-semibold opacity-50"
              )}
            >
              {line.text || <Interlude />}
            </li>
          );
        })}
        <div style={{ height: "60vh" }} />
      </ul>
    </div>
  );
};

export default LyricDisplay;
