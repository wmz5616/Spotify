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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
            <div className="h-3 bg-neutral-800 rounded w-1/3" />
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [playlistsRes, artistsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/playlists`),
          fetch(`${API_BASE_URL}/api/artists`),
        ]);

        if (playlistsRes.ok) {
          const data = await playlistsRes.json();
          setPlaylists(data);
        }

        if (artistsRes.ok) {
          const data = await artistsRes.json();
          setArtists(data);
        }
      } catch (error) {
        console.error("Failed to fetch library data:", error);
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
        "flex flex-col gap-2 h-full p-2 transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "w-[80px]" : "w-[300px]"
      )}
    >
      <div className="bg-neutral-900 rounded-lg p-5 flex flex-col gap-y-4">
        {routes.map((route) => (
          <Link
            key={route.label}
            href={route.href}
            title={isSidebarCollapsed ? route.label : undefined}
            className={clsx(
              "flex items-center font-medium transition py-2 rounded-md",
              isSidebarCollapsed ? "justify-center" : "gap-x-4 px-4",
              route.active
                ? "bg-white/10 text-white"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            )}
          >
            <route.icon size={26} />
            {!isSidebarCollapsed && <p className="text-base">{route.label}</p>}
          </Link>
        ))}
      </div>

      <div className="bg-neutral-900 rounded-lg h-full flex flex-col overflow-hidden">
        <div
          className={clsx(
            "pt-4 pb-2 flex items-center shadow-md z-10",
            isSidebarCollapsed ? "justify-center px-2" : "justify-between px-5"
          )}
        >
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-x-2 text-neutral-400 hover:text-white transition cursor-pointer">
              <Library size={26} />
              <p className="font-bold text-base">Your Library</p>
            </div>
          )}

          <button
            onClick={toggleSidebar}
            className="text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full p-1 transition"
            title={isSidebarCollapsed ? "Expand Library" : "Collapse Library"}
          >
            {isSidebarCollapsed ? (
              <ArrowRight size={26} />
            ) : (
              <ArrowLeft size={20} />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {loading ? (
            <LibrarySkeleton collapsed={isSidebarCollapsed} />
          ) : (
            <div className="flex flex-col gap-y-1">
              {playlists.map((playlist) => (
                <Link
                  key={`playlist-${playlist.id}`}
                  href={`/playlist/${playlist.id}`}
                  title={isSidebarCollapsed ? playlist.name : undefined}
                  className={clsx(
                    "flex items-center p-2 rounded-md transition group",
                    isSidebarCollapsed ? "justify-center" : "gap-x-3",
                    pathname === `/playlist/${playlist.id}`
                      ? "bg-white/10"
                      : "hover:bg-neutral-800"
                  )}
                >
                  <div className="relative min-w-[48px] h-12 rounded-md overflow-hidden bg-neutral-800 flex items-center justify-center shrink-0">
                    {playlist.songs?.[0]?.album?.coverPath ? (
                      <Image
                        src={`${API_BASE_URL}/static${playlist.songs[0].album.coverPath}`}
                        fill
                        alt={playlist.name}
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <ListMusic className="text-neutral-400" size={24} />
                    )}
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
                        Playlist • {playlist._count?.songs || 0} songs
                      </p>
                    </div>
                  )}
                </Link>
              ))}

              {artists.map((artist) => {
                const avatarUrl = artist.avatarUrl
                  ? `${API_BASE_URL}/static${artist.avatarUrl}`
                  : null;

                return (
                  <Link
                    key={`artist-${artist.id}`}
                    href={`/artist/${artist.id}`}
                    title={isSidebarCollapsed ? artist.name : undefined}
                    className={clsx(
                      "flex items-center p-2 rounded-md transition group",
                      isSidebarCollapsed ? "justify-center" : "gap-x-3",
                      pathname === `/artist/${artist.id}`
                        ? "bg-white/10"
                        : "hover:bg-neutral-800"
                    )}
                  >
                    <div className="relative min-w-[48px] h-12 rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center border border-transparent group-hover:border-neutral-700 shrink-0">
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
                      </div>
                    )}
                  </Link>
                );
              })}
              {!loading && playlists.length === 0 && artists.length === 0 && (
                <div className="p-4 text-center text-neutral-400 text-sm">
                  {!isSidebarCollapsed && "No music found."}
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
