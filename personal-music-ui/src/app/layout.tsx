import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import PlayerControls from "@/components/PlayerControls";
import AudioPlayer from "@/components/AudioPlayer";
import Header from "@/components/Header";
import NowPlayingView from "@/components/NowPlayingView";
import GlobalKeyboardShortcuts from "@/components/GlobalKeyboardShortcuts";
import ToastContainer from "@/components/ToastContainer";
import MobileNavBar from "@/components/MobileNavBar";
import ThemeProvider from "@/components/ThemeProvider";
import AppInitializer from "@/components/AppInitializer";
import AmbientBackground from "@/components/AmbientBackground";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Personal Music Cloud",
  description: "Your personal music library",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <AppInitializer>
            <div className="h-screen flex flex-col bg-black text-white relative">
              <AmbientBackground />

              <div className="flex-grow flex min-h-0 relative z-10">
                <Sidebar />
                <main id="main-content" className="flex-1 overflow-y-auto relative custom-scrollbar">
                  <Header />
                  <div className="p-6 pb-32 md:pb-6">{children}</div>
                </main>
              </div>

              <div className="relative z-20">
                <MobileNavBar />
                <PlayerControls />
              </div>

              <AudioPlayer />
              <NowPlayingView />
              <GlobalKeyboardShortcuts />
              <ToastContainer />
            </div>
          </AppInitializer>
        </ThemeProvider>
      </body>
    </html>
  );
}


