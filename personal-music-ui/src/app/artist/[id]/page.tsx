"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Play } from "lucide-react";
import type { Song, Album, Artist } from "@/types";
import AlbumCard from "@/components/AlbumCard";
import PopularSongsList from "@/components/PopularSongsList";
import AboutCard from "@/components/AboutCard";

type ArtistDetails = Artist & {
  albums: (Album & { songs: Song[]; artists: Artist[] })[];
};
const ArtistPageSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-[40vh] bg-neutral-800 rounded-lg" />
    <div className="p-8">
      <div className="h-16 w-16 bg-neutral-700 rounded-full mb-8"></div>
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
  const id = params.id as string;
  const [artist, setArtist] = useState<ArtistDetails | null>(null);
  const [scrollY, setScrollY] = useState(0);

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
        const res = await fetch(`http://localhost:3001/api/artists/${id}`, {
          cache: "no-store",
        });
        if (res.ok) {
          setArtist(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch artist details:", error);
      }
    };
    getArtistDetails();
  }, [id]);

  if (!artist) {
    return <ArtistPageSkeleton />;
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
        },
      }))
    )
    .slice(0, 5);
  const artistImageUrl = artist.headerUrl
    ? `http://localhost:3001/static${artist.headerUrl}`
    : artist.albums.length > 0
    ? `http://localhost:3001/static/covers/${artist.albums[0].id}.jpg`
    : "/placeholder.png";

  const headerTextOpacity = Math.max(0, 1 - scrollY / 150);
  const headerTextTransform = `translateY(${Math.min(
    100,
    scrollY / 3
  )}px) scale(${Math.max(0.8, 1 - scrollY / 1000)})`;
  const imageScale = 1 + scrollY / 5000;
  const imageTransform = `scale(${imageScale})`;

  return (
    <div>
      {}
      <header className="relative w-full h-auto rounded-lg overflow-hidden">
        {}
        <div className="relative w-full h-0 pb-[40%] max-h-[500px] min-h-[340px]">
          <Image
            src={artistImageUrl}
            alt={`Photo of ${artist.name}`}
            fill
            className="object-cover"
            priority
            style={{
              transform: imageTransform,
              willChange: "transform",
            }}
          />
        </div>

        {}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div
          className="absolute bottom-0 p-8 flex flex-col gap-4"
          style={{
            opacity: headerTextOpacity,
            transform: headerTextTransform,
            willChange: "transform, opacity",
          }}
        >
          <span className="font-bold">Artist</span>
          <h1 className="text-5xl lg:text-8xl font-black tracking-tighter">
            {artist.name}
          </h1>
        </div>
      </header>

      {}
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

        {artist.bio && artist.bioImageUrl && (
          <AboutCard
            bio={artist.bio}
            imageUrl={`http://localhost:3001/static${artist.bioImageUrl}`}
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
