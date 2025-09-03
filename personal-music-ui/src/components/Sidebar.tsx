import React from "react";
import Link from "next/link";
import Image from "next/image";
// ▼▼▼ 新增导入 Plus 图标 ▼▼▼
import { Home, Search, Library, Plus } from "lucide-react";
// ▲▲▲ 新增导入 Plus 图标 ▲▲▲
import type { Artist, Playlist } from "@/types"; // 👈 导入 Playlist 类型

// (getArtists 函数保持不变)
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

// ▼▼▼ 新增一个函数来获取播放列表 ▼▼▼
async function getPlaylists(): Promise<Playlist[]> {
  try {
    const res = await fetch("http://localhost:3000/api/playlists", {
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
// ▲▲▲ 新增一个函数来获取播放列表 ▲▲▲

const Sidebar = async () => {
  // 同时获取艺术家和播放列表数据
  const artists = await getArtists();
  const playlists = await getPlaylists();

  return (
    <aside className="w-80 flex flex-col gap-2 bg-black p-2">
      {/* ... (Home 和 Search 部分保持不变) ... */}
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

      <div className="bg-neutral-900 rounded-lg flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4 text-neutral-300 font-bold hover:text-white transition-colors cursor-pointer">
            <Library size={24} />
            <span>Your Library</span>
          </div>
          {/* ▼▼▼ 新增创建播放列表的 "+" 按钮 ▼▼▼ */}
          <button
            className="text-neutral-400 hover:text-white transition-colors"
            title="Create playlist"
          >
            <Plus size={24} />
          </button>
          {/* ▲▲▲ 新增创建播放列表的 "+" 按钮 ▲▲▲ */}
        </div>
        <div className="flex-grow overflow-y-auto px-2 pb-2 custom-scrollbar">
          <nav>
            <ul>
              {/* 播放列表渲染 */}
              {playlists.map((playlist) => {
                // 尝试用播放列表第一首歌的专辑封面作为封面
                const imageUrl = playlist.songs[0]?.album?.id
                  ? `http://localhost:3000/api/album-art/${playlist.songs[0].album.id}`
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
                          className="rounded-md object-cover" // 播放列表用方形封面
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-white truncate">
                          {playlist.name}
                        </p>
                        <p className="text-sm text-neutral-400">
                          Playlist • {playlist._count.songs} songs
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
              {/* 艺术家渲染 */}
              {artists.map((artist) => {
                console.log(
                  "[Sidebar] Artist object:",
                  JSON.stringify(artist, null, 2)
                );
                const imageUrl = artist.avatarUrl
                  ? `http://localhost:3000/api/artist-image/${artist.avatarUrl
                      .split("/")
                      .map(encodeURIComponent)
                      .join("/")}`
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
