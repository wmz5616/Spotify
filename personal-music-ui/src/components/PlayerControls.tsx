"use client";

import React from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerStore } from "@/store/usePlayerStore";
import ProgressBar from "./ProgressBar";
import Image from "next/image";
import Link from "next/link";
import QueueButton from "./QueueButton";
import FullScreenPlayer from "./FullScreenPlayer";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const PlayerControls = () => {
  const {
    isPlaying,
    togglePlayPause,
    currentSong,
    playNext,
    playPrev,
    playMode,
    toggleShuffle,
    toggleRepeat,
    toggleFullScreen,
  } = usePlayerStore();

  if (!currentSong) {
    return (
      <footer className="col-start-1 col-span-2 bg-neutral-950 h-[90px] px-4 border-t border-neutral-800 flex items-center justify-center">
        <div className="text-neutral-500">Select a song to play</div>
      </footer>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const albumData = currentSong.album as any;
  const albumArtUrl = albumData?.id
    ? `${API_BASE_URL}/api/covers/${albumData.id}?size=128`
    : "/placeholder.jpg";

  const renderRepeatIcon = () => {
    if (playMode === "repeat-one") {
      return <Repeat1 size={18} />;
    }
    return <Repeat size={18} />;
  };

  return (
    <>
      <footer className="col-start-1 col-span-2 bg-neutral-950 h-[90px] px-4 border-t border-neutral-800 grid grid-cols-3 items-center z-50 relative">
        <div className="flex items-center gap-3 truncate">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSong.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 truncate"
            >
              <div
                onClick={toggleFullScreen}
                className="flex items-center gap-3 truncate cursor-pointer hover:bg-neutral-800/50 p-1.5 rounded-md transition-colors group"
                title="Expand Player"
              >
                <motion.div
                  layoutId={`album-cover-${currentSong.id}`}
                  className="relative w-14 h-14 flex-shrink-0 shadow-md z-50 overflow-hidden rounded-md"
                >
                  <Image
                    src={albumArtUrl}
                    alt={currentSong.title || "Album Art"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </motion.div>

                <div className="truncate flex flex-col justify-center">
                  <h3 className="font-semibold text-white truncate text-sm group-hover:text-green-400 transition-colors">
                    {currentSong.title}
                  </h3>
                  <div className="text-xs text-neutral-400 truncate">
                    {albumData?.artists ? (
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      albumData.artists.map((artist: any, index: number) => (
                        <React.Fragment key={artist.id}>
                          <Link
                            href={`/artist/${artist.id}`}
                            className="hover:underline hover:text-white transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {artist.name}
                          </Link>
                          {index < albumData.artists.length - 1 && ", "}
                        </React.Fragment>
                      ))
                    ) : (
                      <span>{currentSong.artist || "Unknown Artist"}</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col items-center justify-center gap-2 w-full max-w-[45%] mx-auto">
          <div className="flex items-center gap-6">
            <button
              onClick={toggleShuffle}
              className={`transition-colors hover:scale-105 active:scale-95 ${
                playMode === "shuffle"
                  ? "text-green-500"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Shuffle"
            >
              <Shuffle size={18} />
            </button>

            <button
              onClick={playPrev}
              className="text-neutral-400 hover:text-white transition-colors hover:scale-105 active:scale-95"
              title="Previous"
            >
              <SkipBack size={22} fill="currentColor" />
            </button>

            <button
              onClick={togglePlayPause}
              className="bg-white text-black rounded-full p-2.5 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause size={22} fill="black" />
              ) : (
                <Play size={22} fill="black" className="translate-x-0.5" />
              )}
            </button>

            <button
              onClick={playNext}
              className="text-neutral-400 hover:text-white transition-colors hover:scale-105 active:scale-95"
              title="Next"
            >
              <SkipForward size={22} fill="currentColor" />
            </button>

            <button
              onClick={toggleRepeat}
              className={`transition-colors hover:scale-105 active:scale-95 ${
                playMode.includes("repeat")
                  ? "text-green-500"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Repeat"
            >
              {renderRepeatIcon()}
            </button>
          </div>

          <ProgressBar />
        </div>

        <div className="flex items-center justify-end gap-4">
          <QueueButton />

          <button
            onClick={toggleFullScreen}
            className="text-neutral-400 hover:text-white transition-colors hover:scale-105 active:scale-95 p-2"
            title="Expand to Full Screen"
          >
            <ChevronUp size={20} />
          </button>
        </div>
      </footer>

      <FullScreenPlayer />
    </>
  );
};

export default PlayerControls;
