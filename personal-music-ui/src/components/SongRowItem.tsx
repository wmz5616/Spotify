"use client";

import { usePlayerStore } from "@/store/usePlayerStore";
import type { Song } from "@/types";
import { formatDuration } from "@/lib/utils";
import { Play, Volume2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface SongRowItemProps {
  song: Song;
  index: number;
}

const SongRowItem = ({ song, index }: SongRowItemProps) => {
  const { playSong, currentSong, isPlaying } = usePlayerStore();
  const isActive = song.id === currentSong?.id;

  const albumArtUrl = song.album?.id
    ? `http://localhost:3000/api/album-art/${song.album.id}`
    : "/placeholder.png";

  return (
    <div
      onClick={() => playSong(song)}
      // 1. 简化网格布局，移除固定封面列
      className={`grid grid-cols-[2rem_minmax(0,1fr)_auto] gap-x-4 px-4 py-2 items-center rounded-md hover:bg-neutral-800/50 cursor-pointer group ${
        isActive ? "bg-neutral-700/50" : ""
      }`}
    >
      {/* 第一列：序号 / 播放按钮 */}
      <div
        className={`flex justify-end items-center ${
          isActive ? "text-green-400" : "text-neutral-400"
        }`}
      >
        <span className="group-hover:hidden">{index + 1}</span>
        <Play
          size={16}
          className="hidden group-hover:block"
          fill="currentColor"
        />
        {isActive && isPlaying && <Volume2 size={16} className="absolute" />}
      </div>

      {/* 第二列：歌曲信息（封面 + 标题 + 艺人） */}
      <div className="flex items-center gap-4 truncate">
        <Image
          src={albumArtUrl}
          alt={song.album?.title || "album art"}
          width={40}
          height={40}
          className="rounded-sm"
        />
        <div className="truncate">
          <p
            className={`font-medium truncate ${
              isActive ? "text-green-400" : "text-white"
            }`}
          >
            {song.title}
          </p>
          {/* 在这里显示艺人名，并使其可点击 */}
          <div className="text-sm text-neutral-400 truncate">
            {song.album?.artists.map((artist, index) => (
              <React.Fragment key={artist.id}>
                <Link
                  href={`/artist/${artist.id}`}
                  className="hover:underline"
                  onClick={(e) => e.stopPropagation()} // 阻止事件冒泡到 li 的 onClick
                >
                  {artist.name}
                </Link>
                {index < song.album!.artists.length - 1 && ", "}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* 第三列：时长 */}
      <div className="text-neutral-400 text-sm">
        {formatDuration(song.duration)}
      </div>
    </div>
  );
};

export default SongRowItem;
