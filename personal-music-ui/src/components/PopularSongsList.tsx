"use client";

import { usePlayerStore } from "@/store/usePlayerStore";
import type { Song, Artist, Album } from "@/types";
import { Play, Volume2 } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface PopularSong extends Song {
  album: {
    id: number;
    title: string;
    artists: Artist[];
  };
}

interface PopularSongsListProps {
  songs: PopularSong[];
}

const PopularSongsList = ({ songs }: PopularSongsListProps) => {
  const { playSong, currentSong, isPlaying } = usePlayerStore();

  return (
    <div>
      {songs.map((song, index) => {
        const isActive = song.id === currentSong?.id;
        return (
          <div
            key={song.id}
            onClick={() => playSong(song)}
            className={`grid grid-cols-[2rem_1fr_auto] gap-x-4 px-4 py-2 items-center rounded-md hover:bg-neutral-800/50 cursor-pointer group ${
              isActive ? "bg-neutral-700/50" : ""
            }`}
          >
            <div
              className={`flex justify-end items-center ${
                isActive ? "text-green-400" : "text-neutral-400"
              }`}
            >
              <span className="group-hover:hidden">{index + 1}</span>
              <Play
                size={16}
                className="hidden group-hover:block text-white"
                fill="currentColor"
              />
              {isActive && isPlaying && (
                <Volume2 size={16} className="absolute" />
              )}
            </div>
            <div className="font-medium truncate text-white">{song.title}</div>
            <div className="text-neutral-400 text-sm">
              {formatDuration(song.duration)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PopularSongsList;
