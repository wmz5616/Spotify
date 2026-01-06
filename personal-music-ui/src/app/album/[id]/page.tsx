"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Play, Clock, Calendar, AlertCircle } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import type { Song, Album, Artist } from "@/types";
import SongRowItem from "@/components/SongRowItem";
import AlbumPageSkeleton from "@/components/AlbumPageSkeleton";
import { formatDuration } from "@/lib/utils";
import { useColor } from "color-thief-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type AlbumDetails = Album & {
  songs: Song[];
  artists: Artist[];
  duration?: number;
  releaseDate?: string;
  description?: string;
};

const AlbumDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { playSong, currentSong, isPlaying } = usePlayerStore();

  const [album, setAlbum] = useState<AlbumDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const albumArtUrl = id
    ? `${API_BASE_URL}/api/covers/${id}?size=600`
    : "/placeholder.jpg";

  const { data: dominantColor } = useColor(albumArtUrl, "hex", {
    crossOrigin: "anonymous",
    quality: 10,
  });

  useEffect(() => {
    if (!id) return;

    const fetchAlbumData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE_URL}/api/albums/${id}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Album not found");
          }
          throw new Error(`Failed to fetch album: ${res.statusText}`);
        }

        const data = await res.json();
        setAlbum(data);
      } catch (err) {
        console.error("Error loading album:", err);
        setError(err instanceof Error ? err.message : "Failed to load album");
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumData();
  }, [id]);

  const handlePlayAlbum = () => {
    if (album?.songs && album.songs.length > 0) {
      const queue = album.songs.map((song) => ({
        ...song,
        album: {
          id: album.id,
          title: album.title,
          artists: album.artists,
        },
      }));
      playSong(queue[0], queue);
    }
  };

  if (loading) return <AlbumPageSkeleton />;

  if (error || !album) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-neutral-400">
        <AlertCircle size={48} className="mb-4 text-red-500" />
        <h2 className="text-xl font-bold text-white mb-2">Album Not Found</h2>
        <p className="mb-6">{error || "The requested album does not exist."}</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-white transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const totalDuration = album.songs.reduce(
    (acc, song) => acc + (song.duration || 0),
    0
  );

  return (
    <div className="relative isolate min-h-screen">
      <div
        className="absolute inset-x-0 top-0 h-[500px] -z-10 transition-colors duration-700 ease-in-out"
        style={{
          background: `linear-gradient(to bottom, ${
            dominantColor || "#222"
          } 0%, #121212 100%)`,
          opacity: 0.6,
        }}
      />

      <div className="p-6 pt-10">
        <div className="flex flex-col md:flex-row items-end gap-6 mb-8">
          <div className="relative w-48 h-48 md:w-60 md:h-60 shadow-2xl flex-shrink-0">
            <Image
              src={albumArtUrl}
              alt={album.title}
              fill
              className="object-cover rounded-md"
              priority
              unoptimized
              sizes="(max-width: 768px) 100vw, 300px"
            />
          </div>

          <div className="flex flex-col gap-2 mb-2 w-full">
            <span className="text-sm font-bold uppercase tracking-wider text-neutral-200">
              Album
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight mb-4">
              {album.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-300 font-medium">
              <div className="flex items-center gap-1">
                {album.artists.map((artist, i) => (
                  <span
                    key={artist.id}
                    className="text-white hover:underline cursor-pointer"
                  >
                    {artist.name}
                    {i < album.artists.length - 1 && ", "}
                  </span>
                ))}
              </div>
              <span className="text-neutral-400">•</span>
              <span>{album.songs.length} songs</span>
              <span className="text-neutral-400">•</span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {formatDuration(totalDuration)}
              </span>
              {album.releaseDate && (
                <>
                  <span className="text-neutral-400">•</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(album.releaseDate).getFullYear()}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handlePlayAlbum}
            className="flex items-center justify-center w-14 h-14 bg-green-500 rounded-full shadow-lg hover:scale-105 hover:bg-green-400 transition-all"
          >
            <Play
              size={28}
              fill="black"
              className="translate-x-0.5 text-black"
            />
          </button>
        </div>

        <div className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_auto_2rem] gap-x-4 px-4 py-2 border-b border-neutral-800 text-neutral-400 text-sm mb-4 sticky top-0 bg-[#121212]/95 backdrop-blur-sm z-10">
          <div className="text-right">#</div>
          <div>Title</div>
          <div className="hidden md:block">Album</div>
          <div className="flex justify-end">
            <Clock size={16} />
          </div>
          <div></div>
        </div>

        <div className="flex flex-col">
          {album.songs.map((song, index) => (
            <SongRowItem
              key={song.id}
              song={{
                ...song,
                album: {
                  id: album.id,
                  title: album.title,
                  artists: album.artists,
                },
              }}
              index={index}
              queue={album.songs.map((s) => ({
                ...s,
                album: {
                  id: album.id,
                  title: album.title,
                  artists: album.artists,
                },
              }))}
              hideCover={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlbumDetailPage;
