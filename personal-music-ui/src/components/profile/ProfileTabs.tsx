"use client";

import React from "react";
import { motion } from "framer-motion";

interface ProfileTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    counts: {
        feed: number;
        playlists: number;
        following: number;
        followers: number;
    };
}

export default function ProfileTabs({ activeTab, onTabChange, counts }: ProfileTabsProps) {
    const tabs = [
        { id: "feed", label: "动态", count: counts.feed },
        { id: "playlists", label: "歌单", count: counts.playlists },
    ];

    return (
        <div className="sticky top-0 z-20 w-full bg-[#121212]/80 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-[1500px] mx-auto px-6 md:px-10 flex items-center gap-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`relative py-4 text-sm md:text-base font-bold transition-all ${
                            activeTab === tab.id ? "text-white" : "text-white/50 hover:text-white"
                        }`}
                    >
                        <div className="flex items-center gap-1.5">
                            <span>{tab.label}</span>
                            {tab.count > 0 && (
                                <span className={`text-xs font-semibold ${activeTab === tab.id ? "text-white/80" : "text-white/40"}`}>
                                    {tab.count}
                                </span>
                            )}
                        </div>
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTabIndicator"
                                className="absolute bottom-0 left-0 right-0 h-[2px] bg-green-500 rounded-t-full shadow-[0_-2px_8px_rgba(34,197,94,0.5)]"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                            />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
