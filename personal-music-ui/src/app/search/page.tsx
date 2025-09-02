"use client";

import React, { useState, useEffect } from "react";
import { Search as SearchIcon } from "lucide-react";
import type { Artist, Album, Song } from "@/types";
import SongRowItem from "@/components/SongRowItem";
import AlbumCard from "@/components/AlbumCard";
import ArtistSearchResultItem from "@/components/ArtistSearchResultItem";

// 定义搜索结果的类型
interface SearchResults {
  artists: (Artist & { albums: { id: number }[] })[];
  albums: Album[];
  songs: Song[];
}

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);

  // 使用 Debouncing 技术，防止用户每输入一个字就发一次请求
  useEffect(() => {
    if (query.trim() === "") {
      setResults(null);
      return;
    }

    const debounceTimer = setTimeout(() => {
      fetch(`http://localhost:3000/api/search?q=${query}`)
        .then((res) => res.json())
        .then((data) => setResults(data));
    }, 300); // 延迟 300 毫秒

    return () => clearTimeout(debounceTimer);
  }, [query]);

  return (
    <div className="p-8">
      {/* 搜索框 */}
      <div className="relative mb-8">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="What do you want to listen to?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-neutral-700/80 rounded-full py-3 pl-12 pr-4 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-white"
        />
      </div>

      {/* 搜索结果展示 */}
      {results ? (
        <div className="flex flex-col gap-8">
          {/* 歌曲 */}
          {results.songs.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Songs</h2>
              {results.songs.map((song, index) => (
                <SongRowItem key={song.id} song={song} index={index} />
              ))}
            </section>
          )}

          {/* 艺人 */}
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

          {/* 专辑 */}
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

export default SearchPage;
