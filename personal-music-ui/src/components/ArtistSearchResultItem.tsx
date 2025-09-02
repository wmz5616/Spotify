"use client";

import type { Artist } from "@/types";
import Image from "next/image";
import Link from "next/link";

interface ArtistSearchResultItemProps {
  artist: Artist & { albums: { id: number }[] }; // 假设 artist 带有 albums 数组
}

const ArtistSearchResultItem = ({ artist }: ArtistSearchResultItemProps) => {
  const imageUrl =
    artist.albums.length > 0
      ? `http://localhost:3000/api/album-art/${artist.albums[0].id}`
      : "/placeholder.png";

  return (
    <Link href={`/artist/${artist.id}`}>
      <div className="p-4 rounded-lg hover:bg-neutral-800/50 transition-colors flex flex-col items-center gap-4">
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
