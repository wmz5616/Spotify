"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Clock, ListMusic } from "lucide-react";
import { clsx } from "clsx";
import { useUserStore } from "@/store/useUserStore";

interface UserQuickLinksProps {
    collapsed: boolean;
}

const UserQuickLinks = ({ collapsed }: UserQuickLinksProps) => {
    const pathname = usePathname();
    const { isAuthenticated } = useUserStore();

    if (!isAuthenticated) return null;

    const links = [
        { href: "/favorites", label: "我的收藏", icon: Heart },
        { href: "/history", label: "播放历史", icon: Clock },
        { href: "/playlists", label: "我的歌单", icon: ListMusic },
    ];

    return (
        <div className="rounded-xl bg-[#121212] px-5 py-4 flex flex-col gap-y-4 shadow-lg border border-white/5">
            {collapsed ? (
                <div className="flex flex-col items-center gap-4">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={clsx(
                                "flex justify-center transition cursor-pointer",
                                pathname === link.href
                                    ? "text-green-500"
                                    : "text-neutral-400 hover:text-white"
                            )}
                            title={link.label}
                        >
                            <link.icon size={26} />
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-y-4">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={clsx(
                                "flex items-center gap-x-4 transition cursor-pointer font-bold",
                                pathname === link.href
                                    ? "text-green-500"
                                    : "text-neutral-400 hover:text-white"
                            )}
                        >
                            <link.icon size={26} />
                            <span className="truncate">{link.label}</span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserQuickLinks;
