"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { getAuthenticatedSrc } from "@/lib/api-client";

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const analysisRafId = useRef<number | null>(null);
  const isSourceConnected = useRef(false);

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

    if (isPlaying && !audioContext && !analyser && !isSourceConnected.current) {
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

          isSourceConnected.current = true;
          setAudioAnalysis(context, newAnalyser);
        } catch (e) {
          console.warn("MediaElementSource connection warning:", e);
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
        audioContext
          .resume()
          .catch((e) => console.warn("Context resume failed", e));
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
