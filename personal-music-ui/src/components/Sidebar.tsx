import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, Search, Library } from "lucide-react";
import type { Artist } from "@/types";

async function getArtists(): Promise<Artist[]> {
  try {
    const res = await fetch("http://localhost:3000/api/artists", {
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

const Sidebar = async () => {
  const artists = await getArtists();

  return (
    <aside className="row-span-2 flex flex-col gap-2 bg-black p-2">
      <div className="bg-neutral-900 rounded-lg p-2">
        <nav>
          <ul>
            <li>
              <Link
                href="/"
                className="flex items-center gap-4 p-2 text-neutral-300 font-bold hover:text-white transition-colors"
              >
                <Home size={24} />
                <span>Home</span>
              </Link>
            </li>
            <li>
              <Link
                href="/search"
                className="flex items-center gap-4 p-2 text-neutral-300 font-bold hover:text-white transition-colors"
              >
                <Search size={24} />
                <span>Search</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="bg-neutral-900 rounded-lg flex-grow flex flex-col">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4 text-neutral-300 font-bold hover:text-white transition-colors cursor-pointer">
            <Library size={24} />
            <span>Your Library</span>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto px-2 pb-2">
          <nav>
            <ul>
              {artists.map((artist) => {
                const imageUrl = artist.avatarUrl
                  ? `http://localhost:3000/api/artist-image/${artist.avatarUrl}`
                  : artist.albums && artist.albums.length > 0
                  ? `http://localhost:3000/api/album-art/${artist.albums[0].id}`
                  : "/placeholder.png";

                return (
                  <li key={artist.id}>
                    <Link
                      href={`/artist/${artist.id}`}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-neutral-800/50 transition-colors"
                    >
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                          src={imageUrl}
                          alt={artist.name}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-white truncate">
                          {artist.name}
                        </p>
                        <p className="text-sm text-neutral-400">Artist</p>
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
