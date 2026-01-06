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
    handleSongEnd, // 直接使用 store 中的最新函数
    setAudioAnalysis,
    setBassLevel,
    audioContext,
    analyser,
  } = usePlayerStore();

  // 1. 初始化：将 ref 存入 store
  useEffect(() => {
    setAudioRef(audioRef);
  }, [setAudioRef]);

  // 2. 播放/暂停控制 (核心逻辑)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // 忽略由于快速切歌导致的 AbortError
          if (error.name !== "AbortError") {
            console.warn("Playback prevented:", error);
          }
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong]); // 只要这种状态变了，就执行操作

  // 3. 音量控制
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // 4. 音频可视化逻辑 (独立模块)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 如果还没有 Context，初始化一个 (仅在用户交互后，即 isPlaying 为 true 时尝试)
    if (isPlaying && !audioContext && !analyser) {
      try {
        const AudioContextClass =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          window.AudioContext || (window as any).webkitAudioContext;
        const context = new AudioContextClass();
        const newAnalyser = context.createAnalyser();
        newAnalyser.fftSize = 256;

        // 防止重复连接导致的报错
        // 注意：Next.js 开发环境下 HMR 可能会导致重复创建，这里做个简单防护
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

    // 启动分析循环
    const runAnalysis = () => {
      if (analyser && isPlaying) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        // 计算低音 (Bass) 强度
        // 取前一部分频率作为低音区
        const bassFrequencies = dataArray.slice(
          0,
          Math.floor(bufferLength * 0.15)
        );
        if (bassFrequencies.length > 0) {
          const bassSum = bassFrequencies.reduce((a, b) => a + b, 0);
          const bassAverage = bassSum / bassFrequencies.length;
          // 归一化到 0-1 之间，乘以系数放大效果
          const newBassLevel = Math.min(1, (bassAverage / 255) * 2.0);
          setBassLevel(newBassLevel);
        }
      }
      analysisRafId.current = requestAnimationFrame(runAnalysis);
    };

    if (isPlaying && analyser) {
      // 恢复 context (有些浏览器会自动挂起)
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

  // 如果没有歌，不渲染 audio 标签
  if (!currentSong) return null;

  return (
    <audio
      ref={audioRef}
      // 直接使用 src 属性，React 会自动处理变化
      src={`${API_BASE_URL}/api/stream/${currentSong.id}`}
      // 必须开启跨域，否则 Canvas 无法读取音频数据（可视化会失效）
      crossOrigin="anonymous"
      preload="auto"
      // 事件绑定：直接绑定，不再用 addEventListener
      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      onLoadedMetadata={(e) => {
        setDuration(e.currentTarget.duration);
        setIsLoading(false);
        if (isPlaying) {
          e.currentTarget.play().catch(() => {});
        }
      }}
      onEnded={handleSongEnd} // 核心：歌曲结束自动调用 Store 里的切歌逻辑
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
