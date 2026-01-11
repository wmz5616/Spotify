"use client";

import React, { useRef, useState, useEffect } from "react";
import { Volume1, Volume2, VolumeX } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { cn } from "@/lib/utils";

const VolumeControl = () => {
  const { volume, setVolume } = usePlayerStore();
  const [prevVolume, setPrevVolume] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (volume === undefined) {
      setVolume(1);
    }
  }, [volume, setVolume]);

  const handleVolumeChange = (e: React.MouseEvent | MouseEvent) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const newVolume = Math.min(
      Math.max((e.clientX - rect.left) / rect.width, 0),
      1
    );
    setVolume(newVolume);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleVolumeChange(e);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && barRef.current) {
        handleVolumeChange(e);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, setVolume]);

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume > 0 ? prevVolume : 0.5);
    }
  };

  const VolumeIcon = () => {
    if (volume === 0) return <VolumeX size={20} />;
    if (volume < 0.5) return <Volume1 size={20} />;
    return <Volume2 size={20} />;
  };

  const currentPercentage = volume * 100;

  return (
    <div className="flex items-center gap-2 text-neutral-400 min-w-[120px] group/volume">
      <button
        onClick={toggleMute}
        className="hover:text-white transition-colors p-1"
        aria-label="Toggle Mute"
      >
        <VolumeIcon />
      </button>

      <div
        ref={barRef}
        className="relative h-1 w-24 bg-[#4d4d4d] rounded-full cursor-pointer flex items-center"
        onMouseDown={handleMouseDown}
        onClick={(e) => handleVolumeChange(e)}
      >

        <div
          className={cn(
            "h-full rounded-full transition-colors duration-100",
            "bg-white group-hover/volume:bg-[#1db954]"
          )}
          style={{ width: `${currentPercentage}%` }}
        />

        <div
          className="absolute w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover/volume:opacity-100 transition-opacity duration-100 hover:scale-110"
          style={{
            left: `${currentPercentage}%`,
            marginLeft: "-6px",
          }}
        />
      </div>
    </div>
  );
};

export default VolumeControl;
