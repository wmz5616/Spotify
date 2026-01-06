import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import PlayerControls from "@/components/PlayerControls";
import AudioPlayer from "@/components/AudioPlayer";
import Header from "@/components/Header";
import NowPlayingView from "@/components/NowPlayingView";
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
        <div className="h-screen flex flex-col bg-black text-white">
          <div className="flex-grow flex min-h-0">
            <Sidebar />
            <main id="main-content" className="flex-1 overflow-y-auto relative">
              <Header />
              <div className="p-6">{children}</div>
            </main>
          </div>
          <PlayerControls />
          <AudioPlayer />
          <NowPlayingView /> {}
        </div>
      </body>
    </html>
  );
}
