"use client";
import { usePlayerStore } from "@/store/usePlayerStore";
import React from "react";

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const ProgressBar = () => {
  const { currentTime, duration, seek } = usePlayerStore();

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(event.target.value));
  };

  return (
    <div className="flex items-center gap-2 text-xs text-neutral-400">
      <span>{formatTime(currentTime)}</span>
      <input
        type="range"
        min="0"
        max={duration || 0}
        value={currentTime}
        onChange={handleSeek}
        className="w-full h-1 bg-neutral-600 rounded-lg appearance-none cursor-pointer accent-white"
      />
      <span>{formatTime(duration)}</span>
    </div>
  );
};

export default ProgressBar;
