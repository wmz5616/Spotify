export type Artist = {
  id: number;
  name: string;
  avatarUrl?: string | null; // 新增
  headerUrl?: string | null; // 新增
  albums?: Album[]; // 让 albums 变成可选，因为有时我们不需要它
};

// 1. 新增并导出 Album 类型
export type Album = {
  id: number;
  title: string;
  artists: Artist[];
  songs: Song[];
  _count: {
    songs: number;
  };
};

export type Song = {
  id: number;
  title: string;
  trackNumber: number | null;
  duration?: number;
  album?: {
    id: number;
    title: string;
    artists: Artist[];
  };
};
