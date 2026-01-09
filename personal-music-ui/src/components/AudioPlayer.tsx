"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const analysisRafId = useRef<number | null>(null);

  const {
    currentSong,
    isPlaying,
    volume,
    setAudioRef,
    setCurrentTime,
    setDuration,
    setIsLoading,
    handleSongEnd,
    setAudioAnalysis,
    setBassLevel,
    audioContext,
    analyser,
  } = usePlayerStore();

  useEffect(() => {
    setAudioRef(audioRef);
  }, [setAudioRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          if (error.name !== "AbortError") {
            console.warn("Playback prevented:", error);
          }
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && !audioContext && !analyser) {
      try {
        const AudioContextClass =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          window.AudioContext || (window as any).webkitAudioContext;
        const context = new AudioContextClass();
        const newAnalyser = context.createAnalyser();
        newAnalyser.fftSize = 256;

        try {
          const source = context.createMediaElementSource(audio);
          source.connect(newAnalyser);
          newAnalyser.connect(context.destination);
          setAudioAnalysis(context, newAnalyser);
        } catch (e) {
          console.log(
            "MediaElementSource already connected or context error",
            e
          );
        }
      } catch (e) {
        console.error("AudioContext init failed", e);
      }
    }

    const runAnalysis = () => {
      if (analyser && isPlaying) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const bassFrequencies = dataArray.slice(
          0,
          Math.floor(bufferLength * 0.15)
        );
        if (bassFrequencies.length > 0) {
          const bassSum = bassFrequencies.reduce((a, b) => a + b, 0);
          const bassAverage = bassSum / bassFrequencies.length;
          const newBassLevel = Math.min(1, (bassAverage / 255) * 2.0);
          setBassLevel(newBassLevel);
        }
      }
      analysisRafId.current = requestAnimationFrame(runAnalysis);
    };

    if (isPlaying && analyser) {
      if (audioContext?.state === "suspended") {
        audioContext.resume();
      }
      runAnalysis();
    } else {
      if (analysisRafId.current) {
        cancelAnimationFrame(analysisRafId.current);
      }
    }

    return () => {
      if (analysisRafId.current) {
        cancelAnimationFrame(analysisRafId.current);
      }
    };
  }, [isPlaying, audioContext, analyser, setAudioAnalysis, setBassLevel]);

  if (!currentSong) return null;

  return (
    <audio
      ref={audioRef}
      src={`${API_BASE_URL}/api/stream/${currentSong.id}`}
      crossOrigin="anonymous"
      preload="auto"
      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      onLoadedMetadata={(e) => {
        setDuration(e.currentTarget.duration);
        setIsLoading(false);
        if (isPlaying) {
          e.currentTarget.play().catch(() => {});
        }
      }}
      onEnded={handleSongEnd}
      onWaiting={() => setIsLoading(true)}
      onCanPlay={() => setIsLoading(false)}
      onError={(e) => {
        console.error("Audio playback error:", e);
        setIsLoading(false);
      }}
    />
  );
};

export default AudioPlayer;
