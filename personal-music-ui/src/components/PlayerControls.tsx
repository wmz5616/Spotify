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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerStore } from "@/store/usePlayerStore"; // 确保导入 usePlayerStore
import ProgressBar from "./ProgressBar";
import Image from "next/image";
import Link from "next/link";
import QueueButton from "./QueueButton";

const PlayerControls = () => {
  const {
    isPlaying,
    togglePlayPause,
    currentSong,
    playNextSong,
    playPreviousSong,
    playMode,
    toggleShuffle,
    toggleRepeat,
    toggleQueue, // <-- 关键：这里要导入 toggleQueue 方法
  } = usePlayerStore();

  if (!currentSong) {
    return (
      <footer className="col-start-1 col-span-2 bg-neutral-950 h-[90px] px-4 border-t border-neutral-800 flex items-center justify-center">
        <div className="text-neutral-500">Select a song to play</div>
      </footer>
    );
  }

  const albumArtUrl = currentSong.album?.id
    ? `http://localhost:3001/static/covers/${currentSong.album.id}.jpg`
    : "/placeholder.jpg";

  const renderRepeatIcon = () => {
    if (playMode === "repeat-one") {
      return <Repeat1 size={18} />;
    }
    return <Repeat size={18} />;
  };

  return (
    <footer className="col-start-1 col-span-2 bg-neutral-950 h-[90px] px-4 border-t border-neutral-800 grid grid-cols-3 items-center">
      {/* 左侧：当前歌曲信息 (带动画，且可点击) */}
      <div className="flex items-center gap-3 truncate">
        <AnimatePresence mode="wait">
          {currentSong.album && (
            <motion.div
              key={currentSong.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex items-center gap-3 truncate"
            >
              {/* 修改这里：将整个歌曲信息区域包裹在一个可点击的 div 中 */}
              <div
                onClick={toggleQueue} // <-- 关键：点击时触发 toggleQueue
                className="flex items-center gap-3 truncate cursor-pointer hover:bg-neutral-800/50 p-1 rounded-md transition-colors"
                title="Expand Now Playing"
              >
                <Image
                  src={albumArtUrl}
                  alt={currentSong.album.title}
                  width={56}
                  height={56}
                  className="rounded-md flex-shrink-0" // 确保图片不被挤压
                />
                <div className="truncate">
                  <h3 className="font-semibold text-white truncate text-sm">
                    {currentSong.title}
                  </h3>
                  <div className="text-xs text-neutral-400 truncate">
                    {currentSong.album?.artists.map((artist, index) => (
                      <React.Fragment key={artist.id}>
                        {/* 这里的Link仍然保留，但点击专辑信息区域会优先触发toggleQueue */}
                        <Link
                          href={`/artist/${artist.id}`}
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()} // 阻止Link的点击事件冒泡到父级div
                        >
                          {artist.name}
                        </Link>
                        {index < currentSong.album!.artists.length - 1 && ", "}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 中间：播放控制和进度条 (不变) */}
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleShuffle}
            className={`transition ${
              playMode === "shuffle" ? "text-green-500" : "text-neutral-400"
            } hover:text-white`}
            title="Shuffle"
          >
            <Shuffle size={18} />
          </button>
          <button
            onClick={playPreviousSong}
            className="text-neutral-400 hover:text-white transition"
            title="Previous"
          >
            <SkipBack size={20} fill="currentColor" />
          </button>
          <button
            onClick={togglePlayPause}
            className="bg-white text-black rounded-full p-3 flex items-center justify-center hover:scale-105 transition-transform focus:outline-none"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause size={24} fill="black" />
            ) : (
              <Play size={24} fill="black" className="translate-x-0.5" />
            )}
          </button>
          <button
            onClick={playNextSong}
            className="text-neutral-400 hover:text-white transition"
            title="Next"
          >
            <SkipForward size={20} fill="currentColor" />
          </button>
          <button
            onClick={toggleRepeat}
            className={`transition ${
              playMode.includes("repeat")
                ? "text-green-500"
                : "text-neutral-400"
            } hover:text-white`}
            title="Repeat"
          >
            {renderRepeatIcon()}
          </button>
        </div>
        <ProgressBar />
      </div>

      {/* 右侧：添加 QueueButton */}
      <div className="flex items-center justify-end gap-4">
        <QueueButton />
      </div>
    </footer>
  );
};

export default PlayerControls;
