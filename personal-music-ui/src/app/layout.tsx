import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar"; // 1. 导入Sidebar组件
import PlayerControls from "@/components/PlayerControls"; // 2. 导入PlayerControls组件
import AudioPlayer from "@/components/AudioPlayer";

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
        <div className="grid grid-rows-[1fr_auto] grid-cols-[auto_1fr] h-screen bg-black text-white">
          <Sidebar /> {/* 3. 使用Sidebar组件 */}
          <main className="overflow-y-auto relative">
            {/* 这个 div 就是我们的渐变背景 */}
            <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-emerald-800 to-neutral-900/50 -z-10" />
            <div className="p-6">{children}</div>
          </main>
          <PlayerControls /> {/* 4. 使用PlayerControls组件 */}
          <AudioPlayer />
        </div>
      </body>
    </html>
  );
}
