"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Play } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import type { Song, Artist } from "@/types";

// 定义卡片期望接收的基础专辑信息
type AlbumForCard = {
  id: number;
  title: string;
  artists: {
    id: number;
    name: string;
  }[];
  _count: {
    songs: number;
  };
};

// 定义从API获取的完整专辑详情，包含歌曲列表
type AlbumWithSongs = AlbumForCard & {
  songs: Song[];
};

const AlbumCard = ({ album }: { album: AlbumForCard }) => {
  const { playSong } = usePlayerStore();

  const albumArtUrl = `http://localhost:3000/static/covers/${album.id}.jpg`;

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      const res = await fetch(`http://localhost:3000/api/albums/${album.id}`);
      if (!res.ok) return;

      const fullAlbum: AlbumWithSongs = await res.json();

      if (fullAlbum.songs && fullAlbum.songs.length > 0) {
        const queue = fullAlbum.songs.map((song) => ({
          ...song,
          album: {
            id: fullAlbum.id,
            title: fullAlbum.title,
            artists: fullAlbum.artists,
          },
        }));
        playSong(queue[0], queue);
      }
    } catch (error) {
      console.error("Failed to fetch album for playback:", error);
    }
  };

  return (
    <Link
      href={`/album/${album.id}`}
      className="block group relative p-4 rounded-lg bg-neutral-900/50 hover:bg-neutral-800/80 transition-colors duration-300"
    >
      {/* 1. 卡片内容容器，增加 transform 和 transition 实现浮起效果 */}
      <div className="relative transform group-hover:scale-105 transition-transform duration-300 ease-in-out">
        <div className="relative w-full aspect-square shadow-lg">
          <Image
            src={albumArtUrl}
            alt={`Cover for ${album.title}`}
            fill
            className="object-cover rounded-md"
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 20vw"
          />
        </div>
        <div className="mt-4">
          <h3 className="font-bold truncate text-white">{album.title}</h3>
          <p className="text-sm text-neutral-400 truncate">
            {album.artists.map((artist) => artist.name).join(", ")}
          </p>
        </div>
      </div>

      {/* 2. 播放按钮样式微调，使其动画更平滑 */}
      <button
        onClick={handlePlayClick}
        className="absolute bottom-[100px] right-6 flex items-center justify-center bg-green-500 p-3 rounded-full shadow-lg 
                   opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 
                   transition-all duration-300 ease-in-out
                   focus:outline-none"
        aria-label={`Play ${album.title}`}
      >
        <Play size={24} className="text-black" fill="black" />
      </button>
    </Link>
  );
};

export default AlbumCard;
