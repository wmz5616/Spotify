"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileTabs from "@/components/profile/ProfileTabs";
import DynamicTab from "@/components/profile/DynamicTab";
import FriendsTab from "@/components/profile/FriendsTab";
import EditProfileModal from "@/components/profile/EditProfileModal";
import CreatePostModal from "@/components/profile/CreatePostModal";
import { apiClient, getAuthenticatedSrc } from "@/lib/api-client";
import { useUserStore } from "@/store/useUserStore";
import { User } from "@/lib/prisma-types";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus } from "lucide-react";
import Image from "next/image";

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const username = params.username as string;
    const { user: currentUser, isAuthenticated, hasHydrated } = useUserStore();
    
    const [user, setUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState("feed");
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [feed, setFeed] = useState<any[]>([]);
    const [friends, setFriends] = useState<any[]>([]);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [isLoadingTab, setIsLoadingTab] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);

    // Auth Guard: Redirect to home if not authenticated and storage is hydrated
    useEffect(() => {
        if (hasHydrated && !isAuthenticated) {
            router.push("/");
        }
    }, [hasHydrated, isAuthenticated, router]);

    useEffect(() => {
        if (username) {
            fetchProfile();
        }
    }, [username]);

    useEffect(() => {
        if (user) {
            fetchTabData();
        }
    }, [activeTab, user]);

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            // New endpoint: fetching by username/identifier
            const data = await apiClient<User>(`/api/user/profile/username/${username}`);
            setUser(data);
            
            // Check if following (if logged in)
            if (currentUser && currentUser.id !== data.id) {
                const following = await apiClient<any[]>(`/api/social/following/${currentUser.id}`);
                setIsFollowing(following.some(f => f.followingId === data.id));
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error);
            // If fetching by identifier fails, it might be a 404
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTabData = async () => {
        if (!user) return;
        setIsLoadingTab(true);
        try {
            if (activeTab === "feed") {
                const data = await apiClient<any[]>(`/api/social/feed/${user.id}`);
                setFeed(data);
            } else if (activeTab === "following") {
                const data = await apiClient<any[]>(`/api/social/following/${user.id}`);
                setFriends(data.map(f => f.following));
            } else if (activeTab === "followers") {
                const data = await apiClient<any[]>(`/api/social/followers/${user.id}`);
                setFriends(data.map(f => f.follower));
            } else if (activeTab === "playlists") {
                const endpoint = isCurrentUser ? `/api/user-playlists` : `/api/user-playlists/user/${user.id}`;
                const data = await apiClient<any[]>(endpoint);
                setPlaylists(data);
            }
        } catch (error) {
            console.error("Failed to fetch tab data:", error);
        } finally {
            setIsLoadingTab(false);
        }
    };

    const handleUpdateProfile = async (updateData: any) => {
        try {
            await apiClient(`/api/user/profile`, {
                method: "PATCH",
                body: updateData,
            });
            fetchProfile();
        } catch (error) {
            console.error("Update profile failed:", error);
            throw error;
        }
    };

    const handleCreatePost = async (data: any) => {
        try {
            await apiClient(`/api/social/feed`, {
                method: "POST",
                body: data,
            });
            if (activeTab === "feed") {
                fetchTabData();
            }
            fetchProfile(); // Refresh post count
        } catch (error) {
            console.error("Create post failed:", error);
            throw error;
        }
    };

    const handleLikePost = async (postId: number, isLiked: boolean) => {
        try {
            setFeed(prev => prev.map(p => {
                if (p.id === postId) {
                    return { ...p, isLiked: !isLiked, _count: { ...p._count, likes: (p._count?.likes || 0) + (isLiked ? -1 : 1) } };
                }
                return p;
            }));
            const method = isLiked ? 'DELETE' : 'POST';
            await apiClient(`/api/social/feed/${postId}/like`, { method });
        } catch (error) {
            console.error("Like post failed:", error);
            fetchTabData();
        }
    };

    const handleFollow = async () => {
        if (!user) return;
        try {
            await apiClient(`/api/social/follow/${user.id}`, { method: "POST" });
            setIsFollowing(true);
            fetchProfile(); // Refresh stats
        } catch (error) {
            console.error("Follow failed:", error);
        }
    };

    const handleUnfollow = async () => {
        if (!user) return;
        try {
            await apiClient(`/api/social/follow/${user.id}`, { method: "DELETE" });
            setIsFollowing(false);
            fetchProfile(); // Refresh stats
        } catch (error) {
            console.error("Unfollow failed:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] text-neutral-400 gap-4">
                <p className="text-xl font-bold">用户不存在</p>
                <button onClick={() => router.back()} className="text-green-500 hover:underline">返回上一页</button>
            </div>
        );
    }

    const isCurrentUser = currentUser?.id === user.id;

    return (
        <div className="min-h-screen bg-[#121212]">
            <ProfileHeader
                user={user}
                isCurrentUser={isCurrentUser}
                isFollowing={isFollowing}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
                onEditProfile={() => setIsEditModalOpen(true)}
                onTabChange={setActiveTab}
                activeTab={activeTab}
            />

            <ProfileTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                counts={{
                    feed: (user as any)._count?.feedPosts || 0,
                    playlists: (user as any)._count?.playlists || 0,
                    following: (user as any)._count?.following || 0,
                    followers: (user as any)._count?.followers || 0,
                }}
            />

            <main className="max-w-[1500px] mx-auto px-6 md:px-10 pt-6 pb-20">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === "feed" && (
                            <div className="relative">
                                {isCurrentUser && (
                                    <div className="mb-6 flex justify-end">
                                        <button 
                                            onClick={() => setIsPostModalOpen(true)}
                                            className="px-5 py-2 md:px-7 md:py-2.5 bg-green-500 text-black font-bold rounded-full hover:scale-105 hover:bg-green-400 active:scale-95 transition-all flex items-center gap-2 shadow-[0_5px_20px_rgba(34,197,94,0.3)] text-sm md:text-base"
                                        >
                                            <Plus strokeWidth={2.5} size={18} />
                                            <span>发动态</span>
                                        </button>
                                    </div>
                                )}
                                <DynamicTab feed={feed} isLoading={isLoadingTab} onLike={handleLikePost} />
                            </div>
                        )}
                        {(activeTab === "following" || activeTab === "followers") && (
                            <FriendsTab friends={friends} type={activeTab} isLoading={isLoadingTab} />
                        )}
                        {activeTab === "playlists" && (
                            <div className="py-6">
                                {isLoadingTab ? (
                                    <div className="flex justify-center"><Loader2 className="animate-spin text-green-500" /></div>
                                ) : playlists.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                        {playlists.map(playlist => (
                                            <Link 
                                                key={playlist.id} 
                                                href={`/playlist/${playlist.id}`}
                                                className="bg-[#181818] p-4 rounded-xl hover:bg-[#282828] transition-all group cursor-pointer shadow-lg border border-neutral-800/50 block"
                                            >
                                                <div className="aspect-square relative mb-4 rounded-lg overflow-hidden shadow-2xl">
                                                    {playlist.coverPath ? (
                                                        <Image 
                                                            src={getAuthenticatedSrc(playlist.coverPath)} 
                                                            alt={playlist.name} 
                                                            fill 
                                                            className="object-cover group-hover:scale-110 transition-transform duration-500" 
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                                                            <Plus size={32} className="text-neutral-600" />
                                                        </div>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-white truncate">{playlist.name}</h3>
                                                <p className="text-neutral-500 text-sm mt-1">{playlist.userId === user.id ? "创建者" : "已收藏"}</p>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 text-neutral-500">
                                        暂无歌单数据
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {isCurrentUser && (
                    <>
                        <EditProfileModal 
                            user={user} 
                            isOpen={isEditModalOpen} 
                            onClose={() => setIsEditModalOpen(false)} 
                            onSave={handleUpdateProfile} 
                            onRefresh={fetchProfile}
                        />
                        <CreatePostModal 
                            isOpen={isPostModalOpen} 
                            onClose={() => setIsPostModalOpen(false)} 
                            onSave={handleCreatePost} 
                        />
                    </>
                )}
            </main>
        </div>
    );
}
