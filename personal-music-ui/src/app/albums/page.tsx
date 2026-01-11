"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import AlbumCard from "@/components/AlbumCard";
import { Loader2, AlertCircle } from "lucide-react";
import type { Album } from "@/types";

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const data = await apiClient<Album[]>("/api/albums");
        setAlbums(data || []);
      } catch (err) {
        console.error("Failed to fetch albums:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbums();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-400">
        <Loader2 className="animate-spin mr-2" /> Loading albums...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500 gap-2">
        <AlertCircle size={32} />
        <p>无法加载专辑列表</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Albums</h1>

      {albums.length === 0 ? (
        <div className="text-neutral-400 text-center py-20">
          <p>暂无专辑</p>
          <p className="text-sm mt-2">
            请尝试在侧边栏点击 &quot;Refresh Library&quot; 进行扫描
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      )}
    </div>
  );
}
