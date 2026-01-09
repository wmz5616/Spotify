import AlbumCard from "@/components/AlbumCard";
import WelcomeHeader from "@/components/WelcomeHeader";
import { apiClient } from "@/lib/api-client";

type Album = {
  id: number;
  title: string;
  artists: {
    id: number;
    name: string;
  }[];
  _count: {
    songs: number;
  };
};

const HomePage = async () => {
  let albums: Album[] = [];
  let randomAlbums: Album[] = [];
  let error: string | null = null;

  try {
    const [albumsData, randomAlbumsData] = await Promise.all([
      apiClient<Album[]>("/api/albums", {
        cache: "no-store",
      }),
      apiClient<Album[]>("/api/albums/random?take=6", {
        cache: "no-store",
      }),
    ]);

    albums = albumsData;
    randomAlbums = randomAlbumsData;
  } catch (e) {
    console.error("Failed to fetch data for home page:", e);
    error = "无法连接到服务器或认证失败 (请检查 API Key)";
  }

  return (
    <div>
      <WelcomeHeader />

      {randomAlbums.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6">为你推荐</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {randomAlbums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-bold text-white mb-6">所有专辑</h2>

        {error ? (
          <div className="text-red-400 bg-red-900/20 p-4 rounded-md border border-red-900/50">
            <p className="font-bold mb-1">加载失败</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        ) : albums.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        ) : (
          <div className="text-neutral-500 mt-4 text-center py-10">
            暂无专辑。请先在服务器端扫描你的音乐库。
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
