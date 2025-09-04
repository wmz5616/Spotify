import { create } from "zustand";
import type { Song } from "@/types";
import React from "react";

// 播放模式现在包含 "repeat-one"
export type PlayMode = "normal" | "repeat-all" | "repeat-one" | "shuffle";

interface PlayerState {
  isPlaying: boolean;
  currentSong: Song | null;
  volume: number;
  currentTime: number;
  duration: number;
  audioRef: React.RefObject<HTMLAudioElement | null> | null;
  playQueue: Song[];
  currentQueueIndex: number | null;
  playMode: PlayMode;

  playSong: (song: Song, queue?: Song[]) => void;
  togglePlayPause: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setAudioRef: (ref: React.RefObject<HTMLAudioElement | null>) => void;
  seek: (time: number) => void;
  playNextSong: () => void;
  playPreviousSong: () => void;
  handleSongEnd: () => void;
  // 分离成两个独立的方法，逻辑更清晰
  toggleShuffle: () => void;
  toggleRepeat: () => void;
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
  playMode: "normal",

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
    const { playQueue, currentQueueIndex, playMode } = get();
    if (playQueue.length === 0 || currentQueueIndex === null) return;

    if (playMode === "shuffle") {
      let nextIndex = Math.floor(Math.random() * playQueue.length);
      if (playQueue.length > 1 && nextIndex === currentQueueIndex) {
        nextIndex = (nextIndex + 1) % playQueue.length;
      }
      get().playSong(playQueue[nextIndex], playQueue);
    } else {
      const nextIndex = (currentQueueIndex + 1) % playQueue.length;
      if (playMode === "normal" && nextIndex === 0) {
        // 在普通模式下，播放完列表后停止
        set({ isPlaying: false });
      } else {
        get().playSong(playQueue[nextIndex], playQueue);
      }
    }
  },

  playPreviousSong: () => {
    const { playQueue, currentQueueIndex } = get();
    if (playQueue.length === 0 || currentQueueIndex === null) return;

    const prevIndex =
      (currentQueueIndex - 1 + playQueue.length) % playQueue.length;
    get().playSong(playQueue[prevIndex], playQueue);
  },

  handleSongEnd: () => {
    const { playMode, audioRef } = get();
    if (playMode === "repeat-one" && audioRef?.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      get().playNextSong();
    }
  },

  toggleShuffle: () => {
    set((state) => ({
      playMode: state.playMode === "shuffle" ? "normal" : "shuffle",
    }));
  },

  toggleRepeat: () => {
    set((state) => {
      if (state.playMode === "normal") return { playMode: "repeat-all" };
      if (state.playMode === "repeat-all") return { playMode: "repeat-one" };
      // 从 repeat-one 或 shuffle 切换回 normal
      return { playMode: "normal" };
    });
  },
}));
