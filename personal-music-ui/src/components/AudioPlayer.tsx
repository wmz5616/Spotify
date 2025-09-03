"use client";

import { usePlayerStore } from "@/store/usePlayerStore";
import { useEffect, useRef } from "react";

const AudioPlayer = () => {
  const {
    currentSong,
    isPlaying,
    volume,
    setAudioRef,
    setCurrentTime,
    setDuration,
    handleSongEnd, // 获取新的方法
  } = usePlayerStore();
  const audioRef = useRef<HTMLAudioElement>(null);

  // 将audio元素的引用注册到全局store中
  useEffect(() => {
    setAudioRef(audioRef);
  }, [setAudioRef]);

  // 当歌曲切换时，加载新歌曲并播放
  useEffect(() => {
    if (audioRef.current && currentSong) {
      audioRef.current.src = `http://localhost:3000/api/stream/${currentSong.id}`;
      audioRef.current.load(); // 重新加载音频
      audioRef.current
        .play()
        .catch((error) => console.error("Autoplay failed:", error));
    }
  }, [currentSong]);

  // 当 isPlaying 状态变化时，控制播放或暂停
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current
          .play()
          .catch((error) => console.error("Play failed:", error));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // 当音量变化时
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // 绑定音频事件监听
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateCurrentTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    // 注意这里的变化！
    const onEnded = () => handleSongEnd();

    audio.addEventListener("timeupdate", updateCurrentTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", onEnded); // 使用新的 onEnded

    return () => {
      audio.removeEventListener("timeupdate", updateCurrentTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", onEnded);
    };
  }, [setCurrentTime, setDuration, handleSongEnd]); // 添加 handleSongEnd 到依赖项

  return <audio ref={audioRef} />;
};

export default AudioPlayer;
