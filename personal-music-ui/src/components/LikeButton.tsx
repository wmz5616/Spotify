"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import clsx from "clsx";

interface LikeButtonProps {
    isLiked: boolean;
    onToggle: (e: React.MouseEvent) => void;
    size?: number;
    className?: string;
    activeColor?: string;
    inactiveColor?: string;
}

const LikeButton: React.FC<LikeButtonProps> = ({
    isLiked,
    onToggle,
    size = 20,
    className,
    activeColor = "text-green-500",
    inactiveColor = "text-neutral-400 group-hover:text-white",
}) => {
    const [isClicking, setIsClicking] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsClicking(true);
        onToggle(e);
        setTimeout(() => setIsClicking(false), 600);
    };

    return (
        <button
            onClick={handleClick}
            className={clsx("relative flex items-center justify-center cursor-pointer select-none transition-transform active:scale-95 outline-none", className)}
            style={{ width: size + 16, height: size + 16 }}
        >
            <AnimatePresence>
                {isClicking && isLiked && (
                    <motion.div
                        className="absolute inset-0 pointer-events-none"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        {[...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                className={clsx("absolute w-1 h-1 rounded-full", activeColor.replace("text-", "bg-"))}
                                style={{
                                    left: "50%",
                                    top: "50%",
                                }}
                                variants={{
                                    hidden: { opacity: 0, scale: 0 },
                                    visible: {
                                        opacity: [1, 0],
                                        scale: [0, 1.5],
                                        x: Math.cos((i * Math.PI) / 4) * 20,
                                        y: Math.sin((i * Math.PI) / 4) * 20,
                                        transition: { duration: 0.5, ease: "easeOut" },
                                    },
                                }}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                animate={isLiked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                transition={{ duration: 0.4 }}
            >
                <Heart
                    size={size}
                    className={clsx("transition-colors duration-300", isLiked ? activeColor : inactiveColor)}
                    fill={isLiked ? "currentColor" : "none"}
                />
            </motion.div>
        </button>
    );
};

export default LikeButton;
