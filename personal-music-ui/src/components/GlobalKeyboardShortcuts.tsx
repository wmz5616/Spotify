"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useToastStore } from "@/store/useToastStore";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  FastForward,
  Rewind,
} from "lucide-react";

const GlobalKeyboardShortcuts = () => {
  const { togglePlayPause, playNext, playPrev, setVolume, seek, toggleMute } =
    usePlayerStore();

  const { addToast } = useToastStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const state = usePlayerStore.getState();

      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (e.repeat) return;

          togglePlayPause();
          addToast(
            state.isPlaying ? "已暂停" : "播放中",
            state.isPlaying ? <Pause size={20} /> : <Play size={20} />
          );
          break;

        case "KeyM":
          if (e.repeat) return;

          toggleMute();
          addToast(
            state.isMuted ? "已取消静音" : "已静音",
            state.isMuted ? <Volume2 size={20} /> : <VolumeX size={20} />
          );
          break;

        case "ArrowLeft":
          e.preventDefault();
          if (e.ctrlKey || e.metaKey) {
            if (e.repeat) return;
            playPrev();
            addToast("播放上一首", <SkipBack size={20} />);
          } else {
            const current =
              state.audioRef?.current?.currentTime ?? state.currentTime;
            seek(Math.max(0, current - 5));

            if (!e.repeat) {
              addToast("快退 5秒", <Rewind size={20} />);
            }
          }
          break;

        case "ArrowRight":
          e.preventDefault();
          if (e.ctrlKey || e.metaKey) {
            if (e.repeat) return;
            playNext();
            addToast("播放下一首", <SkipForward size={20} />);
          } else {

            const current =
              state.audioRef?.current?.currentTime ?? state.currentTime;
            seek(Math.min(state.duration, current + 5));

            if (!e.repeat) {
              addToast("快进 5秒", <FastForward size={20} />);
            }
          }
          break;

        case "ArrowUp": {
          e.preventDefault();
          const newVolUp = Math.min(
            1,
            parseFloat((state.volume + 0.1).toFixed(1))
          );
          setVolume(newVolUp);

          if (!e.repeat) {
            addToast(
              `音量: ${Math.round(newVolUp * 100)}%`,
              <Volume2 size={20} />
            );
          }
          break;
        }

        case "ArrowDown": {
          e.preventDefault();
          const newVolDown = Math.max(
            0,
            parseFloat((state.volume - 0.1).toFixed(1))
          );
          setVolume(newVolDown);

          if (!e.repeat) {
            addToast(
              `音量: ${Math.round(newVolDown * 100)}%`,
              newVolDown === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />
            );
          }
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    togglePlayPause,
    playNext,
    playPrev,
    setVolume,
    seek,
    toggleMute,
    addToast,
  ]);

  return null;
};

export default GlobalKeyboardShortcuts;
