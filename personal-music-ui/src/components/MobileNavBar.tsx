"use client";

import React from 'react';
import { Home, Search, Library, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileNavBar() {
    const pathname = usePathname();

    const navItems = [
        { icon: Home, label: 'Home', href: '/' },
        { icon: Search, label: 'Search', href: '/search' },
        { icon: Library, label: 'Library', href: '/library' },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-[#282828] px-6 py-3 flex justify-between items-center z-50">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col items-center gap-1 ${isActive ? 'text-white' : 'text-neutral-500'
                            }`}
                    >
                        <item.icon size={24} />
                        <span className="text-[10px]">{item.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
