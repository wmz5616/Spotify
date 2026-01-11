"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Disc, ListMusic } from "lucide-react";
import { cn } from "@/lib/utils";

const MobileNavBar = () => {
  const pathname = usePathname();

  const navItems = [
    {
      label: "首页",
      href: "/",
      icon: Home,
    },
    {
      label: "搜索",
      href: "/search",
      icon: Search,
    },
    {
      label: "专辑",
      href: "/albums",
      icon: Disc,
    },
    {
      label: "歌单",
      href: "/playlists",
      icon: ListMusic,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-white/10 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-90 transition-transform duration-200",
                isActive
                  ? "text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              )}
            >
              <div
                className={cn(
                  "p-1 rounded-full transition-colors",
                  isActive && "bg-white/10"
                )}
              >
                <Icon
                  className={cn("w-5 h-5", isActive && "fill-current")}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNavBar;
