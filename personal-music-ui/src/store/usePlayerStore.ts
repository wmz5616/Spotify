import { create } from "zustand";
import type { Song } from "@/types";
import React from "react";

export type PlayMode = "normal" | "repeat-all" | "repeat-one" | "shuffle";

interface PlayerState {
  // 状态
  isPlaying: boolean;
  currentSong: Song | null;
  volume: number;
  currentTime: number;
  duration: number;
  playQueue: Song[];
  currentQueueIndex: number; // 改为非空，默认为 -1 或 0
  playMode: PlayMode;
  isQueueOpen: boolean;
  isLoading: boolean;

  // 音频相关引用
  audioRef: React.RefObject<HTMLAudioElement | null> | null;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  bassLevel: number;

  // Actions
  playSong: (song: Song, queue?: Song[]) => void;
  togglePlayPause: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setAudioRef: (ref: React.RefObject<HTMLAudioElement | null>) => void;
  setAudioAnalysis: (context: AudioContext, analyser: AnalyserNode) => void;
  setBassLevel: (level: number) => void;
  seek: (time: number) => void;

  // 播放控制
  playNext: () => void; // 切下一首
  playPrev: () => void; // 切上一首
  insertNext: (song: Song) => void; // 插队播放 (原 playNext)
  addToQueue: (song: Song) => void; // 添加到末尾
  handleSongEnd: () => void; // 歌曲结束自动处理

  // 模式控制
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
  playQueue: [],
  currentQueueIndex: -1,
  playMode: "normal",
  isQueueOpen: false,
  isLoading: false,
  audioRef: null,
  audioContext: null,
  analyser: null,
  bassLevel: 0,

  // 核心播放逻辑
  playSong: (song, queue) => {
    const state = get();
    let newQueue = state.playQueue;
    let newIndex = -1;

    // 1. 如果提供了新队列，直接替换
    if (queue && queue.length > 0) {
      newQueue = queue;
      newIndex = newQueue.findIndex((s) => s.id === song.id);
    }
    // 2. 如果没提供队列，但在当前队列里找到了这首歌
    else if (state.playQueue.some((s) => s.id === song.id)) {
      newIndex = state.playQueue.findIndex((s) => s.id === song.id);
    }
    // 3. 既没队列，当前队列也没这首歌 -> 把它加到队列末尾并播放
    else {
      newQueue = [...state.playQueue, song];
      newIndex = newQueue.length - 1;
    }

    set({
      currentSong: song,
      playQueue: newQueue,
      currentQueueIndex: newIndex,
      isPlaying: true, // 只要切歌就自动播放
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

  // 切下一首
  playNext: () => {
    const { playQueue, currentQueueIndex, playMode } = get();
    if (playQueue.length === 0) return;

    let nextIndex = -1;

    if (playMode === "shuffle") {
      // 随机模式：随机选一个非当前的索引
      nextIndex = Math.floor(Math.random() * playQueue.length);
      // 如果随到自己且队列长度大于1，就往后挪一位
      if (playQueue.length > 1 && nextIndex === currentQueueIndex) {
        nextIndex = (nextIndex + 1) % playQueue.length;
      }
    } else {
      // 正常模式：下一首
      nextIndex = (currentQueueIndex + 1) % playQueue.length;

      // 如果不是循环模式，且已经到了最后一首，就停止
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
    get().playSong(nextSong, playQueue); // 复用 playSong 逻辑
  },

  // 切上一首
  playPrev: () => {
    const { playQueue, currentQueueIndex, currentTime, audioRef } = get();
    if (playQueue.length === 0) return;

    // 如果当前播放超过 3 秒，按上一曲是重头播放，而不是切歌
    if (currentTime > 3 && audioRef?.current) {
      audioRef.current.currentTime = 0;
      return;
    }

    // 计算上一首索引
    const prevIndex =
      (currentQueueIndex - 1 + playQueue.length) % playQueue.length;
    const prevSong = playQueue[prevIndex];
    get().playSong(prevSong, playQueue);
  },

  // 插队播放 (原 playNext)
  insertNext: (song) => {
    const { playQueue, currentQueueIndex } = get();
    const newQueue = [...playQueue];
    const insertIndex = currentQueueIndex + 1;
    newQueue.splice(insertIndex, 0, song);

    // 如果队列原本为空，直接播放
    if (playQueue.length === 0) {
      get().playSong(song, [song]);
    } else {
      set({ playQueue: newQueue });
    }
  },

  addToQueue: (song) => {
    set((state) => {
      // 避免重复添加 (可选)
      if (state.playQueue.some((s) => s.id === song.id)) return state;
      return { playQueue: [...state.playQueue, song] };
    });
  },

  // 歌曲结束处理
  handleSongEnd: () => {
    const { playMode, audioRef } = get();
    if (playMode === "repeat-one" && audioRef?.current) {
      // 单曲循环：重置时间并播放
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      // 其他模式：切下一首
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
      // 如果当前是 shuffle，点击切换会直接变 repeat-all，这里看你喜好
      if (state.playMode === "shuffle") return { playMode: "repeat-all" };
      return { playMode: modes[nextIndex] };
    }),

  toggleQueue: () => set((state) => ({ isQueueOpen: !state.isQueueOpen })),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
