"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePlayerStore } from "@/store/usePlayerStore";
import type { Song, Artist } from "@/types";
import { Clock, Heart, Play, Volume2 } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { useColor } from "color-thief-react";
import AlbumPageSkeleton from "@/components/AlbumPageSkeleton";
import clsx from "clsx";

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
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [backgroundStyle, setBackgroundStyle] = useState({
    backgroundImage: "linear-gradient(to bottom, #1f2937 0%, transparent 40vh)",
  });

  const { playSong, currentSong, isPlaying } = usePlayerStore();

  const albumArtUrl = `http://localhost:3001/static/covers/${id}.jpg`;

  const { data: dominantColor, loading: colorLoading } = useColor(
    albumArtUrl,
    "hex",
    {
      crossOrigin: "anonymous",
      quality: 10,
    }
  );

  useEffect(() => {
    if (!id) return;
    setIsDataLoading(true);
    const fetchAlbumData = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/albums/${id}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setAlbum(data);
        }
      } catch (error) {
        console.error("Failed to fetch album details:", error);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchAlbumData();
  }, [id]);

  useEffect(() => {
    if (dominantColor) {
      setBackgroundStyle({
        backgroundImage: `linear-gradient(to bottom, ${dominantColor} 0%, transparent 40vh)`,
      });
    }
  }, [dominantColor]);

  if (isDataLoading || colorLoading) {
    return <AlbumPageSkeleton />;
  }

  if (!album) {
    return (
      <div className="p-8 text-center">Album not found or failed to load.</div>
    );
  }

  const fullSongQueue = album.songs.map((song) => ({
    ...song,
    album: {
      id: album.id,
      title: album.title,
      artists: album.artists,
    },
  }));

  const handlePlayAlbum = () => {
    if (fullSongQueue.length > 0) {
      playSong(fullSongQueue[0], fullSongQueue);
    }
  };

  return (
    <div className="relative">
      <div
        className="absolute top-0 left-0 w-full h-[40vh] -z-10 transition-all duration-1000"
        style={backgroundStyle}
      />

      <div className="p-8">
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

        <section>
          <div className="grid grid-cols-[2rem_1fr_auto] gap-x-4 px-4 py-2 text-neutral-400 text-sm border-b border-neutral-800/50 mb-2">
            <div className="text-right">#</div>
            <div>TITLE</div>
            <div className="flex justify-end">
              <Clock size={16} />
            </div>
          </div>
          <ul>
            {fullSongQueue.map((song, index) => {
              const isActive = song.id === currentSong?.id;

              return (
                <li
                  key={song.id}
                  onClick={() => playSong(song, fullSongQueue)}
                  className={clsx(
                    "grid grid-cols-[2rem_1fr_auto] gap-x-4 px-4 py-2 items-center rounded-md hover:bg-neutral-800/50 cursor-pointer group",
                    { "bg-neutral-700/50": isActive }
                  )}
                >
                  <div className="flex justify-end items-center">
                    {}
                    {isActive && isPlaying ? (
                      <Volume2 size={16} className="text-green-400" />
                    ) : (
                      <>
                        <span
                          className={clsx(
                            "group-hover:hidden",
                            isActive ? "text-green-400" : "text-neutral-400"
                          )}
                        >
                          {song.trackNumber || index + 1}
                        </span>
                        <Play
                          size={16}
                          className="hidden group-hover:block text-white"
                          fill="currentColor"
                        />
                      </>
                    )}
                  </div>
                  <div
                    className={clsx(
                      "font-medium truncate",
                      isActive ? "text-green-400" : "text-white"
                    )}
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
