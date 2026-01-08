"use client";

import { usePlayerStore } from "@/store/usePlayerStore";
import type { Song } from "@/types";
import { formatDuration } from "@/lib/utils";
import {
  Play,
  Pause,
  MoreHorizontal,
  ListPlus,
  CornerDownRight,
  BarChart3,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import clsx from "clsx";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface SongRowItemProps {
  song: Song;
  index: number;
  queue?: Song[];
  hideCover?: boolean;
  style?: React.CSSProperties;
}

const SongRowItem = ({
  song,
  index,
  queue,
  hideCover = false,
  style,
}: SongRowItemProps) => {
  const {
    playSong,
    togglePlayPause,
    currentSong,
    isPlaying,
    addToQueue,
    insertNext,
  } = usePlayerStore();

  const isActive = song.id === currentSong?.id;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActive) {
      togglePlayPause();
    } else {
      playSong(song, queue);
    }
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(song);
    setIsMenuOpen(false);
  };

  const handlePlayNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    insertNext(song);
    setIsMenuOpen(false);
  };

  const coverUrl = song.album?.coverPath
    ? `${API_BASE_URL}/static${song.album.coverPath}`
    : "/placeholder.jpg";

  return (
    <div
      style={style}
      className={clsx(
        "group grid grid-cols-[16px_4fr_2fr_minmax(120px,1fr)] gap-4 px-4 py-2 text-sm text-neutral-400 hover:bg-neutral-800/50 rounded-md transition cursor-default items-center relative",
        isActive && "bg-neutral-800/30 text-green-500"
      )}
      onDoubleClick={() => playSong(song, queue)}
    >
      <div className="flex items-center justify-center w-4 relative">
        <div className="flex items-center justify-center w-full h-full group-hover:hidden">
          {isActive && isPlaying ? (
            <BarChart3 size={16} className="text-green-500 animate-pulse" />
          ) : (
            <span
              className={clsx(
                "font-medium",
                isActive ? "text-green-500" : "text-neutral-400"
              )}
            >
              {index + 1}
            </span>
          )}
        </div>
        <div className="hidden group-hover:flex absolute inset-0 items-center justify-center bg-transparent">
          <button
            onClick={handlePlayClick}
            className="text-white hover:scale-110 transition-transform"
          >
            {isActive && isPlaying ? (
              <Pause size={16} fill="white" />
            ) : (
              <Play size={16} fill="white" />
            )}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3 overflow-hidden">
        {!hideCover && (
          <div className="relative h-10 w-10 min-w-[40px] overflow-hidden rounded">
            <Image
              src={coverUrl}
              fill
              alt={song.title}
              className="object-cover"
              unoptimized={coverUrl.startsWith(API_BASE_URL)}
            />
          </div>
        )}
        <div className="flex flex-col overflow-hidden">
          <span
            className={clsx(
              "truncate font-medium text-base",
              isActive ? "text-green-500" : "text-white"
            )}
          >
            {song.title}
          </span>
          <div className="flex items-center gap-1 text-sm text-neutral-400 group-hover:text-white transition-colors">
            <span className="truncate">
              {song.album?.artists?.map((a) => a.name).join(", ") ||
                "Unknown Artist"}
            </span>
          </div>
        </div>
      </div>
      <div className="hidden md:block truncate hover:text-white transition-colors">
        <Link
          href={`/album/${song.album?.id}`}
          className="hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {song.album?.title || "Unknown Album"}
        </Link>
      </div>
      <div className="flex items-center justify-between pl-2">
        <div className="w-5 mr-4 invisible group-hover:visible"></div>

        <div className="text-sm font-variant-numeric tabular-nums">
          {formatDuration(song.duration)}
        </div>
        <div className="relative ml-2 w-8 flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className={clsx(
              "text-neutral-400 hover:text-white transition-opacity",
              isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
          >
            <MoreHorizontal size={20} />
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                }}
              />
              <div className="absolute top-full right-0 mt-1 w-48 bg-neutral-800 border border-neutral-700 rounded-md shadow-xl z-20 p-1">
                <ul className="py-1">
                  <li
                    onClick={handleAddToQueue}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-200 hover:bg-neutral-700/80 rounded-sm cursor-pointer"
                  >
                    <ListPlus size={16} />
                    <span>Add to queue</span>
                  </li>
                  <li
                    onClick={handlePlayNext}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-200 hover:bg-neutral-700/80 rounded-sm cursor-pointer"
                  >
                    <CornerDownRight size={16} />
                    <span>Play next</span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SongRowItem;
