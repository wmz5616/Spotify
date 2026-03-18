"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Trash2, X, Info, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import { useNotificationStore, NotificationType } from "@/store/useNotificationStore";

interface NotificationPopoverProps {
    isOpen: boolean;
    onClose: () => void;
}

const getIcon = (type: NotificationType) => {
    switch (type) {
        case "success": return <CheckCircle size={16} className="text-green-500" />;
        case "warning": return <AlertTriangle size={16} className="text-yellow-500" />;
        case "error": return <AlertCircle size={16} className="text-red-500" />;
        default: return <Info size={16} className="text-blue-500" />;
    }
};
const formatTime = (isoString: string) => {
    try {
        const date = new Date(isoString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return "刚刚";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} 分钟前`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} 小时前`;
        return `${Math.floor(diffInSeconds / 86400)} 天前`;
    } catch (e) {
        return "刚刚";
    }
};

export default function NotificationPopover({ isOpen, onClose }: NotificationPopoverProps) {
    const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={containerRef}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-[#282828] border border-[#3e3e3e] rounded-lg shadow-2xl overflow-hidden z-50 flex flex-col max-h-[500px]"
                >
                    <div className="flex items-center justify-between p-4 border-b border-[#3e3e3e]">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <Bell size={16} />
                            通知中心
                        </h3>
                        <div className="flex items-center gap-2">
                            {notifications.length > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="p-1 text-neutral-400 hover:text-white transition"
                                    title="全部已读"
                                >
                                    <Check size={16} />
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={clearAll}
                                    className="p-1 text-neutral-400 hover:text-red-400 transition"
                                    title="清空通知"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-neutral-500">
                                <Bell size={32} className="mb-2 opacity-50" />
                                <p className="text-sm">暂无新通知</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <motion.div
                                    key={notification.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className={`relative p-3 rounded-md transition hover:bg-[#3e3e3e] flex gap-3 group ${!notification.read ? "bg-[#3e3e3e]/50" : ""}`}
                                    onClick={() => markAsRead(notification.id)}
                                >
                                    <div className="mt-1 flex-shrink-0">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className={`text-sm font-medium leading-tight ${!notification.read ? "text-white" : "text-neutral-300"}`}>
                                                {notification.title}
                                            </p>
                                            {!notification.read && (
                                                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1" />
                                            )}
                                        </div>
                                        <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-neutral-500 mt-2">
                                            {formatTime(notification.createdAt)}
                                        </p>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
