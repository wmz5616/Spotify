"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume2,
  VolumeX,
} from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import LyricDisplay from "./LyricDisplay";
import Image from "next/image";
import { getAuthenticatedSrc } from "@/lib/api-client";
import { Song } from "@/types";

const LikeButton = ({
  isLiked,
  onClick,
}: {
  isLiked: boolean;
  onClick: () => void;
}) => {
  return (
    <motion.button
      onClick={onClick}
      className="relative p-2 flex items-center justify-center group"
      whileTap={{ scale: 0.8 }}
    >
      <AnimatePresence>
        {isLiked && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 w-1.5 h-1.5 bg-green-500 rounded-full"
                initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                animate={{
                  scale: 0,
                  x: Math.cos(i * 45 * (Math.PI / 180)) * 20,
                  y: Math.sin(i * 45 * (Math.PI / 180)) * 20,
                  opacity: 0,
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.div
        animate={isLiked ? { scale: [1, 1.4, 0.8, 1.1, 1] } : { scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Heart
          className={`w-8 h-8 transition-colors duration-300 ${
            isLiked
              ? "fill-green-500 text-green-500"
              : "text-neutral-300 group-hover:text-white"
          }`}
        />
      </motion.div>
    </motion.button>
  );
};

const PlayPauseButton = ({
  isPlaying,
  onClick,
}: {
  isPlaying: boolean;
  onClick: () => void;
}) => {
  return (
    <motion.button
      onClick={onClick}
      className="relative p-6 bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)] overflow-hidden"
      whileTap={{ scale: 0.9 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isPlaying ? (
          <motion.div
            key="pause"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Pause className="w-8 h-8 fill-current" />
          </motion.div>
        ) : (
          <motion.div
            key="play"
            initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Play className="w-8 h-8 fill-current pl-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

const FullScreenPlayer = () => {
  const {
    isFullScreen,
    toggleFullScreen,
    currentSong,
    isPlaying,
    togglePlayPause,
    playNext,
    playPrev,
    duration,
    currentTime,
    seek,
    playMode,
    toggleShuffle,
    toggleRepeat,
    volume,
    setVolume,
  } = usePlayerStore();

  const [imgError, setImgError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    setImgError(false);
    setIsLiked(false);
  }, [currentSong?.id]);

  if (!currentSong) return null;

  const getCoverUrl = () => {
    if (currentSong.album?.id) {
      return getAuthenticatedSrc(`api/covers/${currentSong.album.id}?size=600`);
    }

    const path = currentSong.album?.coverPath;

    if (!path || path === "undefined" || path === "null") return null;

    if (path.startsWith("http")) return path;

    const cleanPath = path.startsWith("/") ? path : `/${path}`;

    if (cleanPath.startsWith("/static")) {
      return getAuthenticatedSrc(cleanPath);
    }

    return getAuthenticatedSrc(`/static${cleanPath}`);
  };

  const albumCover = getCoverUrl();

  const getArtistName = () => {
    if (
      currentSong.album?.artists &&
      Array.isArray(currentSong.album.artists) &&
      currentSong.album.artists.length > 0
    ) {
      return currentSong.album.artists.map((a) => a.name).join(", ");
    }

    if (currentSong.artist) return currentSong.artist;

    return "Unknown Artist";
  };

  const artistName = getArtistName();

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = Number(e.target.value);
    seek(newVal);

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(5);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
  };

  const handleTogglePlay = () => {
    togglePlayPause();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([10, 30, 10]);
    }
  };

  const FallbackCover = ({ opacity = 1, size = "text-6xl" }) => (
    <div
      className={`w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-600`}
      style={{ opacity }}
    >
      <span className={`${size} font-bold opacity-30`}>♪</span>
    </div>
  );

  const renderRepeatIcon = () => {
    if (playMode === "repeat-one") return <Repeat1 className="w-6 h-6" />;
    return <Repeat className="w-6 h-6" />;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const volumePercent = volume * 100;

  return (
    <AnimatePresence>
      {isFullScreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className="fixed inset-0 z-50 flex flex-col bg-black text-white overflow-hidden"
        >
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {albumCover && !imgError ? (
              <motion.div
                className="relative w-full h-full"
                animate={{
                  scale: [1.2, 1.35, 1.2],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <Image
                  src={albumCover}
                  alt="Atmosphere"
                  fill
                  className="object-cover opacity-60 blur-[100px] saturate-150 brightness-110"
                  priority
                  unoptimized
                  onError={() => setImgError(true)}
                />
              </motion.div>
            ) : (
              <div className="w-full h-full bg-neutral-900" />
            )}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[20px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
          </div>

          <div className="relative z-10 flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
            <button
              onClick={toggleFullScreen}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronDown className="w-8 h-8 text-neutral-200" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-sm font-medium tracking-widest uppercase text-white/70">
                Now Playing
              </span>
            </div>
            <div className="w-12" />
          </div>

          <div className="relative z-10 flex-1 flex flex-col md:grid md:grid-cols-2 gap-8 p-6 md:p-12 overflow-y-auto md:overflow-hidden scrollbar-hide">
            <div className="flex flex-col justify-center items-center md:h-full gap-4 md:gap-8 w-full min-h-min pb-8 md:pb-0">
              <motion.div
                layoutId={`album-cover-${currentSong.id}`}
                className="relative aspect-square w-full max-w-[280px] md:max-w-none md:w-auto md:h-full md:max-h-[45vh] rounded-xl overflow-hidden bg-neutral-800 border border-white/10 shrink-0 origin-center shadow-2xl"
                animate={{
                  scale: isPlaying ? 1 : 0.85,
                  boxShadow: isPlaying
                    ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                    : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                transition={{
                  layout: { duration: 0.4, ease: [0.32, 0.72, 0, 1] },
                  scale: { type: "spring", stiffness: 260, damping: 20 },
                }}
              >
                {albumCover && !imgError ? (
                  <Image
                    src={albumCover}
                    alt={currentSong.title}
                    fill
                    className="object-cover"
                    priority
                    unoptimized
                    sizes="(max-height: 45vh) 100vw, 500px"
                    onError={(e) => {
                      console.error("Image load error:", e);
                      setImgError(true);
                    }}
                  />
                ) : (
                  <FallbackCover />
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="w-full max-w-[500px] space-y-4 shrink-0 px-2"
              >
                <div className="flex justify-between items-end">
                  <div className="space-y-1 overflow-hidden flex-1 mr-4">
                    <h2 className="text-2xl md:text-3xl font-bold truncate drop-shadow-lg">
                      {currentSong.title}
                    </h2>
                    <p className="text-lg md:text-xl text-neutral-300 truncate font-medium">
                      {artistName}
                    </p>
                  </div>

                  <LikeButton isLiked={isLiked} onClick={handleLike} />
                </div>

                <div className="pt-2 space-y-2">
                  <div className="group relative flex items-center w-full h-4 cursor-pointer">
                    <div className="absolute left-0 w-full h-1 bg-white/20 rounded-full overflow-hidden group-hover:h-1.5 transition-all duration-300 ease-out backdrop-blur-sm">
                      <div
                        className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <div
                      className="absolute h-3 w-3 bg-white rounded-full shadow-lg opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none"
                      style={{
                        left: `${progressPercent}%`,
                        transform: "translateX(-50%)",
                      }}
                    />

                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleSeek}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                  </div>

                  <div className="flex justify-between text-xs font-medium text-neutral-300 px-0.5">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center px-2">
                  <button
                    onClick={toggleShuffle}
                    className={`transition-colors hover:scale-110 active:scale-95 ${
                      playMode === "shuffle"
                        ? "text-green-500"
                        : "text-neutral-300 hover:text-white"
                    }`}
                  >
                    <Shuffle className="w-5 h-5 md:w-6 md:h-6" />
                  </button>

                  <div className="flex items-center gap-6 md:gap-8">
                    <button
                      onClick={playPrev}
                      className="text-white transition-colors hover:scale-110 active:scale-95 drop-shadow-md"
                    >
                      <SkipBack className="w-8 h-8 md:w-10 md:h-10 fill-current" />
                    </button>

                    <PlayPauseButton
                      isPlaying={isPlaying}
                      onClick={handleTogglePlay}
                    />

                    <button
                      onClick={playNext}
                      className="text-white transition-colors hover:scale-110 active:scale-95 drop-shadow-md"
                    >
                      <SkipForward className="w-8 h-8 md:w-10 md:h-10 fill-current" />
                    </button>
                  </div>

                  <button
                    onClick={toggleRepeat}
                    className={`transition-colors hover:scale-105 active:scale-95 ${
                      playMode.includes("repeat")
                        ? "text-green-500"
                        : "text-neutral-300 hover:text-white"
                    }`}
                  >
                    {renderRepeatIcon()}
                  </button>
                </div>

                <div className="flex items-center gap-3 pt-4 px-4">
                  <button
                    onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
                    className="text-neutral-300 hover:text-white"
                  >
                    {volume === 0 ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <div className="group relative flex items-center flex-1 h-4 cursor-pointer">
                    <div className="absolute left-0 w-full h-1 bg-white/20 rounded-full overflow-hidden group-hover:h-1.5 transition-all duration-300 backdrop-blur-sm">
                      <div
                        className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                        style={{ width: `${volumePercent}%` }}
                      />
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={handleVolumeChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="hidden md:block h-full w-full rounded-2xl overflow-hidden bg-white/5 backdrop-blur-sm border border-white/5 shadow-2xl">
              <LyricDisplay />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullScreenPlayer;
