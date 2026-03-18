"use client";

import React, { useState } from "react";
import { X, Send, Loader2, Image as ImageIcon, Music, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient, getAuthenticatedSrc } from "@/lib/api-client";
import Image from "next/image";

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
}

export default function CreatePostModal({ isOpen, onClose, onSave }: CreatePostModalProps) {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Attachments
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    
    // Song Search
    const [showSongSearch, setShowSongSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedSong, setSelectedSong] = useState<any | null>(null);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const newFiles = Array.from(e.target.files);
        setIsUploading(true);
        let urls = [...imageUrls];
        try {
            for (const file of newFiles) {
                const formData = new FormData();
                formData.append('image', file);
                const res = await apiClient<{url: string}>('/api/social/feed/image', { method: 'POST', body: formData as any });
                urls.push(res.url);
            }
            setImageUrls(urls);
        } catch (error) {
            console.error('Image upload failed', error);
        } finally {
            setIsUploading(false);
        }
    };
    
    const removeImage = (index: number) => {
        setImageUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleSearchSong = async (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await apiClient<any>(`/api/search?q=${encodeURIComponent(query)}`);
            setSearchResults(res.songs?.slice(0, 4) || []);
        } catch (error) {
            console.error('Search failed', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && imageUrls.length === 0 && !selectedSong) return;

        setIsSubmitting(true);
        try {
            await onSave({
                content,
                type: selectedSong ? 'song' : 'text',
                targetId: selectedSong ? selectedSong.id : undefined,
                images: imageUrls.length > 0 ? imageUrls : undefined,
            });
            setContent("");
            setImageUrls([]);
            setSelectedSong(null);
            setShowSongSearch(false);
            setSearchQuery("");
            setSearchResults([]);
            onClose();
        } catch (error) {
            console.error("Failed to create post:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-[#282828] w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-neutral-800 shrink-0">
                            <h2 className="text-xl font-bold text-white">发布新动态</h2>
                            <button onClick={onClose} className="p-2 hover:bg-neutral-700 rounded-full transition">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
                            <div className="p-6 pb-2">
                                <textarea
                                    autoFocus
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="这一刻的想法..."
                                    rows={4}
                                    className="w-full bg-transparent border-none text-xl text-white placeholder:text-neutral-600 focus:ring-0 outline-none transition resize-none"
                                />
                            </div>

                            {/* Image Previews */}
                            {imageUrls.length > 0 && (
                                <div className="px-6 pb-4 flex gap-2 overflow-x-auto">
                                    {imageUrls.map((url, i) => (
                                        <div key={i} className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-neutral-700 bg-neutral-900 group">
                                            <Image src={getAuthenticatedSrc(url.startsWith('/public') ? url : `/public${url}`)} alt="Preview" fill className="object-cover" />
                                            <button 
                                                type="button" 
                                                onClick={() => removeImage(i)}
                                                className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Attached Song */}
                            {selectedSong && (
                                <div className="px-6 pb-4">
                                    <div className="bg-[#181818] border border-neutral-800 rounded-xl p-3 flex items-center gap-4 relative">
                                        <div className="w-12 h-12 bg-neutral-800 rounded-md overflow-hidden relative">
                                            {selectedSong.album?.coverPath ? (
                                                <Image src={getAuthenticatedSrc(selectedSong.album.coverPath)} alt="Cover" fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><Music size={20} className="text-neutral-500" /></div>
                                            )}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-white font-bold text-sm truncate">{selectedSong.title}</p>
                                            <p className="text-neutral-400 text-xs truncate">{selectedSong.album?.artists?.[0]?.name || '未知歌手'}</p>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => setSelectedSong(null)}
                                            className="p-2 hover:bg-neutral-700 rounded-full transition text-neutral-400"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Song Search Popover */}
                            {showSongSearch && !selectedSong && (
                                <div className="px-6 pb-4">
                                    <div className="bg-[#181818] rounded-xl border border-neutral-700 overflow-hidden">
                                        <div className="flex items-center px-3 py-2 border-b border-neutral-800">
                                            <Search size={16} className="text-neutral-400 mr-2" />
                                            <input 
                                                type="text" 
                                                autoFocus
                                                value={searchQuery}
                                                onChange={(e) => handleSearchSong(e.target.value)}
                                                placeholder="搜索歌曲..." 
                                                className="bg-transparent flex-1 text-sm text-white outline-none placeholder:text-neutral-600"
                                            />
                                            {isSearching && <Loader2 size={16} className="animate-spin text-neutral-400 ml-2" />}
                                        </div>
                                        <div className="max-h-40 overflow-y-auto">
                                            {searchResults.map(song => (
                                                <button 
                                                    key={song.id} 
                                                    type="button"
                                                    onClick={() => setSelectedSong(song)}
                                                    className="w-full flex items-center gap-3 p-2 hover:bg-neutral-800 text-left transition"
                                                >
                                                    <div className="w-8 h-8 rounded relative overflow-hidden bg-neutral-800 shrink-0">
                                                        {song.album?.coverPath ? (
                                                            <Image src={getAuthenticatedSrc(song.album.coverPath)} alt="Cover" fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center"><Music size={12} className="text-neutral-500" /></div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className="text-white text-xs font-medium truncate">{song.title}</p>
                                                        <p className="text-neutral-400 text-[10px] truncate">{song.album?.artists?.[0]?.name}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Toolbar & Actions */}
                            <div className="mt-auto flex justify-between items-center p-6 pt-4 border-t border-neutral-800 shrink-0">
                                <div className="flex gap-2">
                                    <label className={`p-2 rounded-full cursor-pointer transition ${imageUrls.length >= 9 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-neutral-700 text-green-400'}`}>
                                        {isUploading ? <Loader2 size={24} className="animate-spin" /> : <ImageIcon size={24} />}
                                        <input 
                                            type="file" 
                                            multiple 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={handleImageChange}
                                            disabled={isUploading || imageUrls.length >= 9}
                                        />
                                    </label>
                                    <button 
                                        type="button" 
                                        onClick={() => setShowSongSearch(!showSongSearch)}
                                        className={`p-2 hover:bg-neutral-700 rounded-full transition ${selectedSong || showSongSearch ? 'text-green-500' : 'text-green-400'}`}
                                    >
                                        <Music size={24} />
                                    </button>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-2 text-white font-bold hover:scale-105 transition"
                                    >
                                        返回
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || (!content.trim() && imageUrls.length === 0 && !selectedSong)}
                                        className="px-8 py-2 bg-green-500 text-black font-bold rounded-full hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /><span>发布</span></>}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
