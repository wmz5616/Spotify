import AlbumCard from "@/components/AlbumCard";

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
    // 并行获取所有专辑和随机专辑
    const [albumsRes, randomAlbumsRes] = await Promise.all([
      fetch("http://localhost:3001/api/albums", {
        next: { revalidate: 3600 },
      }),
      fetch("http://localhost:3001/api/albums/random?take=6", {
        cache: "no-store", // 确保每次请求都是新的随机结果
      }),
    ]);

    if (albumsRes.ok) {
      albums = await albumsRes.json();
    } else {
      error = "Could not load albums from the library.";
    }

    if (randomAlbumsRes.ok) {
      randomAlbums = await randomAlbumsRes.json();
    }
  } catch (e) {
    console.error("Failed to fetch data for home page:", e);
    error = "Failed to connect to the server.";
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Welcome Back
        </h1>
        <p className="text-neutral-400 mt-2 text-sm">
          Here&apos;s a look at your collection.
        </p>
      </header>

      {/* 新增的随机推荐板块 */}
      {randomAlbums.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6">For You</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {randomAlbums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-bold text-white mb-6">All Albums</h2>

        {error ? (
          <div className="text-red-400 bg-red-900/20 p-4 rounded-md">
            <p className="font-bold">An error occurred:</p>
            <p>{error}</p>
          </div>
        ) : albums.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        ) : (
          <div className="text-neutral-500 mt-4">
            No albums found. You might need to scan your music library first.
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
