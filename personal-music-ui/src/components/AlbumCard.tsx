"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Play, LoaderCircle } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import type { Song } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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

type AlbumWithSongs = AlbumForCard & {
  songs: Song[];
};

const AlbumCard = ({ album }: { album: AlbumForCard }) => {
  const { playSong } = usePlayerStore();
  const [isLoading, setIsLoading] = useState(false);
  const albumArtUrl = `${API_BASE_URL}/api/covers/${album.id}?size=300`;

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/albums/${album.id}`);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link
      href={`/album/${album.id}`}
      className="block group relative p-4 rounded-lg bg-neutral-900/50 hover:bg-neutral-800/80 transition-colors duration-300"
    >
      <div className="relative transform group-hover:scale-105 transition-transform duration-300 ease-in-out">
        <div className="relative w-full aspect-square shadow-lg">
          <Image
            src={albumArtUrl}
            alt={`Cover for ${album.title}`}
            fill
            className="object-cover rounded-md"
            unoptimized
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

      <button
        onClick={handlePlayClick}
        disabled={isLoading}
        className="absolute bottom-[100px] right-6 flex items-center justify-center bg-green-500 p-3 rounded-full shadow-lg 
                   opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 
                   transition-all duration-300 ease-in-out
                   focus:outline-none hover:scale-110 hover:bg-green-400"
        aria-label={`Play ${album.title}`}
      >
        {isLoading ? (
          <LoaderCircle size={24} className="text-black animate-spin" />
        ) : (
          <Play size={24} className="text-black translate-x-0.5" fill="black" />
        )}
      </button>
    </Link>
  );
};

export default AlbumCard;
