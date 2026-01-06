"use client";

import { usePlayerStore } from "@/store/usePlayerStore";
import { useEffect, useRef } from "react";

const AudioPlayer = () => {
  const {
    currentSong,
    isPlaying,
    isLoading,
    setIsLoading,
    volume,
    setAudioRef,
    setCurrentTime,
    setDuration,
    handleSongEnd,
    progress,
    setAudioAnalysis,
    setBassLevel,
    audioContext,
  } = usePlayerStore();

  const audioRef = useRef<HTMLAudioElement>(null);

  // !!! 核心修复在这里 !!!
  // 将 Ref 的类型定义为 number | null，并提供 null 作为初始值
  const analysisRafId = useRef<number | null>(null);

  // 音频分析逻辑
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let localAudioContext = audioContext;

    if (!localAudioContext) {
      const context = new (window.AudioContext ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitAudioContext)();
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;

      const source = context.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(context.destination);

      setAudioAnalysis(context, analyser);
      localAudioContext = context;
    }

    const analyser = usePlayerStore.getState().analyser;
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const analyze = () => {
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);

        const bassFrequencies = dataArray.slice(
          0,
          Math.floor(bufferLength * (60 / (localAudioContext!.sampleRate / 2)))
        );
        const bassSum = bassFrequencies.reduce((a, b) => a + b, 0);
        const bassAverage = bassSum / bassFrequencies.length || 0;

        const bassLevel = Math.min(1, (bassAverage / 255) * 2.5);
        setBassLevel(bassLevel);
      }
      analysisRafId.current = requestAnimationFrame(analyze);
    };

    if (isPlaying) {
      if (localAudioContext!.state === "suspended") {
        localAudioContext!.resume();
      }
      // 避免重复创建动画帧
      if (analysisRafId.current === null) {
        analysisRafId.current = requestAnimationFrame(analyze);
      }
    } else {
      if (analysisRafId.current) {
        cancelAnimationFrame(analysisRafId.current);
        analysisRafId.current = null;
      }
    }

    return () => {
      if (analysisRafId.current) {
        cancelAnimationFrame(analysisRafId.current);
        analysisRafId.current = null;
      }
    };
  }, [isPlaying, audioContext, setAudioAnalysis, setBassLevel]);

  useEffect(() => {
    setAudioRef(audioRef);
  }, [setAudioRef]);

  useEffect(() => {
    if (audioRef.current && currentSong) {
      audioRef.current.crossOrigin = "anonymous";
      audioRef.current.src = `http://localhost:3001/api/stream/${currentSong.id}`;
      audioRef.current.load();
    }
  }, [currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && !isLoading) {
        audioRef.current
          .play()
          .catch((error) => console.error("Play failed:", error));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, isLoading]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const frame = () => {
      setCurrentTime(audio.currentTime);
      progress.rafId = requestAnimationFrame(frame);
    };

    const startAnimation = () => {
      if (!progress.rafId) {
        progress.rafId = requestAnimationFrame(frame);
      }
    };

    const stopAnimation = () => {
      if (progress.rafId) {
        cancelAnimationFrame(progress.rafId);
        progress.rafId = null;
      }
    };

    if (isPlaying) {
      startAnimation();
    } else {
      stopAnimation();
    }

    return stopAnimation;
  }, [isPlaying, setCurrentTime, progress]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => {
      setIsLoading(false);
      if (isPlaying) {
        audio
          .play()
          .catch((e) => console.error("Autoplay failed on canplay", e));
      }
    };

    const updateDuration = () => setDuration(audio.duration);
    const onEnded = () => handleSongEnd();

    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", onEnded);
    };
  }, [setDuration, handleSongEnd, isPlaying, setIsLoading]);

  return <audio ref={audioRef} />;
};

export default AudioPlayer;
