"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  ChevronUp,
  Heart,
  Mic2,
  ListMusic,
  MonitorSpeaker,
  Maximize2,
} from "lucide-react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useToastStore } from "@/store/useToastStore";
import ProgressBar from "./ProgressBar";
import VolumeControl from "./VolumeControl";
import FullScreenPlayer from "./FullScreenPlayer";
import { getAuthenticatedSrc } from "@/lib/api-client";
import { cn } from "@/lib/utils";

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
  const { addToast } = useToastStore();

  const [isMounted, setIsMounted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLikeToggle = () => {
    setIsLiked(!isLiked);
    addToast(isLiked ? "Removed from Liked Songs" : "Added to Liked Songs");
  };

  if (!isMounted)
    return <div className="h-[90px] bg-black border-t border-[#282828]" />;

  if (!currentSong) {
    return (
      <footer className="fixed bottom-0 z-50 w-full h-[90px] bg-black border-t border-[#282828] px-4 flex items-center justify-between">
        <div className="text-[#a7a7a7] text-sm">Select a song to play</div>
      </footer>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const albumData = currentSong.album as any;
  const albumArtUrl = albumData?.id
    ? getAuthenticatedSrc(`api/covers/${albumData.id}?size=128`)
    : "/placeholder.jpg";

  const renderRepeatIcon = () => {
    if (playMode === "repeat-one") return <Repeat1 size={16} />;
    return <Repeat size={16} />;
  };

  return (
    <>
      <footer
        className="fixed bottom-0 z-50 w-full h-[90px] bg-black border-t border-[#282828] px-4 grid grid-cols-[30%_40%_30%] items-center select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative group flex-shrink-0">
            <div className="relative w-14 h-14 rounded overflow-hidden shadow-lg cursor-pointer">
              <Image
                src={albumArtUrl}
                alt={currentSong.title}
                fill
                className="object-cover"
                unoptimized
              />
              <button
                onClick={toggleFullScreen}
                className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-105"
              >
                <ChevronUp size={14} className="text-white" />
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-center overflow-hidden mr-2">
            <Link
              href={albumData?.id ? `/album/${albumData.id}` : "#"}
              className="font-medium text-sm text-white hover:underline truncate cursor-pointer"
            >
              {currentSong.title}
            </Link>
            <div className="text-xs text-[#b3b3b3] truncate group">
              {albumData?.artists ? (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                albumData.artists.map((artist: any, i: number) => (
                  <span key={artist.id}>
                    <Link
                      href={`/artist/${artist.id}`}
                      className="hover:text-white hover:underline transition-colors"
                    >
                      {artist.name}
                    </Link>
                    {i < albumData.artists.length - 1 && ", "}
                  </span>
                ))
              ) : (
                <span className="hover:text-white cursor-pointer transition-colors">
                  {currentSong.artist || "Unknown Artist"}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleLikeToggle}
            className={cn(
              "flex-shrink-0 transition-colors hover:scale-105 active:scale-95",
              isLiked ? "text-green-500" : "text-[#b3b3b3] hover:text-white"
            )}
          >
            <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center gap-1.5 max-w-[722px] w-full mx-auto">
          <div className="flex items-center gap-6 mb-1">
            <button
              onClick={toggleShuffle}
              className={cn(
                "transition-colors relative",
                playMode === "shuffle"
                  ? "text-green-500"
                  : "text-[#b3b3b3] hover:text-white",
                playMode === "shuffle" &&
                  "after:content-[''] after:block after:w-1 after:h-1 after:bg-green-500 after:rounded-full after:mx-auto after:mt-1 after:absolute after:left-1/2 after:-translate-x-1/2"
              )}
              title="Enable Shuffle"
            >
              <Shuffle size={16} />
            </button>

            <button
              onClick={playPrev}
              className="text-[#b3b3b3] hover:text-white transition-colors"
              title="Previous"
            >
              <SkipBack size={20} fill="currentColor" />
            </button>

            <button
              onClick={togglePlayPause}
              className="bg-white rounded-full p-2 hover:scale-105 active:scale-95 transition-transform shadow-sm"
            >
              {isPlaying ? (
                <Pause size={20} fill="black" className="text-black" />
              ) : (
                <Play size={20} fill="black" className="text-black ml-0.5" />
              )}
            </button>

            <button
              onClick={playNext}
              className="text-[#b3b3b3] hover:text-white transition-colors"
              title="Next"
            >
              <SkipForward size={20} fill="currentColor" />
            </button>

            <button
              onClick={toggleRepeat}
              className={cn(
                "transition-colors relative",
                playMode.includes("repeat")
                  ? "text-green-500"
                  : "text-[#b3b3b3] hover:text-white",
                playMode.includes("repeat") &&
                  "after:content-[''] after:block after:w-1 after:h-1 after:bg-green-500 after:rounded-full after:mx-auto after:mt-1 after:absolute after:left-1/2 after:-translate-x-1/2"
              )}
              title="Enable Repeat"
            >
              {renderRepeatIcon()}
            </button>
          </div>

          <ProgressBar />
        </div>

        <div className="flex items-center justify-end gap-3 min-w-0">
          <button
            className="text-[#b3b3b3] hover:text-white transition-colors p-1"
            title="Lyrics"
          >
            <Mic2 size={16} />
          </button>

          <button
            className="text-[#b3b3b3] hover:text-white transition-colors p-1"
            title="Queue"
          >
            <ListMusic size={16} />
          </button>

          <button
            className="text-[#b3b3b3] hover:text-white transition-colors p-1"
            title="Connect to a device"
          >
            <MonitorSpeaker size={16} />
          </button>

          <div className="flex items-center gap-2 w-32">
            <VolumeControl />
          </div>

          <button
            onClick={toggleFullScreen}
            className="text-[#b3b3b3] hover:text-white transition-colors p-1 ml-1"
            title="Full Screen"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </footer>

      <FullScreenPlayer />
    </>
  );
};

export default PlayerControls;
