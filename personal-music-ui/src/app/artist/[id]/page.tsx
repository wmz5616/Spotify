import React from "react";
import AlbumCard from "@/components/AlbumCard"; // 1. 导入我们新建的 AlbumCard 组件

// 类型定义 (保持不变)
type Album = {
  id: number;
  title: string;
  _count: {
    songs: number;
  };
};
type ArtistDetails = {
  id: number;
  name: string;
  albums: Album[];
};

const ArtistDetailPage = async ({ params }: { params: { id: string } }) => {
  const { id } = params;
  let artist: ArtistDetails | null = null;

  try {
    const res = await fetch(`http://localhost:3000/api/artists/${id}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      artist = await res.json();
    }
  } catch (error) {
    console.error("Failed to fetch artist details:", error);
  }

  if (!artist) {
    return <div className="p-10 text-center">Artist not found.</div>;
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-5xl font-extrabold tracking-tight">
          {artist.name}
        </h1>
      </header>

      <section>
        <h2 className="text-2xl font-bold mb-4">Albums</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {/* 2. 在这里使用 AlbumCard 组件，替换掉之前的 div */}
          {artist.albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default ArtistDetailPage;
