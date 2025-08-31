"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePlayerStore } from "@/store/usePlayerStore";
import type { Song } from "@/types";
import { Volume2 } from "lucide-react"; // 导入一个图标用于显示

// 类型定义 (保持不变)
type Artist = {
  id: number;
  name: string;
};
type AlbumDetails = {
  id: number;
  title: string;
  artist: Artist;
  songs: Song[];
};

const AlbumDetailPage = () => {
  const params = useParams();
  const id = params.id as string;

  const [album, setAlbum] = useState<AlbumDetails | null>(null);

  // --- 关键改动 1: 从store中获取当前歌曲和播放状态 ---
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
    return <div className="p-10 text-center">Loading album...</div>;
  }

  const albumArtUrl = `http://localhost:3000/api/album-art/${album.id}`;

  return (
    <div className="p-8">
      {/* 页面头部 (保持不变) */}
      <header className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-8">
        <div className="w-48 h-48 flex-shrink-0 bg-neutral-800 rounded-md shadow-lg overflow-hidden">
          <Image
            src={albumArtUrl}
            alt={`Cover for ${album.title}`}
            width={192}
            height={192}
            className="object-cover w-full h-full"
            priority
          />
        </div>
        <div className="flex flex-col gap-2 text-center md:text-left">
          <span className="text-sm font-bold">ALBUM</span>
          <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tighter">
            {album.title}
          </h1>
          <p className="text-neutral-300">
            By{" "}
            <Link
              href={`/artist/${album.artist.id}`}
              className="font-bold hover:underline"
            >
              {album.artist.name}
            </Link>
          </p>
        </div>
      </header>

      {/* 歌曲列表 */}
      <section>
        <div className="grid grid-cols-[2rem_1fr_auto] gap-x-4 p-2 text-neutral-400 text-sm border-b border-neutral-800 mb-2">
          <div className="text-right">#</div>
          <div>TITLE</div>
          <div>DUR.</div>
        </div>
        <ul>
          {album.songs.map((song, index) => {
            // --- 关键改动 2: 判断当前歌曲是否为活动歌曲 ---
            const isActive = song.id === currentSong?.id;

            return (
              <li
                key={song.id}
                onClick={() => playSong(song)}
                // --- 关键改动 3: 根据是否活动，应用不同的背景色 ---
                className={`grid grid-cols-[2rem_1fr_auto] gap-x-4 p-2 items-center rounded-md hover:bg-neutral-800/50 cursor-pointer group ${
                  isActive ? "bg-green-500/20" : ""
                }`}
              >
                <div
                  // --- 关键改动 4: 根据是否活动，应用不同的文字颜色 ---
                  className={`text-right ${
                    isActive
                      ? "text-green-400"
                      : "text-neutral-400 group-hover:text-white"
                  }`}
                >
                  {/* 如果歌曲正在播放，显示小喇叭图标，否则显示曲目号 */}
                  {isActive && isPlaying ? (
                    <Volume2 size={16} />
                  ) : (
                    song.trackNumber || index + 1
                  )}
                </div>
                <div
                  className={`font-medium ${
                    isActive ? "text-green-400" : "group-hover:text-white"
                  }`}
                >
                  {song.title}
                </div>
                <div className="text-neutral-400 text-sm">3:45</div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};

export default AlbumDetailPage;
