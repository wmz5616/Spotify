import { create } from "zustand";
import type { Song } from "@/types";
import React from "react";

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
  isQueueOpen: boolean;
  isLoading: boolean;
  progress: {
    lastUpdateTime: number;
    rafId: number | null;
  };

  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  bassLevel: number; // 0 to 1 scale for bass intensity

  playSong: (song: Song, queue?: Song[]) => void;
  addToQueue: (song: Song) => void;
  playNext: (song: Song) => void;
  togglePlayPause: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setAudioRef: (ref: React.RefObject<HTMLAudioElement | null>) => void;
  setAudioAnalysis: (context: AudioContext, analyser: AnalyserNode) => void;
  setBassLevel: (level: number) => void;
  seek: (time: number) => void;
  playNextSong: () => void;
  playPreviousSong: () => void;
  handleSongEnd: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleQueue: () => void;
  setIsLoading: (loading: boolean) => void;
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
  isQueueOpen: false,
  isLoading: false,
  progress: {
    lastUpdateTime: 0,
    rafId: null,
  },

  audioContext: null,
  analyser: null,
  bassLevel: 0,

  playSong: (song, queue = []) => {
    const newQueue =
      queue.length > 0
        ? queue
        : [
            song,
            ...get().playQueue.slice(
              get().currentQueueIndex !== null
                ? get().currentQueueIndex! + 1
                : 0
            ),
          ];
    const newIndex = newQueue.findIndex((s) => s.id === song.id);

    set({
      currentSong: song,
      playQueue: newQueue,
      currentQueueIndex: newIndex !== -1 ? newIndex : null,
      isPlaying: true,
      isLoading: true,
      currentTime: 0,
    });
  },

  addToQueue: (song) => {
    set((state) => {
      if (state.playQueue.some((s) => s.id === song.id)) {
        return {};
      }
      return { playQueue: [...state.playQueue, song] };
    });
  },

  playNext: (song) => {
    set((state) => {
      if (state.currentQueueIndex === null) {
        return {
          currentSong: song,
          playQueue: [song],
          currentQueueIndex: 0,
          isPlaying: true,
          isLoading: true,
          currentTime: 0,
        };
      }

      const newQueue = [...state.playQueue];

      newQueue.splice(state.currentQueueIndex + 1, 0, song);

      return { playQueue: newQueue };
    });
  },

  togglePlayPause: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setAudioRef: (ref) => set({ audioRef: ref }),
  setAudioAnalysis: (context, analyser) =>
    set({ audioContext: context, analyser }),
  setBassLevel: (level) => set({ bassLevel: level }),
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
      return { playMode: "normal" };
    });
  },
  toggleQueue: () => set((state) => ({ isQueueOpen: !state.isQueueOpen })),
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
}));
