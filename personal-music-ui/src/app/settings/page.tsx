"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Settings, 
  Lock, 
  Volume2, 
  Camera,
  Loader2,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Palette,
  ExternalLink
} from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { useToastStore } from "@/store/useToastStore";
import Image from "next/image";
import { getAuthenticatedSrc } from "@/lib/api-client";
import clsx from "clsx";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function SettingsPage() {
  const { user, token, updateProfile, updateSettings, fetchUser, isAuthenticated, hasHydrated } = useUserStore();
  const { addToast } = useToastStore();
  
  const [activeTab, setActiveTab] = useState<"account">("account");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || "",
    username: user?.username || "",
    bio: user?.bio || "",
  });

  // Settings state (Theme and Audio Quality moved to Profile or updated automatically)
  const [settingsData, setSettingsData] = useState({
    theme: "dark",
    audioQuality: "high",
    autoPlay: true,
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.displayName || "",
        username: user.username || "",
        bio: user.bio || "",
      });
    }
  }, [user]);

  useEffect(() => {
    const loadSettings = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/user/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSettingsData({
                    theme: data.theme || "dark",
                    audioQuality: data.audioQuality || "high",
                    autoPlay: data.autoPlay ?? true,
                });
            }
        } catch (e) {
            console.error("Failed to load settings", e);
        }
    };
    loadSettings();
  }, [token]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(profileData);
      addToast("设置已保存");
    } catch (err) {
      addToast("保存失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingChange = async (key: string, value: any) => {
    const newData = { ...settingsData, [key]: value };
    setSettingsData(newData);
    try {
      await updateSettings(newData);
    } catch (err) {
      addToast("设置尝试保存失败");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    if (file.size > 2 * 1024 * 1024) {
      addToast("图像大小不能超过 2MB");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error("上传失败");

      await fetchUser();
      addToast("头像已更新");
    } catch (err) {
      addToast("上传头像失败");
    } finally {
      setIsUploading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addToast("两次输入的密码不一致");
      return;
    }

    setIsSaving(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/user/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.message || "修改失败");
      }

      addToast("密码已修改");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      addToast(err.message || "密码修改失败");
    } finally {
      setIsSaving(false);
    }
  };
  const getAvatarUrl = () => {
    if (user?.avatarPath) {
      return getAuthenticatedSrc(user.avatarPath);
    }
    return null;
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#1db954]" size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-neutral-400">
        <Settings size={48} className="mb-4 opacity-50" />
        <p>请先登录以管理您的设置</p>
      </div>
    );
  }

  const tabs = [
    { id: "account", label: "账户安全", icon: Lock },
  ];

  return (
    <div className="flex flex-col h-full bg-[#121212] text-white -mt-6">
      {/* Header - Simple Spotify Style */}
      <header className="px-8 pt-0 pb-2 shrink-0 border-b border-white/5 bg-[#121212]">
        <h1 className="text-2xl font-bold tracking-tight">设置</h1>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Navigation Sidebar - Clean & Simple */}
        <aside className="w-[240px] border-r border-white/5 py-4">
          <nav className="px-2 space-y-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-semibold transition-colors",
                  activeTab === tab.id
                    ? "bg-[#282828] text-white"
                    : "text-[#b3b3b3] hover:text-white"
                )}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area - Focus on Readability */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-[#121212]">
          <div className="max-w-3xl">
            <AnimatePresence mode="wait">




              {activeTab === "account" && (
                <motion.div
                  key="account"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-10"
                >
                  <section className="space-y-6">
                    <h3 className="text-sm font-bold text-[#b3b3b3] uppercase tracking-wider mb-2">安全中心</h3>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#b3b3b3] uppercase">当前密码</label>
                          <input
                            type="password"
                            required
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            className="w-full bg-[#1a1a1a] border border-transparent focus:border-[#535353] rounded px-4 py-2 text-sm outline-none transition-colors"
                            placeholder="••••••••"
                          />
                        </div>
                        <div />
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#b3b3b3] uppercase">新密码</label>
                          <input
                            type="password"
                            required
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="w-full bg-[#1a1a1a] border border-transparent focus:border-[#535353] rounded px-4 py-2 text-sm outline-none transition-colors"
                            placeholder="••••••••"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#b3b3b3] uppercase">确认新密码</label>
                          <input
                            type="password"
                            required
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className="w-full bg-[#1a1a1a] border border-transparent focus:border-[#535353] rounded px-4 py-2 text-sm outline-none transition-colors"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                      <div className="pt-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="bg-transparent border border-[#535353] text-white px-6 py-2 rounded-full text-xs font-bold hover:border-white transition-all uppercase tracking-widest disabled:opacity-50"
                        >
                          更新我的密码
                        </button>
                      </div>
                    </form>
                  </section>

                  <div className="p-6 rounded border border-red-900/40 bg-red-900/5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-red-500 mb-0.5">危险操作区</p>
                      <p className="text-xs text-[#b3b3b3]">永久注销您的个人账户，此操作不可撤销。</p>
                    </div>
                    <button className="text-xs font-bold text-[#b3b3b3] hover:text-red-500 transition-colors uppercase tracking-widest">
                       注销账户
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
