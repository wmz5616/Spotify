"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useToastStore } from "@/store/useToastStore";
import { useHistoryStore } from "@/store/useHistoryStore";
import { useUserStore } from "@/store/useUserStore";
import { getAuthenticatedSrc } from "@/lib/api-client";

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastRecordedSongRef = useRef<number | null>(null);
  const { addToast } = useToastStore();
  const { recordPlay } = useHistoryStore();
  const { isAuthenticated } = useUserStore();

  const {
    currentSong,
    isPlaying,
    volume,
    setAudioRef,
    setCurrentTime,
    setDuration,
    setIsLoading,
    handleSongEnd,
  } = usePlayerStore();

  useEffect(() => {
    setAudioRef(audioRef);
  }, [setAudioRef]);

  useEffect(() => {
    if (currentSong && isAuthenticated && lastRecordedSongRef.current !== currentSong.id) {
      lastRecordedSongRef.current = currentSong.id;
      recordPlay(currentSong.id);
    }
  }, [currentSong, isAuthenticated, recordPlay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          if (error.name !== "AbortError") {
            console.warn("Playback prevented:", error);
            usePlayerStore.setState({ isPlaying: false });
            if (error.name === "NotAllowedError") {
              addToast("自动播放被浏览器拦截，请手动点击播放");
            }
          }
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong, addToast]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const { setAnalyser } = usePlayerStore();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || sourceRef.current) return;

    try {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextCtor) return;

      const ctx = new AudioContextCtor();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;

      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      sourceRef.current = source;
      setAnalyser(analyser);

      const handlePlay = () => {
        if (ctx.state === 'suspended') ctx.resume();
      };

      audio.addEventListener('play', handlePlay);

      return () => {
        audio.removeEventListener('play', handlePlay);
      };
    } catch (e) {
      console.error("Audio Visualization Setup Failed:", e);
    }
  }, [audioRef.current, setAnalyser]);

  if (!currentSong) return null;

  const streamUrl = getAuthenticatedSrc(`api/stream/${currentSong.id}`);

  return (
    <audio
      ref={audioRef}
      src={streamUrl}
      crossOrigin="anonymous"
      preload="auto"
      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      onLoadedMetadata={(e) => {
        setDuration(e.currentTarget.duration);
        setIsLoading(false);
        if (isPlaying) {
          e.currentTarget.play().catch((error) => {
            if (error.name !== "AbortError") {
              console.warn("Autoplay failed:", error);
              usePlayerStore.setState({ isPlaying: false });
            }
          });
        }
      }}
      onEnded={handleSongEnd}
      onWaiting={() => setIsLoading(true)}
      onCanPlay={() => setIsLoading(false)}
      onError={(e) => {
        console.error("Audio playback error:", e);
        setIsLoading(false);
        usePlayerStore.setState({ isPlaying: false });
        addToast("播放失败，请检查网络或音频文件");
      }}
    />
  );
};

export default AudioPlayer;

