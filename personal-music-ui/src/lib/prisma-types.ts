export interface User {
  id: number;
  email: string;
  passwordHash: string;
  username: string | null;
  displayName: string | null;
  avatarPath: string | null;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
  settings?: UserSettings | null;
  favoriteSongs?: FavoriteSong[];
  favoriteAlbums?: FavoriteAlbum[];
  followedArtists?: FollowedArtist[];
  playHistories?: PlayHistory[];
  playlists?: UserPlaylist[];
  notifications?: Notification[];
}

export interface UserSettings {
  id: number;
  userId: number;
  user?: User;
  theme: string;
  audioQuality: string;
  autoPlay: boolean;
  notifications: boolean;
}

export interface FavoriteSong {
  id: number;
  userId: number;
  user?: User;
  songId: number;
  song?: Song;
  createdAt: Date;
}

export interface FavoriteAlbum {
  id: number;
  userId: number;
  user?: User;
  albumId: number;
  album?: Album;
  createdAt: Date;
}

export interface FollowedArtist {
  id: number;
  userId: number;
  user?: User;
  artistId: number;
  artist?: Artist;
  createdAt: Date;
}

export interface PlayHistory {
  id: number;
  userId: number;
  user?: User;
  songId: number;
  song?: Song;
  playedAt: Date;
  duration: number | null;
  completed: boolean;
}

export interface UserPlaylist {
  id: number;
  userId: number;
  user?: User;
  name: string;
  description: string | null;
  coverPath: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  songs?: UserPlaylistSong[];
}

export interface UserPlaylistSong {
  id: number;
  playlistId: number;
  playlist?: UserPlaylist;
  songId: number;
  song?: Song;
  position: number;
  addedAt: Date;
}

export interface Artist {
  id: number;
  name: string;
  albums?: Album[];
  avatarUrl: string | null;
  headerUrl: string | null;
  bio: string | null;
  bioImageUrl: string | null;
  followers?: FollowedArtist[];
}

export interface Album {
  id: number;
  title: string;
  uniqueId: string;
  artists?: Artist[];
  songs?: Song[];
  coverPath: string | null;
  favoritedBy?: FavoriteAlbum[];
}

export interface Song {
  id: number;
  title: string;
  trackNumber: number | null;
  path: string;
  album?: Album;
  albumId: number;
  duration: number | null;
  lyrics: string | null;
  playlists?: Playlist[];
  favoritedBy?: FavoriteSong[];
  playHistories?: PlayHistory[];
  userPlaylistSongs?: UserPlaylistSong[];
}

export interface Playlist {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  songs?: Song[];
}

export interface Notification {
  id: string;
  userId: number;
  user?: User;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}
