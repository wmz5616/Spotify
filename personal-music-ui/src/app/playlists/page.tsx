"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { Loader2, AlertCircle, ListMusic } from "lucide-react";
import type { Playlist } from "@/types";

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const data = await apiClient<Playlist[]>("/api/playlists");
        setPlaylists(data || []);
      } catch (err) {
        console.error("Failed to fetch playlists:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-400">
        <Loader2 className="animate-spin mr-2" /> Loading playlists...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500 gap-2">
        <AlertCircle size={32} />
        <p>无法加载歌单列表</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Playlists</h1>

      {playlists.length === 0 ? (
        <div className="text-neutral-400 text-center py-20">
          <p>暂无歌单</p>
          <p className="text-sm mt-2">您可以创建新的歌单来收藏喜欢的音乐</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlist/${playlist.id}`}
              className="group bg-neutral-900/50 hover:bg-neutral-800 p-4 rounded-md transition duration-300 flex flex-col gap-4"
            >
              <div className="aspect-square w-full bg-neutral-800 rounded-md flex items-center justify-center shadow-lg group-hover:shadow-xl transition relative overflow-hidden">
                <ListMusic
                  size={48}
                  className="text-neutral-600 group-hover:text-green-500 transition duration-300"
                />
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="font-bold truncate text-white">
                  {playlist.name}
                </h3>
                <p className="text-sm text-neutral-400 truncate">Playlist</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
