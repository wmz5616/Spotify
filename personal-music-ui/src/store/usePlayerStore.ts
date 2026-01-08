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
  playQueue: Song[];
  currentQueueIndex: number;
  playMode: PlayMode;
  isQueueOpen: boolean;
  isLoading: boolean;
  isFullScreen: boolean;

  audioRef: React.RefObject<HTMLAudioElement | null> | null;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  bassLevel: number;

  playSong: (song: Song, queue?: Song[]) => void;
  togglePlayPause: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setAudioRef: (ref: React.RefObject<HTMLAudioElement | null>) => void;
  setAudioAnalysis: (context: AudioContext, analyser: AnalyserNode) => void;
  setBassLevel: (level: number) => void;
  seek: (time: number) => void;

  playNext: () => void;
  playPrev: () => void;
  insertNext: (song: Song) => void;
  addToQueue: (song: Song) => void;
  handleSongEnd: () => void;

  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleQueue: () => void;
  setIsLoading: (loading: boolean) => void;
  toggleFullScreen: () => void;
  setFullScreen: (isFull: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  currentSong: null,
  volume: 0.8,
  currentTime: 0,
  duration: 0,
  playQueue: [],
  currentQueueIndex: -1,
  playMode: "normal",
  isQueueOpen: false,
  isLoading: false,
  isFullScreen: false,
  audioRef: null,
  audioContext: null,
  analyser: null,
  bassLevel: 0,

  playSong: (song, queue) => {
    const state = get();
    let newQueue = state.playQueue;
    let newIndex = -1;

    if (queue && queue.length > 0) {
      newQueue = queue;
      newIndex = newQueue.findIndex((s) => s.id === song.id);
    } else if (state.playQueue.some((s) => s.id === song.id)) {
      newIndex = state.playQueue.findIndex((s) => s.id === song.id);
    } else {
      newQueue = [...state.playQueue, song];
      newIndex = newQueue.length - 1;
    }

    set({
      currentSong: song,
      playQueue: newQueue,
      currentQueueIndex: newIndex,
      isPlaying: true,
      isLoading: true,
      currentTime: 0,
    });
  },

  togglePlayPause: () => {
    const { isPlaying, currentSong, audioRef } = get();
    if (!currentSong) return;

    if (isPlaying) {
      audioRef?.current?.pause();
    } else {
      audioRef?.current?.play();
    }
    set({ isPlaying: !isPlaying });
  },

  setVolume: (volume) => {
    const { audioRef } = get();
    if (audioRef?.current) {
      audioRef.current.volume = volume;
    }
    set({ volume });
  },

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
    set({ currentTime: time });
  },

  playNext: () => {
    const { playQueue, currentQueueIndex, playMode } = get();
    if (playQueue.length === 0) return;

    let nextIndex = -1;

    if (playMode === "shuffle") {
      nextIndex = Math.floor(Math.random() * playQueue.length);
      if (playQueue.length > 1 && nextIndex === currentQueueIndex) {
        nextIndex = (nextIndex + 1) % playQueue.length;
      }
    } else {
      nextIndex = (currentQueueIndex + 1) % playQueue.length;

      if (
        playMode === "normal" &&
        nextIndex === 0 &&
        currentQueueIndex === playQueue.length - 1
      ) {
        set({ isPlaying: false });
        return;
      }
    }

    const nextSong = playQueue[nextIndex];
    get().playSong(nextSong, playQueue);
  },

  playPrev: () => {
    const { playQueue, currentQueueIndex, currentTime, audioRef } = get();
    if (playQueue.length === 0) return;

    if (currentTime > 3 && audioRef?.current) {
      audioRef.current.currentTime = 0;
      return;
    }

    const prevIndex =
      (currentQueueIndex - 1 + playQueue.length) % playQueue.length;
    const prevSong = playQueue[prevIndex];
    get().playSong(prevSong, playQueue);
  },

  insertNext: (song) => {
    const { playQueue, currentQueueIndex } = get();
    const newQueue = [...playQueue];
    const insertIndex = currentQueueIndex + 1;
    newQueue.splice(insertIndex, 0, song);

    if (playQueue.length === 0) {
      get().playSong(song, [song]);
    } else {
      set({ playQueue: newQueue });
    }
  },

  addToQueue: (song) => {
    set((state) => {
      if (state.playQueue.some((s) => s.id === song.id)) return state;
      return { playQueue: [...state.playQueue, song] };
    });
  },

  handleSongEnd: () => {
    const { playMode, audioRef } = get();
    if (playMode === "repeat-one" && audioRef?.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      get().playNext();
    }
  },

  toggleShuffle: () =>
    set((state) => ({
      playMode: state.playMode === "shuffle" ? "normal" : "shuffle",
    })),

  toggleRepeat: () =>
    set((state) => {
      const modes: PlayMode[] = ["normal", "repeat-all", "repeat-one"];
      const nextIndex = (modes.indexOf(state.playMode) + 1) % modes.length;
      if (state.playMode === "shuffle") return { playMode: "repeat-all" };
      return { playMode: modes[nextIndex] };
    }),

  toggleQueue: () => set((state) => ({ isQueueOpen: !state.isQueueOpen })),
  setIsLoading: (loading) => set({ isLoading: loading }),

  toggleFullScreen: () =>
    set((state) => ({ isFullScreen: !state.isFullScreen })),
  setFullScreen: (isFull) => set({ isFullScreen: isFull }),
}));
