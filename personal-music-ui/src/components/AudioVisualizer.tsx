"use client";

import React, { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";

interface AudioVisualizerProps {
    isPlaying: boolean;
    barCount?: number;
    height?: number;
    color?: string;
    className?: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
    isPlaying,
    barCount = 60,
    height = 32,
    color = "#1db954",
    className,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { analyser } = usePlayerStore();
    const requestRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const bufferLength = analyser ? analyser.frequencyBinCount : 32;
        const dataArray = new Uint8Array(bufferLength);

        const renderFrame = () => {

            ctx.clearRect(0, 0, rect.width, height);

            let hasSignal = false;

            if (analyser && isPlaying) {
                analyser.getByteFrequencyData(dataArray);

                if (dataArray.some(v => v > 0)) {
                    hasSignal = true;
                }
            }

            const barWidth = (rect.width / barCount);
            const gap = 2;
            const effectiveBarWidth = Math.max(1, barWidth - gap);

            const gradient = ctx.createLinearGradient(0, height, 0, 0);
            gradient.addColorStop(0, "rgba(29, 185, 84, 0.2)");
            gradient.addColorStop(0.5, "rgba(29, 185, 84, 0.8)");
            gradient.addColorStop(1, "#1db954");
            ctx.fillStyle = gradient;

            const halfCount = Math.floor(barCount / 2);
            const center = rect.width / 2;

            for (let i = 0; i < halfCount; i++) {
                let barHeight = 2;

                if (hasSignal && analyser) {

                    const dataIndex = Math.floor((i / halfCount) * bufferLength * 0.8);
                    const value = dataArray[dataIndex] || 0;
                    barHeight = Math.max(2, (value / 255) * height);
                } else if (isPlaying) {

                    const time = Date.now() / 200;
                    const x = i / halfCount;
                    const wave = Math.sin(x * 6 + time) * 0.4 +
                        Math.sin(x * 14 - time * 1.5) * 0.2 +
                        Math.sin(time * 2 + i) * 0.1;
                    const val = Math.max(0, (wave + 0.5));
                    barHeight = Math.max(2, val * height * 0.8 * (0.8 + Math.random() * 0.2));
                }

                const x1 = center + (i * barWidth) + (gap / 2);
                const x2 = center - ((i + 1) * barWidth) - (gap / 2);

                const y = height - barHeight;
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(x1, y, effectiveBarWidth, barHeight, [2, 2, 0, 0]);
                else ctx.rect(x1, y, effectiveBarWidth, barHeight);
                ctx.fill();

                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(x2, y, effectiveBarWidth, barHeight, [2, 2, 0, 0]);
                else ctx.rect(x2, y, effectiveBarWidth, barHeight);
                ctx.fill();
            }

            if (isPlaying) {
                requestRef.current = requestAnimationFrame(renderFrame);
            }
        };

        if (isPlaying) {
            renderFrame();
        } else {

            ctx.clearRect(0, 0, rect.width, height);
            ctx.fillStyle = color;
            const barWidth = (rect.width / barCount);
            const gap = 2;
            const effectiveBarWidth = Math.max(1, barWidth - gap);

            for (let i = 0; i < barCount; i++) {
                ctx.beginPath();
                const x = i * barWidth;
                if (ctx.roundRect) {
                    ctx.roundRect(x, height - 2, effectiveBarWidth, 2, [2, 2, 0, 0]);
                } else {
                    ctx.rect(x, height - 2, effectiveBarWidth, 2);
                }
                ctx.fill();
            }
        }

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, analyser, barCount, height, color]);

    return (
        <canvas
            ref={canvasRef}
            className={`w-full h-full block ${className || ""}`}
            style={{ height }}
        />
    );
};

export default AudioVisualizer;
