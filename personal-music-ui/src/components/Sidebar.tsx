import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, Search, Library, Plus } from "lucide-react";
import type { Artist, Playlist } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function getArtists(): Promise<Artist[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/artists`, {
      cache: "no-store",
    });
    if (res.ok) {
      return res.json();
    }
    console.error("Failed to fetch artists:", res.statusText);
    return [];
  } catch (error) {
    console.error("An error occurred while fetching artists:", error);
    return [];
  }
}

async function getPlaylists(): Promise<Playlist[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/playlists`, {
      cache: "no-store",
    });
    if (res.ok) {
      return res.json();
    }
    console.error("Failed to fetch playlists:", res.statusText);
    return [];
  } catch (error) {
    console.error("An error occurred while fetching playlists:", error);
    return [];
  }
}

const Sidebar = async () => {
  const artists = await getArtists();
  const playlists = await getPlaylists();

  return (
    <aside className="w-80 flex flex-col gap-2 bg-black p-2 h-full">
      <div className="bg-neutral-900 rounded-lg p-2">
        <nav>
          <ul>
            <li>
              <Link
                href="/"
                className="flex items-center gap-4 p-3 text-neutral-300 font-bold hover:text-white transition-colors"
              >
                <Home size={24} />
                <span>Home</span>
              </Link>
            </li>
            <li>
              <Link
                href="/search"
                className="flex items-center gap-4 p-3 text-neutral-300 font-bold hover:text-white transition-colors"
              >
                <Search size={24} />
                <span>Search</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="bg-neutral-900 rounded-lg flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between p-4 px-5 shadow-sm z-10">
          <div className="flex items-center gap-2 text-neutral-400 font-bold hover:text-white transition-colors cursor-pointer">
            <Library size={24} />
            <span>Your Library</span>
          </div>
          <button
            className="text-neutral-400 hover:text-white transition-colors hover:bg-neutral-800 rounded-full p-1"
            title="Create playlist"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto px-2 pb-2 custom-scrollbar">
          <nav>
            <ul className="flex flex-col gap-1">
              {playlists.map((playlist) => {
                const imageUrl = playlist.songs[0]?.album?.id
                  ? `${API_BASE_URL}/api/covers/${playlist.songs[0].album.id}?size=64`
                  : "/placeholder.png";

                return (
                  <li key={playlist.id}>
                    <Link
                      href={`/playlist/${playlist.id}`}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-neutral-800/50 transition-colors"
                    >
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                          src={imageUrl}
                          alt={playlist.name}
                          fill
                          className="rounded-md object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-white truncate text-sm">
                          {playlist.name}
                        </p>
                        <p className="text-xs text-neutral-400 truncate">
                          Playlist • {playlist._count.songs} songs
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}

              {artists.map((artist) => {
                const imageUrl = artist.avatarUrl
                  ? `${API_BASE_URL}${artist.avatarUrl}`
                  : artist.albums?.[0]?.id
                  ? `${API_BASE_URL}/api/covers/${artist.albums[0].id}?size=64`
                  : "/placeholder.png";

                return (
                  <li key={artist.id}>
                    <Link
                      href={`/artist/${artist.id}`}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-neutral-800/50 transition-colors group"
                    >
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                          src={imageUrl}
                          alt={artist.name}
                          fill
                          className="rounded-full object-cover group-hover:scale-105 transition-transform"
                          unoptimized
                        />
                      </div>
                      <div className="flex flex-col justify-center overflow-hidden">
                        <p className="font-semibold text-white truncate text-sm">
                          {artist.name}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
