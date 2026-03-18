"use client";

import { useChatStore } from "@/store/useChatStore";
import ChatModal from "./ChatModal";

export default function ChatModalWrapper() {
    const { isChatOpen, setChatOpen } = useChatStore();
    
    return (
        <ChatModal 
            isOpen={isChatOpen} 
            onClose={() => setChatOpen(false)} 
        />
    );
}
