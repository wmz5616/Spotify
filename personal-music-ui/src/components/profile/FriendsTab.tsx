"use client";

import React from "react";
import { motion } from "framer-motion";
import { User, MapPin, UserCheck, UserPlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getAuthenticatedSrc } from "@/lib/api-client";

interface Friend {
    id: number;
    username: string;
    displayName: string;
    avatarPath?: string;
    bio?: string;
    ipLocation?: string;
}

interface FriendsTabProps {
    friends: Friend[];
    type: "following" | "followers";
    isLoading: boolean;
}

export default function FriendsTab({ friends, type, isLoading }: FriendsTabProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 md:px-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="animate-pulse bg-neutral-900/40 h-24 rounded-2xl" />
                ))}
            </div>
        );
    }

    if (friends.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-500 gap-4">
                <User size={48} className="text-neutral-700" />
                <p className="text-lg font-medium">暂时没有{type === "following" ? "关注" : "粉丝"}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 md:px-8 pb-20">
            {friends.map((friend, index) => (
                <motion.div
                    key={friend.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                >
                    <Link
                        href={`/${friend.username}`}
                        className="group flex items-center gap-4 bg-neutral-900/40 border border-neutral-800/50 p-4 rounded-2xl hover:bg-neutral-800/40 hover:border-neutral-700/50 transition-all duration-300"
                    >
                        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-neutral-800 group-hover:border-green-500/50 transition-colors">
                            {friend.avatarPath ? (
                                <Image
                                    src={getAuthenticatedSrc(friend.avatarPath.startsWith("/public") ? friend.avatarPath : `/public${friend.avatarPath}`)}
                                    alt={friend.displayName || friend.username}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-400 group-hover:bg-green-500/20 group-hover:text-green-400 transition-colors">
                                    <User size={24} />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white truncate group-hover:text-green-400 transition-colors">
                                {friend.displayName || friend.username}
                            </h3>
                            {friend.ipLocation && (
                                <div className="flex items-center gap-1 text-neutral-500 text-xs mt-1">
                                    <MapPin size={12} />
                                    <span>{friend.ipLocation}</span>
                                </div>
                            )}
                            {friend.bio && (
                                <p className="text-neutral-400 text-xs truncate mt-1 italic">
                                    {friend.bio}
                                </p>
                            )}
                        </div>

                        <div className="text-neutral-600 group-hover:text-green-500 transition-colors">
                            {type === "following" ? <UserCheck size={20} /> : <UserPlus size={20} />}
                        </div>
                    </Link>
                </motion.div>
            ))}
        </div>
    );
}
