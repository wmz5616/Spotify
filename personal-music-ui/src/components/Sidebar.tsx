"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Library,
  ArrowLeft,
  ArrowRight,
  ListMusic,
  Mic2,
} from "lucide-react";
import clsx from "clsx";
import type { Playlist, Artist } from "@/types";
import { usePlayerStore } from "@/store/usePlayerStore";
import { apiClient, getAuthenticatedSrc } from "@/lib/api-client";

const LibrarySkeleton = ({ collapsed }: { collapsed: boolean }) => (
  <div className="space-y-4 p-2 animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className={clsx(
          "flex items-center",
          collapsed ? "justify-center" : "gap-3"
        )}
      >
        <div className="w-12 h-12 bg-neutral-800 rounded-md shrink-0" />
        {!collapsed && (
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-neutral-800 rounded w-2/3" />
            <div className="h-3 bg-neutral-800 rounded w-1/2" />
          </div>
        )}
      </div>
    ))}
  </div>
);

const Sidebar = () => {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar } = usePlayerStore();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [playlistsData, artistsData] = await Promise.all([
          apiClient<Playlist[]>("/api/playlists"),
          apiClient<Artist[]>("/api/artists"),
        ]);

        setPlaylists(playlistsData || []);
        setArtists(artistsData || []);
        setError(false);
      } catch (e) {
        console.error("Sidebar data fetch failed:", e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const routes = [
    {
      label: "Home",
      icon: Home,
      href: "/",
      active: pathname === "/",
    },
    {
      label: "Search",
      icon: Search,
      href: "/search",
      active: pathname === "/search",
    },
  ];

  return (
    <div
      className={clsx(
        "flex flex-col h-full bg-black text-white transition-all duration-300 ease-in-out border-r border-neutral-800",
        isSidebarCollapsed ? "w-[80px]" : "w-[300px]"
      )}
    >
      <div className="p-6 space-y-4">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={clsx(
              "flex items-center gap-x-4 text-neutral-400 hover:text-white transition cursor-pointer",
              route.active && "text-white",
              isSidebarCollapsed && "justify-center"
            )}
          >
            <route.icon size={24} />
            {!isSidebarCollapsed && (
              <p className="font-medium truncate">{route.label}</p>
            )}
          </Link>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto bg-neutral-900/50 mx-2 mb-2 rounded-lg [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="p-4">
          <div
            className={clsx(
              "flex items-center justify-between mb-4 text-neutral-400",
              isSidebarCollapsed && "flex-col gap-4"
            )}
          >
            <div
              className={clsx(
                "flex items-center gap-x-2",
                isSidebarCollapsed && "justify-center"
              )}
            >
              <Library size={24} />
              {!isSidebarCollapsed && (
                <p className="font-medium truncate">Your Library</p>
              )}
            </div>
            <button
              onClick={toggleSidebar}
              className="hover:text-white transition p-1"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? (
                <ArrowRight size={20} />
              ) : (
                <ArrowLeft size={20} />
              )}
            </button>
          </div>

          {loading ? (
            <LibrarySkeleton collapsed={isSidebarCollapsed} />
          ) : error ? (
            <div className="text-center text-red-400 text-sm mt-4">
              {!isSidebarCollapsed && "无法加载媒体库"}
            </div>
          ) : (
            <div className="space-y-2">
              {playlists.map((playlist) => (
                <Link
                  key={`playlist-${playlist.id}`}
                  href={`/playlist/${playlist.id}`}
                  className={clsx(
                    "flex items-center gap-x-3 p-2 rounded-md hover:bg-neutral-800/50 cursor-pointer group transition",
                    pathname === `/playlist/${playlist.id}` &&
                      "bg-neutral-800 text-green-500",
                    isSidebarCollapsed && "justify-center"
                  )}
                >
                  <div className="w-12 h-12 bg-neutral-800 rounded-md flex items-center justify-center shrink-0 group-hover:bg-neutral-700 transition">
                    <ListMusic
                      className={clsx(
                        "text-neutral-400 group-hover:text-white",
                        pathname === `/playlist/${playlist.id}` &&
                          "text-green-500"
                      )}
                      size={24}
                    />
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="flex flex-col overflow-hidden">
                      <p
                        className={clsx(
                          "truncate font-medium",
                          pathname === `/playlist/${playlist.id}`
                            ? "text-green-500"
                            : "text-white"
                        )}
                      >
                        {playlist.name}
                      </p>
                      <p className="text-sm text-neutral-400 truncate">
                        Playlist
                      </p>
                    </div>
                  )}
                </Link>
              ))}

              {artists.map((artist) => {
                let avatarUrl = null;
                if (artist.avatarUrl) {
                  const pathWithPublic = artist.avatarUrl.startsWith("/public")
                    ? artist.avatarUrl
                    : `/public${artist.avatarUrl}`;
                  avatarUrl = getAuthenticatedSrc(pathWithPublic);
                }

                return (
                  <Link
                    key={`artist-${artist.id}`}
                    href={`/artist/${artist.id}`}
                    className={clsx(
                      "flex items-center gap-x-3 p-2 rounded-md hover:bg-neutral-800/50 cursor-pointer group transition",
                      pathname === `/artist/${artist.id}` &&
                        "bg-neutral-800 text-green-500",
                      isSidebarCollapsed && "justify-center"
                    )}
                  >
                    <div className="w-12 h-12 relative rounded-full overflow-hidden bg-neutral-800 shrink-0 flex items-center justify-center">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          fill
                          alt={artist.name}
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <Mic2 className="text-neutral-400" size={24} />
                      )}
                    </div>
                    {!isSidebarCollapsed && (
                      <div className="flex flex-col overflow-hidden">
                        <p
                          className={clsx(
                            "truncate font-medium",
                            pathname === `/artist/${artist.id}`
                              ? "text-green-500"
                              : "text-white"
                          )}
                        >
                          {artist.name}
                        </p>
                        <p className="text-sm text-neutral-400 truncate">
                          Artist
                        </p>
                      </div>
                    )}
                  </Link>
                );
              })}
              {!loading && playlists.length === 0 && artists.length === 0 && (
                <div className="p-4 text-center text-neutral-400 text-sm">
                  {!isSidebarCollapsed && "暂无音乐"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
