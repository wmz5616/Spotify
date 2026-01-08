"use client";

import type { Song } from "@/types";
import SongRowItem from "./SongRowItem";
import { FixedSizeList as List } from "react-window";

interface PopularSongsListProps {
  songs: Song[];
}

const PopularSongsList = ({ songs }: PopularSongsListProps) => {
  const ITEM_SIZE = 64;
  const listHeight = Math.min(songs.length * ITEM_SIZE, 600);

  return (
    <List
      height={listHeight}
      itemCount={songs.length}
      itemSize={ITEM_SIZE}
      width="100%"
      itemData={songs}
      overscanCount={5}
      className="scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent"
    >
      {({ index, style, data }) => (
        <SongRowItem
          key={data[index].id}
          song={data[index]}
          index={index}
          queue={data}
          style={style}
        />
      )}
    </List>
  );
};

export default PopularSongsList;
