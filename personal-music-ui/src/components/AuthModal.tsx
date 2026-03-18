"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: "login" | "register";
}

export default function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
    const [mode, setMode] = useState<"login" | "register">(initialMode);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        setMode(initialMode);
    }, [initialMode]);

    const { login, register, isLoading, error, clearError } = useUserStore();
    const { initializeFavorites } = useFavoritesStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        let success = false;
        if (mode === "login") {
            success = await login(email, password);
        } else {
            success = await register(email, password, username || undefined, displayName || undefined);
        }

        if (success) {
            await initializeFavorites();
            onClose();
            resetForm();
        }
    };

    const resetForm = () => {
        setEmail("");
        setPassword("");
        setUsername("");
        setDisplayName("");
    };

    const switchMode = () => {
        setMode(mode === "login" ? "register" : "login");
        clearError();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md mx-4 bg-gradient-to-b from-neutral-800 to-neutral-900 rounded-2xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white transition rounded-full hover:bg-neutral-700"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-8">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    {mode === "login" ? "欢迎回来" : "创建账户"}
                                </h2>
                                <p className="text-neutral-400 text-sm">
                                    {mode === "login"
                                        ? "登录以继续使用您的音乐库"
                                        : "注册以开始您的音乐之旅"}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {mode === "register" && (
                                    <>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                                            <input
                                                type="text"
                                                placeholder="UID"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="w-full bg-neutral-700/50 border border-neutral-600 rounded-lg py-3 pl-11 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                                            />
                                        </div>

                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                                            <input
                                                type="text"
                                                placeholder="用户名"
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                className="w-full bg-neutral-700/50 border border-neutral-600 rounded-lg py-3 pl-11 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                                    <input
                                        type="email"
                                        placeholder="邮箱地址"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full bg-neutral-700/50 border border-neutral-600 rounded-lg py-3 pl-11 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                                    />
                                </div>

                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="密码"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full bg-neutral-700/50 border border-neutral-600 rounded-lg py-3 pl-11 pr-11 text-white placeholder:text-neutral-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-green-500 hover:bg-green-400 disabled:bg-green-500/50 text-black font-bold py-3 rounded-full transition flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            处理中...
                                        </>
                                    ) : (
                                        mode === "login" ? "登录" : "注册"
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <p className="text-neutral-400 text-sm">
                                    {mode === "login" ? "还没有账户？" : "已有账户？"}
                                    <button
                                        onClick={switchMode}
                                        className="text-white hover:underline ml-1 font-medium"
                                    >
                                        {mode === "login" ? "立即注册" : "立即登录"}
                                    </button>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
