import React from "react";
import Image from "next/image";
import AlbumCard from "@/components/AlbumCard";
import { Play } from "lucide-react";
import type { Song, Album, Artist } from "@/types";
import SongRowItem from "@/components/SongRowItem";
import PopularSongsList from "@/components/PopularSongsList";

type ArtistDetails = Artist & {
  albums: (Album & { songs: Song[]; artists: Artist[] })[];
};

async function getArtistDetails(id: string): Promise<ArtistDetails | null> {
  try {
    const res = await fetch(`http://localhost:3000/api/artists/${id}`, {
      cache: "no-store",
    });
    if (res.ok) {
      return res.json();
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch artist details:", error);
    return null;
  }
}

interface ArtistDetailPageProps {
  params: { id: string };
}

const ArtistDetailPage = async ({ params }: ArtistDetailPageProps) => {
  const artist = await getArtistDetails(params.id);

  if (!artist) {
    return (
      <div className="p-10 text-center">
        Artist not found or failed to load.
      </div>
    );
  }

  const popularSongs = artist.albums
    .flatMap((album) =>
      album.songs.map((song) => ({
        ...song,
        album: {
          id: album.id,
          title: album.title,
          artists: album.artists,
        },
      }))
    )
    .slice(0, 5);

  const artistImageUrl = artist.headerUrl
    ? `http://localhost:3000/api/artist-image/${artist.headerUrl}`
    : artist.albums.length > 0
    ? `http://localhost:3000/api/album-art/${artist.albums[0].id}`
    : "/placeholder.png";

  return (
    <div className="relative">
      <header className="relative flex flex-col md:flex-row items-end gap-6 p-8 h-[40vh] text-white">
        <Image
          src={artistImageUrl}
          alt={`Photo of ${artist.name}`}
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="relative flex flex-col gap-4 z-10">
          <span className="font-bold">Artist</span>
          <h1 className="text-5xl lg:text-8xl font-black tracking-tighter">
            {artist.name}
          </h1>
        </div>
      </header>

      <div className="p-8">
        <div className="flex items-center gap-6 mb-8">
          <button
            className="bg-green-500 text-black p-4 rounded-full shadow-lg hover:scale-105 transition-transform"
            aria-label={`Play ${artist.name}`}
          >
            <Play size={28} fill="black" />
          </button>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Popular</h2>
          <PopularSongsList songs={popularSongs} />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6">Albums</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {artist.albums.map((album) => (
              <AlbumCard
                key={album.id}
                album={{
                  ...album,
                  _count: { songs: album.songs.length },
                }}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ArtistDetailPage;
