"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useUserStore } from "@/store/useUserStore";
import AuthModal from "./AuthModal";

interface HeartButtonProps {
    songId: number;
    size?: number;
    className?: string;
    showTooltip?: boolean;
}

export default function HeartButton({
    songId,
    size = 20,
    className = "",
    showTooltip = true,
}: HeartButtonProps) {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const { isAuthenticated } = useUserStore();
    const { isSongFavorited, toggleFavoriteSong } = useFavoritesStore();

    const isFavorited = isSongFavorited(songId);

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }

        await toggleFavoriteSong(songId);
    };

    return (
        <>
            <motion.button
                onClick={handleClick}
                whileTap={{ scale: 0.9 }}
                className={`group relative p-1.5 rounded-full transition-colors ${isFavorited
                        ? "text-green-500"
                        : "text-neutral-400 hover:text-white"
                    } ${className}`}
                title={isFavorited ? "取消收藏" : "收藏"}
            >
                <motion.div
                    initial={false}
                    animate={isFavorited ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <Heart
                        size={size}
                        fill={isFavorited ? "currentColor" : "none"}
                        strokeWidth={2}
                    />
                </motion.div>

                {showTooltip && (
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {isFavorited ? "取消收藏" : "收藏"}
                    </span>
                )}
            </motion.button>

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                initialMode="login"
            />
        </>
    );
}
