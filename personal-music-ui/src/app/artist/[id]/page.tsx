"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Play, AlertCircle } from "lucide-react";
import type { Song, Album, Artist } from "@/types";
import AlbumCard from "@/components/AlbumCard";
import PopularSongsList from "@/components/PopularSongsList";
import AboutCard from "@/components/AboutCard";
import clsx from "clsx";
import { apiClient } from "@/lib/api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type ArtistDetails = Artist & {
  albums: (Album & { songs: Song[]; artists: Artist[] })[];
};

const ArtistPageSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-[40vh] bg-neutral-800 rounded-lg" />
    <div className="p-8">
      <div className="h-32 w-32 bg-neutral-700 rounded-full mb-8 -mt-20 border-4 border-black relative z-10"></div>
      <section className="mb-12">
        <div className="h-8 w-32 bg-neutral-700 rounded mb-6"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-12 w-full bg-neutral-800/50 rounded-md"
            ></div>
          ))}
        </div>
      </section>
    </div>
  </div>
);

const ArtistDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [artist, setArtist] = useState<ArtistDetails | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;
    const handleScroll = () => {
      setScrollY(mainContent.scrollTop);
    };
    mainContent.addEventListener("scroll", handleScroll);
    return () => {
      mainContent.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    const getArtistDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient<ArtistDetails>(`/api/artists/${id}`);
        setArtist(data);
      } catch (err) {
        console.error("Failed to fetch artist details:", err);
        setError(err instanceof Error ? err.message : "Failed to load artist");
      } finally {
        setLoading(false);
      }
    };
    getArtistDetails();
  }, [id]);

  if (loading) {
    return <ArtistPageSkeleton />;
  }

  if (error || !artist) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-neutral-400">
        <AlertCircle size={48} className="mb-4 text-red-500" />
        <h2 className="text-xl font-bold text-white mb-2">Artist Not Found</h2>
        <p className="mb-6">
          {error || "The requested artist does not exist."}
        </p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-white transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const ALBUM_TRACK_THRESHOLD = 5;
  const studioAlbums = artist.albums.filter(
    (album) => album.songs.length > ALBUM_TRACK_THRESHOLD
  );
  const singlesAndEPs = artist.albums.filter(
    (album) => album.songs.length <= ALBUM_TRACK_THRESHOLD
  );

  const popularSongs = artist.albums
    .flatMap((album) =>
      album.songs.map((song) => ({
        ...song,
        album: {
          id: album.id,
          title: album.title,
          artists: album.artists,
          coverPath: album.coverPath,
        },
      }))
    )
    .slice(0, 5);

  const avatarUrl = artist.avatarUrl
    ? `${API_BASE_URL}/static${artist.avatarUrl}`
    : null;

  const headerImageUrl = artist.headerUrl
    ? `${API_BASE_URL}/static${artist.headerUrl}`
    : avatarUrl || "/placeholder.jpg";

  const headerTextOpacity = Math.max(0, 1 - scrollY / 150);
  const headerTextTransform = `translateY(${Math.min(
    100,
    scrollY / 3
  )}px) scale(${Math.max(0.8, 1 - scrollY / 1000)})`;
  const imageScale = 1 + scrollY / 5000;
  const imageTransform = `scale(${imageScale})`;

  return (
    <div>
      <header className="relative w-full h-auto rounded-lg overflow-hidden group">
        <div className="relative w-full h-0 pb-[40%] max-h-[500px] min-h-[340px]">
          <Image
            src={headerImageUrl}
            alt={`Cover of ${artist.name}`}
            fill
            className={clsx(
              "object-cover transition-all duration-700",
              !artist.headerUrl && "blur-xl scale-110 opacity-60"
            )}
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 100vw"
            unoptimized={headerImageUrl.startsWith(API_BASE_URL)}
            style={{
              transform: imageTransform,
              willChange: "transform",
            }}
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent" />

        <div
          className="absolute bottom-0 p-6 md:p-8 flex items-end gap-6 w-full"
          style={{
            opacity: headerTextOpacity,
            transform: headerTextTransform,
            willChange: "transform, opacity",
          }}
        >
          {avatarUrl && (
            <div className="relative w-32 h-32 md:w-40 md:h-40 shrink-0 rounded-full overflow-hidden shadow-2xl border-4 border-neutral-900/50">
              <Image
                src={avatarUrl}
                alt={artist.name}
                fill
                className="object-cover"
                unoptimized={avatarUrl.startsWith(API_BASE_URL)}
              />
            </div>
          )}

          <div className="flex flex-col gap-2 mb-2">
            <span className="font-bold text-sm md:text-base flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </div>
              Verified Artist
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter shadow-black drop-shadow-lg">
              {artist.name}
            </h1>
          </div>
        </div>
      </header>

      <div className="p-8">
        <div className="flex items-center gap-6 mb-8">
          <button
            className="bg-green-500 text-black p-4 rounded-full shadow-lg hover:scale-105 transition-transform"
            aria-label={`Play ${artist.name}`}
          >
            <Play
              size={28}
              fill="black"
              className="translate-x-0.5 text-black"
            />
          </button>

          <button className="px-4 py-1.5 border border-neutral-500 rounded-full text-sm font-bold hover:border-white transition-colors">
            Follow
          </button>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Popular</h2>
          <PopularSongsList songs={popularSongs} />
        </section>

        {artist.bio && artist.bioImageUrl && (
          <AboutCard
            bio={artist.bio}
            // 修复：也需要更新这里的 Bio 图片路径为 /static
            imageUrl={`${API_BASE_URL}/static${artist.bioImageUrl}`}
          />
        )}

        {studioAlbums.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Albums</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {studioAlbums.map((album) => (
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
        )}

        {singlesAndEPs.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Singles & EPs</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {singlesAndEPs.map((album) => (
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
        )}
      </div>
    </div>
  );
};

export default ArtistDetailPage;
