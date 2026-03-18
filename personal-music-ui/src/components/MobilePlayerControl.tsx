"use client";

import React from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';

export default function MobilePlayerControl() {
    const { isPlaying, togglePlayPause, playNext, playPrev } = usePlayerStore();

    return (
        <div className="md:hidden flex items-center justify-center gap-4 py-2">
            <button onClick={playPrev} className="p-2 text-neutral-400">
                <SkipBack size={24} />
            </button>
            <button onClick={togglePlayPause} className="p-3 bg-white text-black rounded-full">
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button onClick={playNext} className="p-2 text-neutral-400">
                <SkipForward size={24} />
            </button>
        </div>
    );
}
