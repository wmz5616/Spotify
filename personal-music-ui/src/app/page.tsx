import AlbumCard from "@/components/AlbumCard";
import QuickResumeCard from "@/components/QuickResumeCard";
import WelcomeHeader from "@/components/WelcomeHeader";
import { apiClient } from "@/lib/api-client";
import { FadeInContainer, FadeInItem } from "@/components/FadeInStagger";

type Album = {
  id: number;
  title: string;
  coverPath?: string | null;
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
      apiClient<Album[]>("/api/albums", { cache: "no-store" }),
      apiClient<Album[]>("/api/albums/random?take=6", { cache: "no-store" }),
    ]);

    albums = albumsData;
    randomAlbums = randomAlbumsData;
  } catch (e) {
    console.error("Failed to fetch data for home page:", e);
    error = "无法连接到服务器或认证失败 (请检查 API Key)";
  }

  const gradientColor = "from-emerald-900";

  return (
    <div
      className={`relative min-h-screen bg-gradient-to-b ${gradientColor} via-[#121212] to-[#121212] pt-4 pb-32`}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-black/30 pointer-events-none" />

      <div className="relative z-10 px-6">
        <WelcomeHeader />

        {randomAlbums.length > 0 && (
          <section className="mb-10">
            <FadeInContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {randomAlbums.map((album) => (
                <FadeInItem key={album.id}>
                  <QuickResumeCard album={album} />
                </FadeInItem>
              ))}
            </FadeInContainer>
          </section>
        )}

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              所有专辑
            </h2>
            <span className="text-sm font-bold text-neutral-400 hover:underline cursor-pointer">
              显示全部
            </span>
          </div>

          {error ? (
            <div className="text-red-400 bg-red-900/20 p-4 rounded-md border border-red-900/50">
              <p className="font-bold mb-1">加载失败</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          ) : albums.length > 0 ? (
            <FadeInContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {albums.map((album) => (
                <FadeInItem key={album.id}>
                  <AlbumCard album={album} />
                </FadeInItem>
              ))}
            </FadeInContainer>
          ) : (
            <div className="text-neutral-500 mt-4 text-center py-10">
              暂无专辑。请先在服务器端扫描你的音乐库。
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HomePage;
