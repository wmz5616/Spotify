"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePlayerStore } from "@/store/usePlayerStore";
import type { Song, Artist } from "@/types"; // 引入 Artist 类型
import { Clock, Heart, Play, Volume2 } from "lucide-react"; // 引入新图标
import { formatDuration } from "@/lib/utils";

// 类型定义
// 注意：我们从 types.ts 导入了 Artist，所以这里可以移除
type AlbumDetails = {
  id: number;
  title: string;
  artists: Artist[];
  songs: Song[];
};

const AlbumDetailPage = () => {
  const params = useParams();
  const id = params.id as string;

  const [album, setAlbum] = useState<AlbumDetails | null>(null);
  const { playSong, currentSong, isPlaying } = usePlayerStore();

  useEffect(() => {
    if (!id) return;
    const fetchAlbumData = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/albums/${id}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setAlbum(data);
        }
      } catch (error) {
        console.error("Failed to fetch album details:", error);
      }
    };
    fetchAlbumData();
  }, [id]);

  if (!album) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading album...</p>
      </div>
    );
  }

  const albumArtUrl = `http://localhost:3000/api/album-art/${album.id}`;

  const handlePlayAlbum = () => {
    if (album.songs && album.songs.length > 0) {
      // 播放第一首歌，并构建包含完整信息的 song 对象
      const firstSongWithDetails = {
        ...album.songs[0],
        album: {
          id: album.id,
          title: album.title,
          artists: album.artists,
        },
      };
      playSong(firstSongWithDetails);
    }
  };

  return (
    // 主容器，去掉了外层 p-8，因为我们要在内部精确控制
    <div className="relative">
      {/* 1. 动态渐变背景 */}
      <div className="absolute top-0 left-0 w-full h-[40vh] bg-gradient-to-b from-purple-800 to-transparent -z-10" />

      <div className="p-8">
        {/* 2. 现代化的头部布局 */}
        <header className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-8 pt-16">
          <div className="w-48 h-48 lg:w-56 lg:h-56 flex-shrink-0 bg-neutral-800 rounded-md shadow-2xl overflow-hidden">
            <Image
              src={albumArtUrl}
              alt={`Cover for ${album.title}`}
              width={224}
              height={224}
              className="object-cover w-full h-full"
              priority
            />
          </div>
          <div className="flex flex-col gap-3 text-center md:text-left">
            <span className="text-sm font-bold">ALBUM</span>
            <h1 className="text-5xl lg:text-8xl font-black tracking-tighter break-words">
              {album.title}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-2 text-sm mt-2">
              <div className="w-6 h-6 bg-pink-500 rounded-full"></div>
              <p className="font-bold">
                {album.artists.map((artist, index) => (
                  <React.Fragment key={artist.id}>
                    <Link
                      href={`/artist/${artist.id}`}
                      className="hover:underline"
                    >
                      {artist.name}
                    </Link>
                    {index < album.artists.length - 1 && ", "}
                  </React.Fragment>
                ))}
              </p>
              <span className="text-neutral-400">&bull;</span>
              <span className="text-neutral-400">
                {album.songs.length} songs
              </span>
            </div>
          </div>
        </header>

        {/* 3. 标志性的操作按钮 */}
        <div className="flex items-center gap-6 mb-8">
          <button
            onClick={handlePlayAlbum}
            className="bg-green-500 text-black p-4 rounded-full shadow-lg hover:scale-105 transition-transform"
            aria-label="Play album"
          >
            <Play size={28} fill="black" />
          </button>
          <button
            className="text-neutral-400 hover:text-white"
            aria-label="Like"
          >
            <Heart size={32} />
          </button>
        </div>

        {/* 4. 精致的歌曲列表 */}
        <section>
          <div className="grid grid-cols-[2rem_1fr_auto] gap-x-4 px-4 py-2 text-neutral-400 text-sm border-b border-neutral-800/50 mb-2">
            <div className="text-right">#</div>
            <div>TITLE</div>
            <div className="flex justify-end">
              <Clock size={16} />
            </div>
          </div>
          <ul>
            {album.songs.map((song, index) => {
              const isActive = song.id === currentSong?.id;
              const songWithDetails = {
                ...song,
                album: {
                  id: album.id,
                  title: album.title,
                  artists: album.artists,
                },
              };

              return (
                <li
                  key={song.id}
                  onClick={() => playSong(songWithDetails)}
                  className={`grid grid-cols-[2rem_1fr_auto] gap-x-4 px-4 py-2 items-center rounded-md hover:bg-neutral-800/50 cursor-pointer group ${
                    isActive ? "bg-neutral-700/50" : ""
                  }`}
                >
                  <div
                    className={`flex justify-end items-center ${
                      isActive ? "text-green-400" : "text-neutral-400"
                    }`}
                  >
                    <span className="group-hover:hidden">
                      {song.trackNumber || index + 1}
                    </span>
                    <Play
                      size={16}
                      className="hidden group-hover:block"
                      fill="currentColor"
                    />
                    {isActive && isPlaying && (
                      <Volume2 size={16} className="absolute" />
                    )}
                  </div>
                  <div
                    className={`font-medium truncate ${
                      isActive ? "text-green-400" : "text-white"
                    }`}
                  >
                    {song.title}
                  </div>
                  <div className="text-neutral-400 text-sm">
                    {formatDuration(song.duration)}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default AlbumDetailPage;
