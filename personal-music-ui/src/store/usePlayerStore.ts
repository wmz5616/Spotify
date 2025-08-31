import { create } from "zustand";
import type { Song } from "@/types";
import React from "react";

interface PlayerState {
  isPlaying: boolean;
  currentSong: Song | null;
  volume: number;
  currentTime: number;
  duration: number;

  // 修正 1: 状态本身的类型也需要允许 ref.current 为 null
  audioRef: React.RefObject<HTMLAudioElement | null> | null;

  playSong: (song: Song) => void;
  togglePlayPause: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;

  // 修正 2: 函数参数的类型同样需要允许 ref.current 为 null
  setAudioRef: (ref: React.RefObject<HTMLAudioElement | null>) => void;

  seek: (time: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  currentSong: null,
  volume: 0.8,
  currentTime: 0,
  duration: 0,
  audioRef: null,

  playSong: (song) =>
    set({ currentSong: song, isPlaying: true, currentTime: 0 }),
  togglePlayPause: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration: duration }),
  setAudioRef: (ref) => set({ audioRef: ref }),
  seek: (time) => {
    const { audioRef } = get();
    if (audioRef?.current) {
      audioRef.current.currentTime = time;
    }
  },
}));
