export type Artist = {
  id: number;
  name: string;
  avatarUrl?: string | null;
  headerUrl?: string | null;
  albums?: Album[];
  bio?: string | null;
  bioImageUrl?: string | null;
};

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

export type Playlist = {
  id: number;
  name: string;
  songs: Song[];
  _count: {
    songs: number;
  };
};
