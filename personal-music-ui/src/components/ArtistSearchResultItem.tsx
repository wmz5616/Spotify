"use client";

import type { Artist } from "@/types";
import Image from "next/image";
import Link from "next/link";

interface ArtistSearchResultItemProps {
  // 确保类型定义与后端返回的数据一致
  artist: Artist & { albums?: { id: number }[] };
}

const ArtistSearchResultItem = ({ artist }: ArtistSearchResultItemProps) => {
  // --- 使用和 Sidebar 完全一致的、正确的图片URL判断逻辑 ---
  const imageUrl = artist.avatarUrl
    ? `http://localhost:3000/static${artist.avatarUrl}`
    : artist.albums && artist.albums.length > 0
    ? `http://localhost:3000/static/covers/${artist.albums[0].id}.jpg`
    : "/placeholder.png";

  return (
    <Link href={`/artist/${artist.id}`}>
      <div className="p-4 rounded-lg hover:bg-neutral-800/50 transition-colors flex flex-col items-center text-center gap-4">
        <div className="relative w-32 h-32">
          <Image
            src={imageUrl}
            alt={artist.name}
            fill
            className="rounded-full object-cover shadow-lg"
          />
        </div>
        <div>
          <p className="font-bold text-white truncate">{artist.name}</p>
          <p className="text-sm text-neutral-400">Artist</p>
        </div>
      </div>
    </Link>
  );
};

export default ArtistSearchResultItem;
