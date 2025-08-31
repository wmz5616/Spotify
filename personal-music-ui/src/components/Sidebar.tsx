import React from "react";
import Link from "next/link";

// 1. 为从API获取的艺术家数据定义一个类型，增强代码健壮性
type Artist = {
  id: number;
  name: string;
  _count: {
    albums: number;
  };
};

// 2. 将组件声明为 async，使其可以在服务器端执行异步操作
const Sidebar = async () => {
  let artists: Artist[] = [];

  // 3. 使用 fetch 从后端API获取艺术家列表
  try {
    const res = await fetch("http://localhost:3000/api/artists", {
      cache: "no-store", // 在开发阶段，确保每次都能获取最新数据
    });

    if (res.ok) {
      artists = await res.json();
    } else {
      console.error("Failed to fetch artists:", res.statusText);
    }
  } catch (error) {
    console.error("An error occurred while fetching artists:", error);
  }

  return (
    <aside className="row-span-2 flex flex-col bg-neutral-900 p-4">
      <div className="mb-4">
        {/* 这里可以放 Logo 或 Home/Search 链接 */}
        <h1 className="text-2xl font-bold">My Music</h1>
      </div>
      <div className="flex-grow overflow-y-auto">
        <h2 className="text-sm font-semibold text-neutral-400 mb-2">ARTISTS</h2>
        <nav>
          <ul>
            {/* 4. 使用 map 遍历获取到的 artists 数组，并渲染成一个列表 */}
            {artists.map((artist) => (
              <li key={artist.id} className="mb-1">
                <Link
                  href={`/artist/${artist.id}`}
                  className="block text-neutral-300 hover:text-white transition-colors duration-200 py-1 rounded"
                >
                  {artist.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
