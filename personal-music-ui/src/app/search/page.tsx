"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation"; // 1. 导入 useSearchParams
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
  // 2. 从 URL 中获取搜索词 'q'
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState<SearchResults | null>(null);

  useEffect(() => {
    if (query.trim() === "") {
      setResults(null);
      return;
    }

    // 3. 直接根据 query 获取数据，不再需要 debounce
    fetch(`http://localhost:3000/api/search?q=${query}`)
      .then((res) => res.json())
      .then((data) => setResults(data));
  }, [query]);

  return (
    <div className="pt-12">
      {" "}
      {/* 4. 增加一些上边距，避免内容被全局Header遮挡 */}
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
          <p>Search for your favorite songs, artists, or albums.</p>
        </div>
      )}
    </div>
  );
};

// 5. 使用 Suspense 包裹，因为 useSearchParams 必须在 Suspense 内部使用
const SearchPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <SearchContent />
  </Suspense>
);

export default SearchPage;
