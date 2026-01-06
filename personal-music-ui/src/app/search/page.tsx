"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Artist, Album, Song } from "@/types";
import SongRowItem from "@/components/SongRowItem";
import AlbumCard from "@/components/AlbumCard";
import ArtistSearchResultItem from "@/components/ArtistSearchResultItem";

interface SearchResults {
  artists: (Artist & { albums: { id: number }[] })[];
  albums: Album[];
  songs: Song[];
}

const SearchContent = () => {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState<SearchResults | null>(null);

  useEffect(() => {
    if (query.trim() === "") {
      setResults(null);
      return;
    }

    fetch(`http://localhost:3001/api/search?q=${query}`)
      .then((res) => res.json())
      .then((data) => setResults(data));
  }, [query]);

  return (
    <div className="pt-12">
      {" "}
      {}
      {results ? (
        <div className="flex flex-col gap-8">
          {results.songs.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Songs</h2>
              {results.songs.map((song, index) => (
                <SongRowItem key={song.id} song={song} index={index} />
              ))}
            </section>
          )}

          {results.artists.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Artists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {results.artists.map((artist) => (
                  <ArtistSearchResultItem key={artist.id} artist={artist} />
                ))}
              </div>
            </section>
          )}

          {results.albums.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Albums</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {results.albums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="text-center text-neutral-500 mt-16">
          <p>搜索你喜欢的歌曲、艺术家或专辑</p>
        </div>
      )}
    </div>
  );
};

const SearchPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <SearchContent />
  </Suspense>
);

export default SearchPage;
