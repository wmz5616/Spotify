"use client";

import React from "react";
import { Play, Pause } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import ProgressBar from "./ProgressBar"; // 1. 导入进度条组件

const PlayerControls = () => {
  const { isPlaying, togglePlayPause, currentSong } = usePlayerStore();

  if (!currentSong) {
    return (
      <footer className="col-start-1 col-span-2 bg-neutral-950 h-[90px] px-4 border-t border-neutral-800 flex items-center justify-center">
        <div className="text-neutral-500">Select a song to play</div>
      </footer>
    );
  }

  return (
    <footer className="col-start-1 col-span-2 bg-neutral-950 h-[90px] px-4 border-t border-neutral-800 grid grid-cols-3 items-center">
      {/* 左侧：当前歌曲信息 */}
      <div className="text-white">
        <h3 className="font-bold truncate">{currentSong.title}</h3>
        <p className="text-sm text-neutral-400">Artist Name</p>
      </div>

      {/* 中间：播放控制和进度条 */}
      <div className="flex flex-col items-center justify-center gap-2">
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
        <ProgressBar /> {/* 2. 在这里使用进度条组件 */}
      </div>

      {/* 右侧：音量等控制（占位） */}
      <div>{/* Volume controls can go here */}</div>
    </footer>
  );
};

export default PlayerControls;
