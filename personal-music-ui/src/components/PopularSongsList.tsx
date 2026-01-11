"use client";

import { usePlayerStore } from "@/store/usePlayerStore";
import type { Song } from "@/types";
import { formatDuration } from "@/lib/utils";
import { Play, Pause } from "lucide-react";
import Image from "next/image";
import React from "react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getAuthenticatedSrc } from "@/lib/api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const PopularSongsList = ({ songs }: { songs: Song[] }) => {
  const { playSong, togglePlayPause, currentSong, isPlaying } =
    usePlayerStore();

  return (
    <div className="flex flex-col">
      {songs.map((song, index) => {
        const isActive = currentSong?.id === song.id;

        const coverUrl = song.album?.coverPath
          ? `${API_BASE_URL}/static${song.album.coverPath}`
          : "/placeholder.jpg";

        const handlePlay = () => {
          if (isActive) {
            togglePlayPause();
          } else {
            playSong(song, songs);
          }
        };

        return (
          <div
            key={song.id}
            className="group flex items-center gap-4 p-3 rounded-md hover:bg-neutral-800/50 transition-colors cursor-default"
            onDoubleClick={handlePlay}
          >
            <div className="w-4 text-right text-neutral-400 font-medium text-sm group-hover:hidden">
              {isActive ? (
                <span className="text-green-500">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <rect x="4" y="4" width="16" height="16" />
                  </svg>
                </span>
              ) : (
                index + 1
              )}
            </div>

            <div className="hidden group-hover:flex w-4 items-center justify-end">
              <button onClick={handlePlay} className="text-white">
                {isActive && isPlaying ? (
                  <Pause size={16} fill="white" />
                ) : (
                  <Play size={16} fill="white" />
                )}
              </button>
            </div>

            <div className="relative w-10 h-10 min-w-[40px] shadow-sm">
              <Image
                src={coverUrl}
                alt={song.title}
                fill
                className="object-cover rounded"
                unoptimized
              />
            </div>

            <div className="flex-1 flex flex-col justify-center overflow-hidden">
              <div
                className={`font-medium truncate ${
                  isActive ? "text-green-500" : "text-white"
                }`}
              >
                {song.title}
              </div>
              <div className="text-xs text-neutral-400 truncate">
                {song.album?.title}
              </div>
            </div>

            <div className="text-sm text-neutral-400 font-variant-numeric tabular-nums">
              {formatDuration(song.duration)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PopularSongsList;
