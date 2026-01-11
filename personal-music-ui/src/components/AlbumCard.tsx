"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Play, LoaderCircle } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import type { Song } from "@/types";
import { apiClient, getAuthenticatedSrc } from "@/lib/api-client";
import { motion } from "framer-motion";

type AlbumForCard = {
  id: number;
  title: string;
  artists?: {
    id: number;
    name: string;
  }[];
  _count?: {
    songs: number;
  };
};

type AlbumWithSongs = AlbumForCard & {
  songs: Song[];
};

const AlbumCard = ({ album }: { album: AlbumForCard }) => {
  const { playSong } = usePlayerStore();
  const [isLoading, setIsLoading] = useState(false);
  const albumArtUrl = getAuthenticatedSrc(`api/covers/${album.id}?size=300`);

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsLoading(true);

    try {
      const fullAlbum = await apiClient<AlbumWithSongs>(
        `/api/albums/${album.id}`
      );

      if (fullAlbum && fullAlbum.songs && fullAlbum.songs.length > 0) {
        const queue = fullAlbum.songs.map((song) => ({
          ...song,
          album: {
            id: fullAlbum.id,
            title: fullAlbum.title,
            artists: fullAlbum.artists || [],
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
      className="block group relative p-4 rounded-lg bg-[#181818] hover:bg-[#282828] transition-colors duration-300"
    >
      <div className="relative">
        <motion.div
          layoutId={`album-cover-${album.id}`}
          className="relative w-full aspect-square shadow-lg mb-4 rounded-md overflow-hidden"
          transition={{ duration: 0.3 }}
        >
          <Image
            src={albumArtUrl}
            alt={`Cover for ${album.title}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
            unoptimized
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 20vw"
            priority={false}
          />
        </motion.div>

        <div className="flex flex-col gap-1">
          <h3 className="font-bold truncate text-white">{album.title}</h3>
          <p className="text-sm text-[#a7a7a7] truncate font-medium">
            {album.artists?.map((artist) => artist.name).join(", ") ||
              "Unknown Artist"}
          </p>
        </div>
      </div>

      <button
        onClick={handlePlayClick}
        disabled={isLoading}
        className="absolute bottom-[100px] right-6 flex items-center justify-center bg-green-500 p-3 rounded-full shadow-lg 
                   opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 
                   transition-all duration-300 ease-in-out z-20
                   focus:outline-none hover:scale-110 hover:bg-green-400 active:scale-95"
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
