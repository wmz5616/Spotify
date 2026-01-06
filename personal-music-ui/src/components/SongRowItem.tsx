"use client";

import { usePlayerStore } from "@/store/usePlayerStore";
import type { Song } from "@/types";
import { formatDuration } from "@/lib/utils";
import {
  Play,
  Volume2,
  MoreHorizontal,
  ListPlus,
  CornerDownRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface SongRowItemProps {
  song: Song;
  index: number;
  queue?: Song[];
  hideCover?: boolean;
}

const SongRowItem = ({
  song,
  index,
  queue,
  hideCover = false,
}: SongRowItemProps) => {
  const {
    playSong,
    currentSong,
    isPlaying,
    addToQueue,
    insertNext, // [修复] 使用 insertNext (插队播放)，而不是 playNext (切歌)
  } = usePlayerStore();

  const isActive = song.id === currentSong?.id;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSong(song, queue);
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(song);
    setIsMenuOpen(false);
  };

  const handlePlayNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    // [修复] 调用插队逻辑
    insertNext(song);
    setIsMenuOpen(false);
  };

  const albumArtUrl = song.album?.id
    ? `${API_BASE_URL}/api/covers/${song.album.id}?size=64`
    : "/placeholder.jpg";

  return (
    <div
      onClick={handlePlay}
      className={`grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_auto_2rem] gap-x-4 px-4 py-2 items-center rounded-md hover:bg-neutral-800/50 cursor-pointer group relative ${
        isActive ? "bg-neutral-700/50" : ""
      }`}
    >
      <div
        className={`flex justify-end items-center ${
          isActive ? "text-green-400" : "text-neutral-400"
        }`}
      >
        <span className="group-hover:hidden">{index + 1}</span>
        <Play
          size={16}
          className="hidden group-hover:block text-white"
          fill="currentColor"
        />
        {isActive && isPlaying && <Volume2 size={16} className="absolute" />}
      </div>

      <div className="flex items-center gap-4 truncate">
        {!hideCover && (
          <Image
            src={albumArtUrl}
            alt={song.album?.title || "album art"}
            width={40}
            height={40}
            className="rounded-sm flex-shrink-0"
            unoptimized // 必须加
          />
        )}

        <div className="truncate">
          <p
            className={`font-medium truncate ${
              isActive ? "text-green-400" : "text-white"
            }`}
          >
            {song.title}
          </p>
          <div className="text-sm text-neutral-400 truncate">
            {song.album?.artists.map((artist, index) => (
              <React.Fragment key={artist.id}>
                <Link
                  href={`/artist/${artist.id}`}
                  className="hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {artist.name}
                </Link>
                {index < (song.album?.artists.length || 0) - 1 && ", "}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="text-neutral-400 text-sm truncate hidden md:block">
        <Link
          href={`/album/${song.album?.id}`}
          className="hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {song.album?.title}
        </Link>
      </div>

      <div className="text-neutral-400 text-sm">
        {formatDuration(song.duration)}
      </div>

      <div className="relative flex items-center justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          className="text-neutral-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal size={20} />
        </button>

        {isMenuOpen && (
          <div
            className="absolute top-full right-0 mt-1 w-48 bg-neutral-800 rounded-md shadow-lg z-10"
            onMouseLeave={() => setIsMenuOpen(false)}
          >
            <ul className="py-1">
              <li
                onClick={handleAddToQueue}
                className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-700 cursor-pointer"
              >
                <ListPlus size={16} />
                <span>Add to queue</span>
              </li>
              <li
                onClick={handlePlayNext}
                className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-700 cursor-pointer"
              >
                <CornerDownRight size={16} />
                <span>Play next</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SongRowItem;
