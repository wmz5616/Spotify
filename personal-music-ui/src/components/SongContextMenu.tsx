"use client";

import React from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import {
  Play,
  ListPlus,
  CornerDownRight,
  Copy,
  User,
  Disc,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useToastStore } from "@/store/useToastStore";
import type { Song } from "@/types";

interface SongContextMenuProps {
  children: React.ReactNode;
  song: Song;
}

const SongContextMenu = ({ children, song }: SongContextMenuProps) => {
  const router = useRouter();
  const { playSong, addToQueue, insertNext } = usePlayerStore();
  const { addToast } = useToastStore();

  const handlePlay = () => {
    playSong(song);
  };

  const handleAddToQueue = () => {
    addToQueue(song);
    addToast("Added to queue");
  };

  const handlePlayNext = () => {
    insertNext(song);
    addToast("Will play next");
  };

  const handleGoToArtist = () => {
    if (song.album?.artists?.[0]?.id) {
      router.push(`/artist/${song.album.artists[0].id}`);
    }
  };

  const handleGoToAlbum = () => {
    if (song.album?.id) {
      router.push(`/album/${song.album.id}`);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/album/${song.album?.id}`;
    navigator.clipboard.writeText(link);
    addToast("Link copied to clipboard", <Check size={16} />);
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content className="min-w-[220px] bg-[#282828] rounded-md overflow-hidden p-[5px] shadow-[0px_10px_38px_-10px_rgba(22,23,24,0.35),0px_10px_20px_-15px_rgba(22,23,24,0.2)] border border-[#3e3e3e] animate-in fade-in zoom-in-95 duration-200 z-[100]">
          <ContextMenu.Item
            className="group text-sm text-white leading-none flex items-center h-[35px] px-[10px] relative select-none outline-none data-[highlighted]:bg-[#3e3e3e] data-[highlighted]:text-white rounded-[3px] cursor-default gap-3"
            onSelect={handlePlay}
          >
            <Play size={16} />
            Add to Queue
          </ContextMenu.Item>

          <ContextMenu.Item
            className="group text-sm text-white leading-none flex items-center h-[35px] px-[10px] relative select-none outline-none data-[highlighted]:bg-[#3e3e3e] data-[highlighted]:text-white rounded-[3px] cursor-default gap-3"
            onSelect={handlePlayNext}
          >
            <CornerDownRight size={16} />
            Play Next
          </ContextMenu.Item>

          <ContextMenu.Item
            className="group text-sm text-white leading-none flex items-center h-[35px] px-[10px] relative select-none outline-none data-[highlighted]:bg-[#3e3e3e] data-[highlighted]:text-white rounded-[3px] cursor-default gap-3"
            onSelect={handleAddToQueue}
          >
            <ListPlus size={16} />
            Add to Queue
          </ContextMenu.Item>

          <ContextMenu.Separator className="h-[1px] bg-[#3e3e3e] m-[5px]" />

          <ContextMenu.Item
            className="group text-sm text-white leading-none flex items-center h-[35px] px-[10px] relative select-none outline-none data-[highlighted]:bg-[#3e3e3e] data-[highlighted]:text-white rounded-[3px] cursor-default gap-3"
            onSelect={handleGoToArtist}
            disabled={!song.album?.artists?.[0]}
          >
            <User size={16} />
            Go to Artist
          </ContextMenu.Item>

          <ContextMenu.Item
            className="group text-sm text-white leading-none flex items-center h-[35px] px-[10px] relative select-none outline-none data-[highlighted]:bg-[#3e3e3e] data-[highlighted]:text-white rounded-[3px] cursor-default gap-3"
            onSelect={handleGoToAlbum}
            disabled={!song.album?.id}
          >
            <Disc size={16} />
            Go to Album
          </ContextMenu.Item>

          <ContextMenu.Separator className="h-[1px] bg-[#3e3e3e] m-[5px]" />

          <ContextMenu.Item
            className="group text-sm text-white leading-none flex items-center h-[35px] px-[10px] relative select-none outline-none data-[highlighted]:bg-[#3e3e3e] data-[highlighted]:text-white rounded-[3px] cursor-default gap-3"
            onSelect={handleCopyLink}
          >
            <Copy size={16} />
            Copy Song Link
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};

export default SongContextMenu;
