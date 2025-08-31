import Image from "next/image";
import Link from "next/link";
import React from "react";

// 定义这个组件期望接收的 album 数据的类型
type AlbumForCard = {
  id: number;
  title: string;
  _count: {
    songs: number;
  };
};

const AlbumCard = ({ album }: { album: AlbumForCard }) => {
  // 构建获取专辑封面的URL
  const albumArtUrl = `http://localhost:3000/api/album-art/${album.id}`;

  return (
    <Link href={`/album/${album.id}`} className="block">
      <div className="bg-neutral-800 p-4 rounded-lg hover:bg-neutral-700/80 transition-colors duration-300 group">
        <div className="relative w-full aspect-square mb-4 shadow-lg">
          <Image
            src={albumArtUrl}
            alt={`Cover for ${album.title}`}
            fill
            className="object-cover rounded-md"
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 20vw"
          />
        </div>
        <h3 className="font-bold truncate text-white">{album.title}</h3>
        <p className="text-sm text-neutral-400">{album._count.songs} songs</p>
      </div>
    </Link>
  );
};

export default AlbumCard;
