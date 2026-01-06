"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { usePlayerStore } from "@/store/usePlayerStore";
import type { Playlist, Song } from "@/types";
import { Clock, Play } from "lucide-react";
import SongRowItem from "@/components/SongRowItem";

type PlaylistDetails = Playlist & {
  songs: (Song & {
    album: {
      id: number;
      title: string;
      artists: { id: number; name: string }[];
    };
  })[];
};

const PlaylistDetailPage = () => {
  const params = useParams();
  const id = params.id as string;

  const [playlist, setPlaylist] = useState<PlaylistDetails | null>(null);
  const { playSong } = usePlayerStore();

  useEffect(() => {
    if (!id) return;
    const fetchPlaylistData = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/playlists/${id}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setPlaylist(data);
        }
      } catch (error) {
        console.error("Failed to fetch playlist details:", error);
      }
    };
    fetchPlaylistData();
  }, [id]);

  if (!playlist) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading playlist...</p>
      </div>
    );
  }

  const handlePlayPlaylist = () => {
    if (playlist.songs && playlist.songs.length > 0) {
      playSong(playlist.songs[0], playlist.songs);
    }
  };

  const coverArtUrl =
    playlist.songs.length > 0
      ? `http://localhost:3001/static/covers/${playlist.songs[0].album.id}.jpg`
      : "/placeholder.png";

  return (
    <div className="relative">
      <div className="p-8">
        <header className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-8 pt-16">
          <div className="w-48 h-48 lg:w-56 lg:h-56 flex-shrink-0 bg-neutral-800 rounded-md shadow-2xl overflow-hidden">
            <Image
              src={coverArtUrl}
              alt={`Cover for ${playlist.name}`}
              width={224}
              height={224}
              className="object-cover w-full h-full"
              priority
            />
          </div>
          <div className="flex flex-col gap-3 text-center md:text-left">
            <span className="text-sm font-bold">PLAYLIST</span>
            <h1 className="text-5xl lg:text-8xl font-black tracking-tighter break-words">
              {playlist.name}
            </h1>
            <p className="text-neutral-400 mt-2">
              {playlist.songs.length} songs
            </p>
          </div>
        </header>

        <div className="flex items-center gap-6 mb-8">
          <button
            onClick={handlePlayPlaylist}
            className="bg-green-500 text-black p-4 rounded-full shadow-lg hover:scale-105 transition-transform"
            aria-label={`Play ${playlist.name}`}
          >
            <Play size={28} fill="black" />
          </button>
        </div>

        <section>
          <div className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_auto] gap-x-4 px-4 py-2 text-neutral-400 text-sm border-b border-neutral-800/50 mb-2">
            <div className="text-right">#</div>
            <div>TITLE</div>
            <div>ALBUM</div>
            <div className="flex justify-end">
              <Clock size={16} />
            </div>
          </div>
          <ul>
            {playlist.songs.map((song, index) => (
              <SongRowItem key={song.id} song={song} index={index} />
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default PlaylistDetailPage;
