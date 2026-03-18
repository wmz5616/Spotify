import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

interface ThemeState {
    mode: ThemeMode;
    resolvedTheme: ResolvedTheme;
    setMode: (mode: ThemeMode) => void;
    initializeTheme: () => void;
}

const getSystemTheme = (): ResolvedTheme => {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const applyTheme = (theme: ResolvedTheme) => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);

    if (theme === "dark") {
        root.style.setProperty("--bg-primary", "#000000");
        root.style.setProperty("--bg-secondary", "#121212");
        root.style.setProperty("--bg-tertiary", "#181818");
        root.style.setProperty("--bg-elevated", "#282828");
        root.style.setProperty("--text-primary", "#ffffff");
        root.style.setProperty("--text-secondary", "#b3b3b3");
        root.style.setProperty("--text-muted", "#6a6a6a");
        root.style.setProperty("--border-color", "#282828");
        root.style.setProperty("--accent-color", "#1db954");
        root.style.setProperty("--accent-hover", "#1ed760");
    } else {
        root.style.setProperty("--bg-primary", "#ffffff");
        root.style.setProperty("--bg-secondary", "#f5f5f5");
        root.style.setProperty("--bg-tertiary", "#ebebeb");
        root.style.setProperty("--bg-elevated", "#ffffff");
        root.style.setProperty("--text-primary", "#000000");
        root.style.setProperty("--text-secondary", "#6a6a6a");
        root.style.setProperty("--text-muted", "#9a9a9a");
        root.style.setProperty("--border-color", "#e0e0e0");
        root.style.setProperty("--accent-color", "#1db954");
        root.style.setProperty("--accent-hover", "#1aa34a");
    }
};

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            mode: "dark",
            resolvedTheme: "dark",

            setMode: (mode: ThemeMode) => {
                const resolved = mode === "system" ? getSystemTheme() : mode;
                applyTheme(resolved);
                set({ mode, resolvedTheme: resolved });
            },

            initializeTheme: () => {
                const { mode } = get();
                const resolved = mode === "system" ? getSystemTheme() : mode;
                applyTheme(resolved);
                set({ resolvedTheme: resolved });

                if (typeof window !== "undefined") {
                    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
                    const handleChange = () => {
                        const currentMode = get().mode;
                        if (currentMode === "system") {
                            const newResolved = getSystemTheme();
                            applyTheme(newResolved);
                            set({ resolvedTheme: newResolved });
                        }
                    };
                    mediaQuery.addEventListener("change", handleChange);
                }
            },
        }),
        {
            name: "theme-storage",
            partialize: (state) => ({ mode: state.mode }),
        }
    )
);
