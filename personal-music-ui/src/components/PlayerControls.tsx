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
import { usePlayerStore } from "@/store/usePlayerStore";
import ProgressBar from "./ProgressBar";
import Image from "next/image";
import Link from "next/link";

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
  } = usePlayerStore();

  if (!currentSong) {
    return (
      <footer className="col-start-1 col-span-2 bg-neutral-950 h-[90px] px-4 border-t border-neutral-800 flex items-center justify-center">
        <div className="text-neutral-500">Select a song to play</div>
      </footer>
    );
  }

  const albumArtUrl = currentSong.album?.id
    ? `http://localhost:3000/static/covers/${currentSong.album.id}.jpg`
    : "/placeholder.jpg";

  const renderRepeatIcon = () => {
    if (playMode === "repeat-one") {
      return <Repeat1 size={18} />;
    }
    return <Repeat size={18} />;
  };

  return (
    <footer className="col-start-1 col-span-2 bg-neutral-950 h-[90px] px-4 border-t border-neutral-800 grid grid-cols-3 items-center">
      {/* 左侧：当前歌曲信息 */}
      <div className="flex items-center gap-3 truncate">
        {currentSong.album && (
          <Image
            src={albumArtUrl}
            alt={currentSong.album.title}
            width={56}
            height={56}
            className="rounded-md"
          />
        )}
        <div className="truncate">
          <h3 className="font-semibold text-white truncate text-sm">
            {currentSong.title}
          </h3>
          <div className="text-xs text-neutral-400 truncate">
            {currentSong.album?.artists.map((artist, index) => (
              <React.Fragment key={artist.id}>
                <Link href={`/artist/${artist.id}`} className="hover:underline">
                  {artist.name}
                </Link>
                {index < currentSong.album!.artists.length - 1 && ", "}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* 中间：播放控制和进度条 */}
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

      {/* 右侧：音量等控制（占位） */}
      <div>{/* Volume controls can go here */}</div>
    </footer>
  );
};

export default PlayerControls;
