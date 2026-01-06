"use client";

import type { Song } from "@/types";
import SongRowItem from "./SongRowItem";

interface PopularSongsListProps {
  songs: Song[];
}

const PopularSongsList = ({ songs }: PopularSongsListProps) => {
  return (
    <div className="flex flex-col">
      {songs.map((song, index) => (
        <SongRowItem key={song.id} song={song} index={index} queue={songs} />
      ))}
    </div>
  );
};

export default PopularSongsList;
