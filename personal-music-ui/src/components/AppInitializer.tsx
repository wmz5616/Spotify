"use client";

import { useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";

export default function AppInitializer({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, token } = useUserStore();
    const { initializeFavorites, isInitialized } = useFavoritesStore();

    useEffect(() => {
        if (isAuthenticated && token && !isInitialized) {
            initializeFavorites();
        }
    }, [isAuthenticated, token, isInitialized, initializeFavorites]);

    return <>{children}</>;
}
