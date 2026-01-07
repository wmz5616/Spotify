"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { parseLRC, type LyricLine } from "@/lib/lrc-parser";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useColor } from "color-thief-react";

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

const DynamicBackground = React.memo(({ coverUrl }: { coverUrl: string }) => {
  const { data: dominantColor } = useColor(coverUrl, "hex", {
    crossOrigin: "anonymous",
    quality: 10,
  });

  const activeColor = dominantColor || "#404040";

  return (
    <>
      <div className="absolute inset-0 z-0 bg-neutral-950 transition-colors duration-1000" />

      <motion.div
        className="absolute inset-0 z-0 opacity-40 blur-[80px]"
        animate={{
          background: `radial-gradient(circle at 50% 30%, ${activeColor}, transparent 70%)`,
        }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute inset-0 z-0 opacity-30 blur-[80px]"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"],
          background: [
            `radial-gradient(circle at 20% 80%, ${activeColor}, transparent 50%)`,
            `radial-gradient(circle at 80% 20%, ${activeColor}, transparent 50%)`,
          ],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
    </>
  );
});

DynamicBackground.displayName = "DynamicBackground";

const LyricDisplay = () => {
  const { currentSong, currentTime, seek } = usePlayerStore();
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [scrollY, setScrollY] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const albumCover =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (currentSong?.album as any)?.coverPath || "/placeholder.jpg";

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
          activeLineElement.offsetTop - containerHeight * 0.4;
        setScrollY(targetOffset);
      }
    }
  }, [currentLineIndex]);

  useEffect(() => {
    setCurrentLineIndex(-1);
    setScrollY(0);
  }, [currentSong?.id]);

  return (
    <div ref={containerRef} className="h-full overflow-hidden relative">
      <DynamicBackground coverUrl={albumCover} />

      <div
        className="relative z-10 w-full h-full"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
        }}
      >
        {lyrics.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-400 space-y-4">
            <p className="text-2xl font-semibold">No lyrics available</p>
          </div>
        ) : (
          <motion.div
            key={currentSong?.id}
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full"
          >
            <ul
              ref={listRef}
              style={{
                transform: `translateY(-${scrollY}px)`,
                transition: "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)",
              }}
              className="w-full px-4 md:px-8"
            >
              <div style={{ height: "40vh" }} />
              {lyrics.map((line, index) => {
                const isActive = currentLineIndex === index;
                const parts = line.text.split("\n");
                const originalText = parts[0];
                const translationText = parts.length > 1 ? parts[1] : null;

                return (
                  <li
                    key={index}
                    onClick={() => seek(line.time)}
                    className={clsx(
                      "py-4 flex flex-col items-center gap-1 transition-all duration-500 ease-in-out cursor-pointer",
                      isActive
                        ? "opacity-100 blur-0 scale-105"
                        : "opacity-50 blur-[1px] hover:blur-0 hover:opacity-80"
                    )}
                    style={{
                      textShadow: isActive
                        ? "0 0 15px rgba(255, 255, 255, 0.6), 0 0 30px rgba(255, 255, 255, 0.3)"
                        : "none",
                    }}
                  >
                    <span
                      className={clsx(
                        "font-bold text-center",
                        isActive
                          ? "text-white text-3xl md:text-4xl"
                          : "text-neutral-300 text-2xl md:text-3xl"
                      )}
                    >
                      {originalText || <Interlude />}
                    </span>

                    {translationText && (
                      <span
                        className={clsx(
                          "font-medium text-center",
                          isActive
                            ? "text-neutral-200 text-lg md:text-xl"
                            : "text-neutral-400 text-base md:text-lg"
                        )}
                      >
                        {translationText}
                      </span>
                    )}
                  </li>
                );
              })}
              <div style={{ height: "60vh" }} />
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LyricDisplay;
