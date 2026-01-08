"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { parseLRC, type LyricLine } from "@/lib/lrc-parser";
import clsx from "clsx";
import { motion } from "framer-motion";
import { VariableSizeList as List } from "react-window";

const Interlude = () => (
  <div className="flex justify-center items-center gap-1.5 h-full opacity-80">
    {[0, 1, 2, 3].map((i) => (
      <span
        key={i}
        className="w-1.5 h-8 bg-white rounded-full animate-music-bars shadow-[0_0_15px_rgba(255,255,255,0.9)]"
        style={{ animationDelay: `${i * 150}ms`, animationDuration: "1.2s" }}
      />
    ))}
  </div>
);

const LyricDisplay = () => {
  const { currentSong, currentTime } = usePlayerStore();
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>(null);
  const outerRef = useRef<HTMLElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const lyrics: LyricLine[] = useMemo(() => {
    return currentSong?.lyrics ? parseLRC(currentSong.lyrics) : [];
  }, [currentSong?.lyrics]);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

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

  const getItemHeight = useCallback(
    (index: number, activeIndex: number) => {
      if (index === 0 || index === lyrics.length + 1) {
        return containerSize.height / 2;
      }
      const lyricIndex = index - 1;
      const line = lyrics[lyricIndex];
      if (!line) return 100;

      const isActive = lyricIndex === activeIndex;
      const hasTranslation = line.text.includes("\n");

      let size = 90;
      if (isActive) size += 100;
      if (hasTranslation) size += 40;
      return size;
    },
    [lyrics, containerSize.height]
  );

  useEffect(() => {
    if (listRef.current && outerRef.current && currentLineIndex !== -1) {
      listRef.current.resetAfterIndex(0);
      const targetIndex = currentLineIndex + 1;
      let offset = 0;
      for (let i = 0; i < targetIndex; i++) {
        offset += getItemHeight(i, currentLineIndex);
      }
      const targetItemHeight = getItemHeight(targetIndex, currentLineIndex);
      const centerOffset =
        offset + targetItemHeight / 2 - containerSize.height / 2;

      outerRef.current.scrollTo({
        top: centerOffset,
        behavior: "smooth",
      });
    }
  }, [currentLineIndex, containerSize.height, getItemHeight]);

  useEffect(() => {
    setCurrentLineIndex(-1);
    if (outerRef.current) {
      outerRef.current.scrollTo(0, 0);
    }
  }, [currentSong?.id]);

  const itemSize = (index: number) => getItemHeight(index, currentLineIndex);

  return (
    <div className="h-full overflow-hidden relative select-none font-sans">
      <div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, black 0%, transparent 15%, transparent 85%, black 100%)",
        }}
      />

      <div className="relative z-10 w-full h-full">
        {lyrics.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-600 space-y-6">
            <p className="text-3xl font-bold tracking-[0.3em] uppercase glow-text-md">
              Pure Music
            </p>
          </div>
        ) : (
          <motion.div
            key={currentSong?.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="w-full h-full"
            ref={containerRef}
          >
            {containerSize.height > 0 && (
              <List
                ref={listRef}
                outerRef={outerRef}
                height={containerSize.height}
                width={containerSize.width}
                itemCount={lyrics.length + 2}
                itemSize={itemSize}
                className="lyric-list [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                itemData={lyrics}
                style={{ scrollBehavior: "smooth" }}
              >
                {({ index, style }) => {
                  if (index === 0 || index === lyrics.length + 1) {
                    return <div style={style} />;
                  }

                  const lyricIndex = index - 1;
                  const line = lyrics[lyricIndex];
                  if (!line) return null;

                  const isActive = currentLineIndex === lyricIndex;
                  const parts = line.text.split("\n");
                  const originalText = parts[0];
                  const translationText = parts.length > 1 ? parts[1] : null;

                  return (
                    <div
                      style={style}
                      className="flex items-center justify-center w-full px-8 py-4"
                    >
                      <div
                        className={clsx(
                          "flex flex-col items-center gap-5 transition-all duration-700 ease-[cubic-bezier(0.25,0.4,0.25,1)] w-full max-w-[95%]",
                          isActive
                            ? "opacity-100 scale-105 blur-0 origin-center"
                            : "opacity-40 scale-95 blur-[1px] origin-center"
                        )}
                        style={{
                          textShadow: isActive
                            ? "0 0 30px rgba(255, 255, 255, 0.7), 0 0 80px rgba(255, 255, 255, 0.4)"
                            : "none",
                        }}
                      >
                        <span
                          className={clsx(
                            "text-center leading-tight transition-all duration-700 break-words w-full",
                            isActive
                              ? "text-white text-4xl md:text-6xl font-black tracking-tight"
                              : "text-neutral-300 text-2xl md:text-3xl font-bold"
                          )}
                        >
                          {originalText || <Interlude />}
                        </span>

                        {translationText && (
                          <span
                            className={clsx(
                              "text-center transition-all duration-700 font-medium tracking-wide break-words w-full",
                              isActive
                                ? "text-neutral-200 text-xl md:text-2xl"
                                : "text-neutral-500 text-base md:text-lg"
                            )}
                          >
                            {translationText}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }}
              </List>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LyricDisplay;
