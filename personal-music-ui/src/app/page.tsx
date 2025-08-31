import AlbumCard from "@/components/AlbumCard";
import type { Song } from "@/types"; // 我们复用之前创建的类型

// 为从API获取的专辑数据定义一个更完整的类型
// 注意：这与 AlbumCard 中定义的类型是兼容的
type Album = {
  id: number;
  title: string;
  _count: {
    songs: number;
  };
};

// 这是一个异步的服务器组件，它会在服务器端预取数据
// 这样可以实现极快的初始加载速度
const HomePage = async () => {
  let albums: Album[] = [];
  let error: string | null = null;

  try {
    // 从我们的后端API获取所有专辑的数据
    const res = await fetch("http://localhost:3000/api/albums", {
      next: { revalidate: 3600 }, // 将结果缓存1小时 (3600秒)
    });

    if (res.ok) {
      albums = await res.json();
    } else {
      // 如果API请求失败，记录一个错误信息
      error = "Could not load albums from the library.";
    }
  } catch (e) {
    // 如果网络请求本身就失败了（比如后端服务没开），也记录错误
    console.error("Failed to fetch albums for home page:", e);
    error = "Failed to connect to the server.";
  }

  return (
    // 使用 padding 来创建页面内容的边距
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Welcome Back
        </h1>
        <p className="text-neutral-400 mt-2 text-sm">
          Here&apos;s a look at your collection.
        </p>
      </header>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">All Albums</h2>

        {/* 根据数据加载情况，显示不同的内容 */}
        {error ? (
          // 如果有错误，显示错误提示
          <div className="text-red-400 bg-red-900/20 p-4 rounded-md">
            <p className="font-bold">An error occurred:</p>
            <p>{error}</p>
          </div>
        ) : albums.length > 0 ? (
          // 如果有数据，用网格布局展示专辑卡片
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {/* 在这里复用我们之前创建的 AlbumCard 组件，循环渲染每个专辑 */}
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        ) : (
          // 如果没有数据，显示提示信息
          <div className="text-neutral-500 mt-4">
            No albums found. You might need to scan your music library first.
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
