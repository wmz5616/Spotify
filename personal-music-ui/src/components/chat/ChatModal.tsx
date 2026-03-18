"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    MessageCircle, 
    Bell, 
    Search, 
    Send, 
    X, 
    UserPlus, 
    ChevronRight,
    Loader2,
    Calendar
} from "lucide-react";
import Image from "next/image";
import { useChatStore } from "@/store/useChatStore";
import { useUserStore } from "@/store/useUserStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { apiClient, getAuthenticatedSrc } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, differenceInMinutes, differenceInHours, differenceInDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import clsx from "clsx";

const formatOnlineStatus = (updatedAtStr: string | undefined) => {
    if (!updatedAtStr) return { text: "离线", isOnline: false };
    
    const lastActive = new Date(updatedAtStr);
    const now = new Date();
    const diffMins = differenceInMinutes(now, lastActive);
    const diffHrs = differenceInHours(now, lastActive);
    const diffDys = differenceInDays(now, lastActive);

    if (diffMins < 5) return { text: "在线", isOnline: true };
    if (diffHrs < 24) {
        if (diffMins < 60) return { text: `${diffMins}分钟前在线`, isOnline: false };
        return { text: `${diffHrs}小时前在线`, isOnline: false };
    }
    if (diffDys === 1) return { text: "昨天在线", isOnline: false };
    return { text: "离线", isOnline: false };
};

interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChatInput = ({ onSend }: { onSend: (text: string) => void }) => {
    const [messageInput, setMessageInput] = useState("");
    
    const handleSend = () => {
        if (!messageInput.trim()) return;
        onSend(messageInput.trim());
        setMessageInput("");
    };

    return (
        <div className="p-4 bg-[#121212] border-t border-neutral-800">
            <div className="relative flex items-center gap-2">
                <input 
                    type="text" 
                    placeholder="发送消息..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-full px-5 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 focus:bg-neutral-800/80 transition-all hover:border-neutral-700"
                />
                <button 
                    onClick={handleSend}
                    disabled={!messageInput.trim()}
                    className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                    <Send size={18} className="translate-x-[1px] translate-y-[-1px]" />
                </button>
            </div>
        </div>
    );
};

