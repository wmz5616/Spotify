"use client";

import type { Artist } from "@/types";
import Image from "next/image";
import Link from "next/link";

interface ArtistSearchResultItemProps {
  artist: Artist & { albums?: { id: number }[] };
}

const ArtistSearchResultItem = ({ artist }: ArtistSearchResultItemProps) => {
  const imageUrl = artist.avatarUrl
    ? `http://localhost:3001/static${artist.avatarUrl}`
    : artist.albums && artist.albums.length > 0
    ? `http://localhost:3001/static/covers/${artist.albums[0].id}.jpg`
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
