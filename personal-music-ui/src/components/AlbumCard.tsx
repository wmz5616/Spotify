import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Play } from "lucide-react";

// 定义这个组件期望接收的 album 数据的类型
type AlbumForCard = {
  id: number;
  title: string;
  artist?: {
    name: string;
  };
  _count: {
    songs: number;
  };
};

const AlbumCard = ({ album }: { album: AlbumForCard }) => {
  // 构建获取专辑封面的URL
  const albumArtUrl = `http://localhost:3000/api/album-art/${album.id}`;

  return (
    <Link href={`/album/${album.id}`} className="block group">
      {" "}
      {/* 2. 在 Link 上添加 group */}
      <div className="bg-neutral-800/50 p-4 rounded-lg hover:bg-neutral-700/80 transition-all duration-300">
        <div className="relative w-full aspect-square mb-4 shadow-lg">
          <Image
            src={albumArtUrl}
            alt={`Cover for ${album.title}`}
            fill
            className="object-cover rounded-md"
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 20vw"
          />
          {/* 3. 这是新增的悬浮播放按钮 */}
          <div className="absolute bottom-2 right-2 flex items-center justify-center bg-green-500 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 group-hover:bottom-3 transition-all duration-300">
            <Play size={24} className="text-black" fill="black" />
          </div>
        </div>
        <h3 className="font-bold truncate text-white">{album.title}</h3>
        <p className="text-sm text-neutral-400">
          {album._count ? `${album._count.songs} songs` : ` `}
        </p>
      </div>
    </Link>
  );
};

export default AlbumCard;