export default function ChatModal({ isOpen, onClose }: ChatModalProps) {
    const [activeTab, setActiveTab] = useState<"chats" | "notifications">("chats");
    const messageEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    
    const { 
        conversations, 
        activeConversationId, 
        setActiveConversation, 
        fetchConversations, 
        sendMessage,
        initSocket,
        pendingRecipientUser,
        pendingRecipientId
    } = useChatStore();
    const { user } = useUserStore();
    const { notifications, fetchNotifications, markAsRead } = useNotificationStore();

    useEffect(() => {
        if (isOpen && user) {
            initSocket(user.id);
            fetchConversations();
            fetchNotifications();
        }
    }, [isOpen, user, initSocket, fetchConversations, fetchNotifications]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeConversationId, conversations]);

    const activeConversation = conversations.find(c => c.id === activeConversationId);
    
    // Determine displayed user/header
    const displayedUser = activeConversation 
        ? activeConversation.participants.find(p => p.id !== user?.id)
        : pendingRecipientUser;
    
    const handleSendMessage = async (text: string) => {
        if (!user) return;
        
        let targetUserId = pendingRecipientId;
        if (activeConversationId) {
            const currentConv = conversations.find(c => c.id === activeConversationId);
            const other = currentConv?.participants.find(p => p.id !== user.id);
            if (other) {
                targetUserId = other.id;
            }
        } else if (pendingRecipientId) {
            targetUserId = pendingRecipientId;
        }

        if (targetUserId) {
            await sendMessage(targetUserId, text, user.id);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-5xl h-[80vh] bg-[#121212] rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden flex"
                >
                    {/* Sidebar */}
                    <div className="w-80 border-r border-neutral-800 flex flex-col bg-[#000000]">
                        <div className="p-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">消息中心</h2>
                            <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
                                <X size={20} className="text-neutral-400" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex px-4 mb-4 gap-2">
                            <button 
                                onClick={() => setActiveTab("chats")}
                                className={clsx(
                                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                                    activeTab === "chats" ? "bg-white text-black" : "bg-neutral-800 text-white hover:bg-neutral-700"
                                )}
                            >
                                私信
                            </button>
                            <button 
                                onClick={() => setActiveTab("notifications")}
                                className={clsx(
                                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                                    activeTab === "notifications" ? "bg-white text-black" : "bg-neutral-800 text-white hover:bg-neutral-700"
                                )}
                            >
                                通知
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {activeTab === "chats" ? (
                                <div className="space-y-1 p-2">
                                    {/* Pending conversation (not yet in list) */}
                                    {pendingRecipientUser && !conversations.some(c => c.participants.some(p => p.id === pendingRecipientId)) && (
                                        <button 
                                            onClick={() => setActiveConversation(null)}
                                            className={clsx(
                                                "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group relative",
                                                !activeConversationId 
                                                    ? "bg-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-white/5" 
                                                    : "hover:bg-white/5 border border-transparent hover:border-white/5"
                                            )}
                                        >
                                            <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 shadow-lg">
                                                <Image 
                                                    src={getAuthenticatedSrc(pendingRecipientUser.avatarPath) || "/images/default-avatar.png"} 
                                                    alt={pendingRecipientUser.displayName} 
                                                    fill 
                                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <span className={clsx(
                                                        "font-bold truncate transition-colors",
                                                        !activeConversationId ? "text-white" : "text-neutral-300 group-hover:text-white"
                                                    )}>
                                                        {pendingRecipientUser.displayName || pendingRecipientUser.username}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-green-500 font-bold tracking-tight truncate mt-0.5 uppercase">
                                                    新会话
                                                </div>
                                            </div>
                                            {!activeConversationId && (
                                                <motion.div 
                                                    layoutId="active-indicator"
                                                    className="absolute left-0 w-1 h-6 bg-green-500 rounded-r-full"
                                                />
                                            )}
                                        </button>
                                    )}

                                    {conversations.map(conv => {
                                        const other = conv.participants.find(p => p.id !== user?.id);
                                        const lastMsg = conv.messages && conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : undefined;
                                        return (
                                            <button 
                                                key={conv.id}
                                                onClick={() => setActiveConversation(conv.id)}
                                                className={clsx(
                                                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group relative",
                                                    activeConversationId === conv.id 
                                                        ? "bg-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-white/5" 
                                                        : "hover:bg-white/5 border border-transparent hover:border-white/5"
                                                )}
                                            >
                                                <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 shadow-lg">
                                                    <Image 
                                                        src={getAuthenticatedSrc(other?.avatarPath) || "/images/default-avatar.png"} 
                                                        alt={other?.displayName} 
                                                        fill 
                                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                    {/* Online indicator on avatar if needed */}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-0.5">
                                                        <span className={clsx(
                                                            "font-bold truncate transition-colors",
                                                            activeConversationId === conv.id ? "text-white" : "text-neutral-300 group-hover:text-white"
                                                        )}>
                                                            {other?.displayName || other?.username}
                                                        </span>
                                                        <span className="text-[10px] text-neutral-500 font-medium pt-0.5">
                                                            {lastMsg ? formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: false, locale: zhCN }) : ""}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center gap-2">
                                                        <div className={clsx(
                                                            "text-xs truncate",
                                                            (conv.unreadCount || 0) > 0 ? "text-white font-medium italic" : "text-neutral-500 group-hover:text-neutral-400"
                                                        )}>
                                                            {lastMsg ? (lastMsg.senderId === user?.id ? `你: ${lastMsg.content}` : lastMsg.content) : "暂无消息"}
                                                        </div>
                                                        {(conv.unreadCount || 0) > 0 && (
                                                            <div className="min-w-[18px] h-[18px] flex items-center justify-center bg-green-500 text-[10px] font-black text-black rounded-full px-1 shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                                                                {conv.unreadCount}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {activeConversationId === conv.id && (
                                                    <motion.div 
                                                        layoutId="active-indicator"
                                                        className="absolute left-0 w-1 h-6 bg-green-500 rounded-r-full"
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-2 space-y-1">
                                    {notifications.length > 0 ? (
                                        notifications.map(n => (
                                            <div 
                                                key={n.id}
                                                onClick={() => !n.read && markAsRead(n.id)}
                                                className={clsx(
                                                    "p-3 rounded-xl transition-all cursor-pointer",
                                                    n.read ? "opacity-60 hover:bg-neutral-900" : "bg-white/5 border border-white/10 hover:bg-white/10"
                                                )}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={clsx("text-sm font-bold", !n.read ? "text-white" : "text-neutral-400")}>{n.title}</span>
                                                    <span className="text-[10px] text-neutral-500">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: zhCN })}</span>
                                                </div>
                                                <p className="text-xs text-neutral-400 leading-relaxed">{n.message}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-neutral-500 text-sm">
                                            <Bell size={40} className="mx-auto mb-2 opacity-20" />
                                            暂无新通知
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col bg-[#121212]">
                        {(activeConversation || pendingRecipientUser) ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 bg-[#121212] border-b border-neutral-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div 
                                            className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => {
                                                if (displayedUser?.id) {
                                                    router.push(`/profile/${displayedUser.id}`);
                                                    onClose();
                                                }
                                            }}
                                        >
                                            <Image 
                                                src={getAuthenticatedSrc(displayedUser?.avatarPath) || "/images/default-avatar.png"} 
                                                alt={displayedUser?.displayName || ""} 
                                                fill 
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 
                                                className="font-bold text-white truncate cursor-pointer hover:underline"
                                                onClick={() => {
                                                    if (displayedUser?.id) {
                                                        router.push(`/profile/${displayedUser.id}`);
                                                        onClose();
                                                    }
                                                }}
                                            >
                                                {displayedUser?.displayName || displayedUser?.username}
                                            </h3>
                                            <div className={clsx(
                                                "text-[10px] flex items-center gap-1",
                                                formatOnlineStatus(displayedUser?.updatedAt).isOnline ? "text-green-500" : "text-neutral-500"
                                            )}>
                                                <div className={clsx(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    formatOnlineStatus(displayedUser?.updatedAt).isOnline ? "bg-green-500 animate-pulse" : "bg-neutral-500"
                                                )} />
                                                {formatOnlineStatus(displayedUser?.updatedAt).text}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[#0a0a0a]/50">
                                    {activeConversation ? (
                                        activeConversation.messages?.map((msg, idx) => {
                                            const isMe = msg.senderId === user?.id;
                                            return (
                                                <div 
                                                    key={msg.id} 
                                                    className={clsx("flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300", isMe ? "items-end" : "items-start")}
                                                >
                                                    <div className={clsx(
                                                        "max-w-[80%] px-4 py-3 shadow-xl transition-all hover:scale-[1.02]",
                                                        isMe 
                                                            ? "bg-gradient-to-br from-green-500 to-emerald-600 text-black font-medium rounded-2xl rounded-tr-none" 
                                                            : "bg-neutral-800/90 backdrop-blur-sm text-neutral-100 rounded-2xl rounded-tl-none border border-white/5"
                                                    )}>
                                                        <p className="text-[13px] md:text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                                                    </div>
                                                    <span className={clsx(
                                                        "text-[9px] mt-1.5 font-bold uppercase tracking-wider opacity-30 px-1",
                                                        isMe ? "text-right" : "text-left"
                                                    )}>
                                                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: zhCN })}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-neutral-500 space-y-2">
                                            <p className="text-sm">打个招呼吧！</p>
                                            <p className="text-[10px] opacity-50">与 {displayedUser?.displayName} 开启新的对话</p>
                                        </div>
                                    )}
                                    <div ref={messageEndRef} />
                                </div>

                                {/* Input */}
                                <ChatInput onSend={handleSendMessage} />
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 p-8 text-center">
                                <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110">
                                    <MessageCircle size={32} className="opacity-20" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">连接你的好友</h3>
                                <p className="max-w-xs text-sm leading-relaxed">
                                    从左侧栏选择一个会话开始聊天，或者输入好友 UID 来同步音乐的心情。
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
