import { create } from "zustand";
import type { Song } from "@/types";
import React from "react";

interface PlayerState {
  isPlaying: boolean;
  currentSong: Song | null;
  volume: number;
  currentTime: number;
  duration: number;
  audioRef: React.RefObject<HTMLAudioElement | null> | null;

  // 新增：播放队列和当前播放索引
  playQueue: Song[];
  currentQueueIndex: number | null;

  // 修改：播放歌曲的方法
  playSong: (song: Song, queue?: Song[]) => void;

  togglePlayPause: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setAudioRef: (ref: React.RefObject<HTMLAudioElement | null>) => void;
  seek: (time: number) => void;

  // 新增：播放下一首和上一首的方法
  playNextSong: () => void;
  playPreviousSong: () => void;
  handleSongEnd: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  currentSong: null,
  volume: 0.8,
  currentTime: 0,
  duration: 0,
  audioRef: null,

  playQueue: [],
  currentQueueIndex: null,

  playSong: (song, queue = []) => {
    const newQueue = queue.length > 0 ? queue : [song];
    const newIndex = newQueue.findIndex((s) => s.id === song.id);

    set({
      currentSong: song,
      playQueue: newQueue,
      currentQueueIndex: newIndex !== -1 ? newIndex : null,
      isPlaying: true,
      currentTime: 0,
    });
  },

  togglePlayPause: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setAudioRef: (ref) => set({ audioRef: ref }),

  seek: (time) => {
    const { audioRef } = get();
    if (audioRef?.current) {
      audioRef.current.currentTime = time;
    }
  },

  playNextSong: () => {
    const { playQueue, currentQueueIndex } = get();
    if (playQueue.length > 0 && currentQueueIndex !== null) {
      const nextIndex = (currentQueueIndex + 1) % playQueue.length;
      get().playSong(playQueue[nextIndex], playQueue);
    }
  },

  playPreviousSong: () => {
    const { playQueue, currentQueueIndex } = get();
    if (playQueue.length > 0 && currentQueueIndex !== null) {
      const prevIndex =
        (currentQueueIndex - 1 + playQueue.length) % playQueue.length;
      get().playSong(playQueue[prevIndex], playQueue);
    }
  },

  handleSongEnd: () => {
    // 歌曲播放完后自动播放下一首
    get().playNextSong();
  },
}));
