"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
    User,
    Settings,
    Palette,
    Volume2,
    Shield,
    Bell,
    LogOut,
    Camera,
    Save,
    Loader2,
    Check,
    AlertTriangle,
    Monitor,
    Moon,
    Sun,
} from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { useThemeStore } from "@/store/useThemeStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { apiClient, getAuthenticatedSrc } from "@/lib/api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type SettingsTab = "profile" | "account" | "appearance" | "audio" | "notifications";

export default function SettingsPage() {
    const router = useRouter();
    const { user, token, isAuthenticated, updateProfile, logout, fetchUser } = useUserStore();
    const { mode: themeMode, setMode: setThemeMode } = useThemeStore();
    const { autoPlayNext, setAutoPlayNext } = usePlayerStore();

    const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profileForm, setProfileForm] = useState({
        displayName: "",
        username: "",
        bio: "",
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [settings, setSettings] = useState({
        audioQuality: "high",
        notifications: true,
    });

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/");
            return;
        }

        if (user) {
            setProfileForm({
                displayName: user.displayName || "",
                username: user.username || "",
                bio: (user as any).bio || "",
            });
        }

        fetchUserSettings();
    }, [isAuthenticated, user, router]);

    const fetchUserSettings = async () => {
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/settings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setSettings((prev) => ({
                    ...prev,
                    audioQuality: data.audioQuality || "high",
                    notifications: data.notifications ?? true,
                }));
            }
        } catch (error) {
            console.error("获取设置失败:", error);
        }
    };

    const showMessage = (type: "success" | "error", text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateProfile(profileForm);
            showMessage("success", "个人资料已更新");
        } catch {
            showMessage("error", "更新失败，请重试");
        }
        setIsLoading(false);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token) return;

        const formData = new FormData();
        formData.append("avatar", file);

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/avatar`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (response.ok) {
                showMessage("success", "头像已更新");
                await fetchUser();
            } else {
                throw new Error("上传失败");
            }
        } catch {
            showMessage("error", "头像上传失败");
        }
        setIsLoading(false);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showMessage("error", "两次输入的密码不一致");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/password`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                }),
            });

            if (response.ok) {
                showMessage("success", "密码已修改");
                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                const error = await response.json();
                throw new Error(error.message || "修改失败");
            }
        } catch (error) {
            showMessage("error", error instanceof Error ? error.message : "密码修改失败");
        }
        setIsLoading(false);
    };

    const handleSettingsUpdate = async (key: string, value: unknown) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        try {
            await fetch(`${API_BASE_URL}/api/user/settings`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ [key]: value }),
            });
            showMessage("success", "设置已保存");
        } catch (error) {
            console.error("更新设置失败:", error);
        }
    };

    const handleThemeChange = (newTheme: "dark" | "light" | "system") => {
        setThemeMode(newTheme);
        handleSettingsUpdate("theme", newTheme);
    };

    const handleAutoPlayChange = (enabled: boolean) => {
        setAutoPlayNext(enabled);
        handleSettingsUpdate("autoPlay", enabled);
    };

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    const handleDeleteAccount = async () => {
        if (!confirm("确定要删除账户吗？此操作无法撤销！")) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/account`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                logout();
                router.push("/");
            }
        } catch {
            showMessage("error", "删除账户失败");
        }
        setIsLoading(false);
    };

    const tabs = [
        { id: "profile" as SettingsTab, label: "个人资料", icon: User },
        { id: "account" as SettingsTab, label: "账户安全", icon: Shield },
        { id: "appearance" as SettingsTab, label: "外观", icon: Palette },
        { id: "audio" as SettingsTab, label: "播放", icon: Volume2 },
        { id: "notifications" as SettingsTab, label: "通知", icon: Bell },
    ];

    const themeOptions = [
        { value: "dark", label: "深色", icon: Moon, desc: "始终使用深色主题" },
        { value: "light", label: "浅色", icon: Sun, desc: "始终使用浅色主题" },
        { value: "system", label: "跟随系统", icon: Monitor, desc: "自动匹配系统设置" },
    ];

    const getAvatarUrl = () => {
        if (user?.avatarPath) {
            const path = user.avatarPath.startsWith("/public")
                ? user.avatarPath
                : `/public${user.avatarPath}`;
            return getAuthenticatedSrc(path);
        }
        return null;
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen p-6 pb-32">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                <div className="flex items-center gap-3 mb-8">
                    <Settings className="text-neutral-400" size={28} />
                    <h1 className="text-3xl font-bold text-white">设置</h1>
                </div>

                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === "success"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}
                    >
                        {message.type === "success" ? <Check size={20} /> : <AlertTriangle size={20} />}
                        {message.text}
                    </motion.div>
                )}

                <div className="flex gap-8">
                    <div className="w-56 flex-shrink-0">
                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === tab.id
                                        ? "bg-neutral-700/50 text-white"
                                        : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                                        }`}
                                >
                                    <tab.icon size={20} />
                                    <span>{tab.label}</span>
                                </button>
                            ))}

                            <hr className="border-neutral-700 my-4" />

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                            >
                                <LogOut size={20} />
                                <span>退出登录</span>
                            </button>
                        </nav>
                    </div>

                    <div className="flex-1 bg-neutral-800/30 rounded-xl p-6 border border-neutral-700/50">
                        {activeTab === "profile" && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-white mb-6">个人资料</h2>

                                <div className="flex items-center gap-6 mb-8">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-full overflow-hidden bg-neutral-700">
                                            {getAvatarUrl() ? (
                                                <Image
                                                    src={getAvatarUrl()!}
                                                    alt="头像"
                                                    width={96}
                                                    height={96}
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-green-600 text-3xl font-bold text-black">
                                                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition rounded-full"
                                        >
                                            <Camera size={24} className="text-white" />
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            className="hidden"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{user?.displayName || user?.email}</p>
                                        <p className="text-neutral-400 text-sm">{user?.email}</p>
                                    </div>
                                </div>

                                <form onSubmit={handleProfileSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-neutral-400 mb-2">显示名称</label>
                                        <input
                                            type="text"
                                            value={profileForm.displayName}
                                            onChange={(e) => setProfileForm((p) => ({ ...p, displayName: e.target.value }))}
                                            className="w-full bg-neutral-700/50 border border-neutral-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-green-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-neutral-400 mb-2">用户名</label>
                                        <input
                                            type="text"
                                            value={profileForm.username}
                                            onChange={(e) => setProfileForm((p) => ({ ...p, username: e.target.value }))}
                                            className="w-full bg-neutral-700/50 border border-neutral-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-green-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-neutral-400 mb-2">个人简介</label>
                                        <textarea
                                            value={profileForm.bio}
                                            onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                                            rows={3}
                                            className="w-full bg-neutral-700/50 border border-neutral-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-green-500 transition resize-none"
                                            placeholder="介绍一下自己..."
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex items-center gap-2 bg-green-500 hover:bg-green-400 disabled:bg-green-500/50 text-black font-bold py-2.5 px-6 rounded-full transition"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                        保存更改
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === "account" && (
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-xl font-semibold text-white mb-6">修改密码</h2>
                                    <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                                        <div>
                                            <label className="block text-sm text-neutral-400 mb-2">当前密码</label>
                                            <input
                                                type="password"
                                                value={passwordForm.currentPassword}
                                                onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                                                className="w-full bg-neutral-700/50 border border-neutral-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-green-500 transition"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-neutral-400 mb-2">新密码</label>
                                            <input
                                                type="password"
                                                value={passwordForm.newPassword}
                                                onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                                                className="w-full bg-neutral-700/50 border border-neutral-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-green-500 transition"
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-neutral-400 mb-2">确认新密码</label>
                                            <input
                                                type="password"
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                                                className="w-full bg-neutral-700/50 border border-neutral-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-green-500 transition"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="bg-green-500 hover:bg-green-400 disabled:bg-green-500/50 text-black font-bold py-2.5 px-6 rounded-full transition"
                                        >
                                            {isLoading ? "处理中..." : "修改密码"}
                                        </button>
                                    </form>
                                </div>

                                <hr className="border-neutral-700" />

                                <div>
                                    <h2 className="text-xl font-semibold text-red-400 mb-4">危险区域</h2>
                                    <p className="text-neutral-400 text-sm mb-4">
                                        删除账户后，所有数据将被永久删除，无法恢复。
                                    </p>
                                    <button
                                        onClick={handleDeleteAccount}
                                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 font-medium py-2.5 px-6 rounded-lg transition"
                                    >
                                        删除账户
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === "appearance" && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-white mb-6">外观设置</h2>

                                <div>
                                    <p className="text-neutral-400 text-sm mb-4">选择应用的颜色主题</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {themeOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleThemeChange(option.value as "dark" | "light" | "system")}
                                                className={`p-4 rounded-xl border-2 transition-all ${themeMode === option.value
                                                    ? "border-green-500 bg-green-500/10"
                                                    : "border-neutral-700 hover:border-neutral-500 bg-neutral-800/30"
                                                    }`}
                                            >
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className={`p-3 rounded-full ${themeMode === option.value ? "bg-green-500/20 text-green-500" : "bg-neutral-700 text-neutral-400"}`}>
                                                        <option.icon size={24} />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-white font-medium">{option.label}</p>
                                                        <p className="text-neutral-500 text-xs mt-1">{option.desc}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "audio" && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-white mb-6">播放设置</h2>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-neutral-700/30 rounded-lg">
                                        <div>
                                            <p className="text-white font-medium">音质</p>
                                            <p className="text-neutral-400 text-sm">选择音频播放质量（当前版本仅作展示）</p>
                                        </div>
                                        <select
                                            value={settings.audioQuality}
                                            onChange={(e) => handleSettingsUpdate("audioQuality", e.target.value)}
                                            className="bg-neutral-600 border border-neutral-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-green-500"
                                        >
                                            <option value="low">普通 (128kbps)</option>
                                            <option value="normal">较高 (256kbps)</option>
                                            <option value="high">极高 (320kbps)</option>
                                            <option value="lossless">无损</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-neutral-700/30 rounded-lg">
                                        <div>
                                            <p className="text-white font-medium">自动播放下一首</p>
                                            <p className="text-neutral-400 text-sm">当前歌曲播放结束后自动播放队列中的下一首</p>
                                        </div>
                                        <button
                                            onClick={() => handleAutoPlayChange(!autoPlayNext)}
                                            className={`w-12 h-6 rounded-full transition relative ${autoPlayNext ? "bg-green-500" : "bg-neutral-600"}`}
                                        >
                                            <div
                                                className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${autoPlayNext ? "translate-x-6" : "translate-x-0.5"}`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "notifications" && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-white mb-6">通知设置</h2>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-neutral-700/30 rounded-lg">
                                        <div>
                                            <p className="text-white font-medium">推送通知</p>
                                            <p className="text-neutral-400 text-sm">接收新音乐和活动通知</p>
                                        </div>
                                        <button
                                            onClick={() => handleSettingsUpdate("notifications", !settings.notifications)}
                                            className={`w-12 h-6 rounded-full transition relative ${settings.notifications ? "bg-green-500" : "bg-neutral-600"}`}
                                        >
                                            <div
                                                className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${settings.notifications ? "translate-x-6" : "translate-x-0.5"}`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 bg-neutral-700/20 rounded-lg border border-neutral-700/50">
                                    <p className="text-neutral-400 text-sm">
                                        💡 提示：通知功能需要浏览器支持，且可能需要您手动授权浏览器通知权限。
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
