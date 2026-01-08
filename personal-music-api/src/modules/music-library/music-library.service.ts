import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { PrismaService } from 'src/prisma/prisma.service';
import * as mm from 'music-metadata';
import { ensureDir, copy, pathExists } from 'fs-extra';
import { Artist, Album } from '@prisma/client';
import Fuse from 'fuse.js';

interface ParsedInfo {
  artist: string;
  album: string;
  title: string;
  trackNumber?: number;
  imageBuffer?: Buffer;
  duration?: number;
}

interface ArtistSearchItem {
  id: number;
  name: string;
}

interface AlbumSearchItem {
  id: number;
  title: string;
}

interface SongSearchItem {
  id: number;
  title: string;
}

interface FuseSearchInstance<T> {
  search(pattern: string): { item: T }[];
}

@Injectable()
export class MusicLibraryService {
  private artistFuse: FuseSearchInstance<ArtistSearchItem> | null = null;
  private albumFuse: FuseSearchInstance<AlbumSearchItem> | null = null;
  private songFuse: FuseSearchInstance<SongSearchItem> | null = null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAlbumArtBuffer(_id: number) {
    throw new Error('Method not implemented.');
  }
  constructor(private prisma: PrismaService) {}

  private sanitizeString(str: string): string {
    if (!str) return '';
    // eslint-disable-next-line no-control-regex
    return str.replace(/\u0000/g, '').trim();
  }

  parseInfoFromPath(
    filePath: string,
    musicDirectory: string,
  ): Omit<ParsedInfo, 'imageBuffer' | 'duration' | 'trackNumber'> | null {
    const relativePath = path.relative(musicDirectory, filePath);
    const parts = relativePath.split(path.sep);

    if (parts.length < 3) {
      console.warn(`Skipping file with invalid path structure: ${filePath}`);
      return null;
    }

    const artist = parts[0];
    const album = parts[1];
    const songFileName = path.basename(
      parts[parts.length - 1],
      path.extname(parts[parts.length - 1]),
    );

    const titleWithArtists = songFileName.replace(/^\d+\s*[-.]?\s*/, '');
    const separator = ' - ';
    const separatorIndex = titleWithArtists.lastIndexOf(separator);
    let title;

    if (separatorIndex !== -1) {
      title = titleWithArtists.substring(separatorIndex + separator.length);
    } else {
      title = titleWithArtists;
    }

    if (!artist || !album || !title) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return { artist, album, title };
  }

  async getSupplementaryMetadata(
    filePath: string,
  ): Promise<Pick<ParsedInfo, 'imageBuffer' | 'duration' | 'trackNumber'>> {
    try {
      const metadata = await mm.parseFile(filePath);
      const track = metadata.common.track.no;
      const picture = metadata.common.picture?.[0];

      return {
        imageBuffer: picture ? Buffer.from(picture.data) : undefined,
        duration: metadata.format.duration,
        trackNumber: track && !isNaN(track) ? track : undefined,
      };
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          `Error parsing metadata for ${filePath}: ${error.message}`,
        );
      } else {
        console.error(
          `An unknown error occurred while parsing ${filePath}`,
          error,
        );
      }
      return {};
    }
  }

  private async findFolderCover(albumPath: string): Promise<string | null> {
    const commonCoverNames = [
      'cover.jpg',
      'folder.jpg',
      'cover.png',
      'folder.png',
      'Cover.jpg',
      'Folder.jpg',
    ];
    for (const name of commonCoverNames) {
      const coverPath = path.join(albumPath, name);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      if (await pathExists(coverPath)) {
        return coverPath;
      }
    }
    return null;
  }

  async scanAndSaveMusic(directory: string, forceUpdate: boolean = false) {
    console.log(
      `Starting music library scan... (Force Update: ${forceUpdate})`,
    );
    const filePaths = await this.getAudioFilePaths(directory);
    console.log(`Found ${filePaths.length} audio files.`);

    const coversDir = path.join(process.cwd(), 'public', 'covers');
    const artistImagesDir = path.join(process.cwd(), 'public', 'artist-images');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await ensureDir(coversDir);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await ensureDir(artistImagesDir);

    const artistCache = new Map<string, Artist>();
    const albumCache = new Map<string, Album & { coverAttempted?: boolean }>();

    for (const filePath of filePaths) {
      const pathInfo = this.parseInfoFromPath(filePath, directory);
      if (!pathInfo) continue;

      const supplementaryInfo = await this.getSupplementaryMetadata(filePath);
      const tags = { ...pathInfo, ...supplementaryInfo };

      const artistName = this.sanitizeString(tags.artist);
      if (!artistName) continue;

      let artist = artistCache.get(artistName);
      if (!artist) {
        artist = await this.prisma.artist.upsert({
          where: { name: artistName },
          create: { name: artistName },
          update: {},
        });
        artistCache.set(artistName, artist);
        const artistFolderPath = path.dirname(path.dirname(filePath));
        const avatarPath = path.join(artistFolderPath, '头像.png');
        const headerPath = path.join(artistFolderPath, '封面图.png');
        const dataToUpdate: {
          avatarUrl?: string;
          headerUrl?: string;
          bio?: string;
          bioImageUrl?: string;
        } = {};

        const processArtistImage = async (
          sourcePath: string,
          type: 'avatar' | 'header',
        ): Promise<string | undefined> => {
          try {
            await fs.access(sourcePath);
            const targetFileName = `${artist!.id}-${type}.png`;
            const targetPath = path.join(artistImagesDir, targetFileName);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            await copy(sourcePath, targetPath, { overwrite: true });
            return `/artist-images/${targetFileName}`;
          } catch {
            return undefined;
          }
        };

        const newAvatarUrl = await processArtistImage(avatarPath, 'avatar');
        if (newAvatarUrl) {
          dataToUpdate.avatarUrl = newAvatarUrl;
        }

        const newHeaderUrl = await processArtistImage(headerPath, 'header');
        if (newHeaderUrl) {
          dataToUpdate.headerUrl = newHeaderUrl;
        }

        const bioTextPath = path.join(artistFolderPath, 'bio.txt');
        const bioImagePath = path.join(artistFolderPath, 'bio.png');

        try {
          await fs.access(bioTextPath);
          const bioContent = await fs.readFile(bioTextPath, 'utf-8');
          dataToUpdate.bio = bioContent;
        } catch {
          /* bio.txt does not exist, ignore */
        }

        try {
          await fs.access(bioImagePath);
          const targetFileName = `${artist.id}-bio.png`;
          const targetPath = path.join(artistImagesDir, targetFileName);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          await copy(bioImagePath, targetPath, { overwrite: true });
          dataToUpdate.bioImageUrl = `/artist-images/${targetFileName}`;
        } catch {
          /* bio.png does not exist, ignore */
        }

        if (Object.keys(dataToUpdate).length > 0) {
          artist = await this.prisma.artist.update({
            where: { id: artist.id },
            data: dataToUpdate,
          });
        }
      }

      const cleanAlbum = this.sanitizeString(tags.album);
      const cleanTitle = this.sanitizeString(tags.title);
      if (!cleanAlbum || !cleanTitle) continue;

      const albumUniqueId = `${cleanAlbum}___${artist.name}`;

      let album = albumCache.get(albumUniqueId);
      if (!album) {
        album = await this.prisma.album.upsert({
          where: { uniqueId: albumUniqueId },
          create: {
            title: cleanAlbum,
            uniqueId: albumUniqueId,
            artists: { connect: { id: artist.id } },
          },
          update: {
            artists: { connect: { id: artist.id } },
          },
        });
        albumCache.set(albumUniqueId, album);
      }
      if ((!album.coverPath || forceUpdate) && !album.coverAttempted) {
        let coverSaved = false;
        const albumFolderPath = path.dirname(filePath);
        const folderCoverPath = await this.findFolderCover(albumFolderPath);
        if (folderCoverPath) {
          const fileExtension = path.extname(folderCoverPath);
          const newCoverPath = path.join(
            coversDir,
            `${album.id}${fileExtension}`,
          );
          try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            await copy(folderCoverPath, newCoverPath, { overwrite: true });
            const coverPathForDb = `/covers/${album.id}${fileExtension}`;
            const updatedAlbum = await this.prisma.album.update({
              where: { id: album.id },
              data: { coverPath: coverPathForDb },
            });
            album.coverPath = updatedAlbum.coverPath;
            coverSaved = true;
            console.log(
              `[Cover] ${forceUpdate ? '覆盖' : '使用'}文件夹图片: ${folderCoverPath}`,
            );
          } catch (e) {
            console.error(
              `Failed to copy folder cover for album ID ${album.id}:`,
              e,
            );
          }
        }
        if (!coverSaved && tags.imageBuffer) {
          const newCoverPath = path.join(coversDir, `${album.id}.jpg`);
          try {
            await fs.writeFile(newCoverPath, tags.imageBuffer);
            const coverPathForDb = `/covers/${album.id}.jpg`;
            const updatedAlbum = await this.prisma.album.update({
              where: { id: album.id },
              data: { coverPath: coverPathForDb },
            });
            album.coverPath = updatedAlbum.coverPath;
            coverSaved = true;
            console.log(
              `[Cover] ${forceUpdate ? '覆盖' : '使用'}内嵌图片: ${filePath}`,
            );
          } catch (e) {
            console.error(
              `Failed to write embedded cover for album ID ${album.id}:`,
              e,
            );
          }
        }
        album.coverAttempted = true;
      }

      const lrcPath = filePath.replace(/\.[^/.]+$/, '.lrc');
      let lyrics: string | null = null;
      try {
        lyrics = await fs.readFile(lrcPath, 'utf-8');
      } catch {
        /* lyrics not found */
      }

      await this.prisma.song.upsert({
        where: { path: filePath },
        update: {
          title: cleanTitle,
          trackNumber: tags.trackNumber,
          albumId: album.id,
          duration: tags.duration,
          lyrics: lyrics,
        },
        create: {
          path: filePath,
          title: cleanTitle,
          trackNumber: tags.trackNumber,
          albumId: album.id,
          duration: tags.duration,
          lyrics: lyrics,
        },
      });
    }

    this.artistFuse = null;
    this.albumFuse = null;
    this.songFuse = null;
    console.log(
      'Music library scan and save complete. Search index invalidated.',
    );
  }

  private async ensureSearchIndex() {
    if (this.artistFuse && this.albumFuse && this.songFuse) {
      return;
    }

    console.log('Building in-memory search index...');

    const [artists, albums, songs] = await Promise.all([
      this.prisma.artist.findMany({ select: { id: true, name: true } }),
      this.prisma.album.findMany({ select: { id: true, title: true } }),
      this.prisma.song.findMany({ select: { id: true, title: true } }),
    ]);

    const commonOptions = {
      includeScore: true,
      threshold: 0.4,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    this.artistFuse = new Fuse(artists, {
      ...commonOptions,
      keys: ['name'],
    }) as unknown as FuseSearchInstance<ArtistSearchItem>;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    this.albumFuse = new Fuse(albums, {
      ...commonOptions,
      keys: ['title'],
    }) as unknown as FuseSearchInstance<AlbumSearchItem>;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    this.songFuse = new Fuse(songs, {
      ...commonOptions,
      keys: ['title'],
    }) as unknown as FuseSearchInstance<SongSearchItem>;

    console.log('Search index built successfully.');
  }

  async search(query: string) {
    if (!query) return { artists: [], albums: [], songs: [] };

    await this.ensureSearchIndex();

    const artistResults = this.artistFuse
      ? this.artistFuse.search(query).slice(0, 5)
      : [];
    const albumResults = this.albumFuse
      ? this.albumFuse.search(query).slice(0, 5)
      : [];
    const songResults = this.songFuse
      ? this.songFuse.search(query).slice(0, 10)
      : [];

    const artistIds = artistResults.map((r) => r.item.id);
    const albumIds = albumResults.map((r) => r.item.id);
    const songIds = songResults.map((r) => r.item.id);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [artists, albums, songs] = await Promise.all([
      artistIds.length > 0
        ? this.prisma.artist.findMany({
            where: { id: { in: artistIds } },
            include: { albums: { take: 1 } },
          })
        : ([] as any),
      albumIds.length > 0
        ? this.prisma.album.findMany({
            where: { id: { in: albumIds } },
            include: { artists: true, _count: { select: { songs: true } } },
          })
        : ([] as any),
      songIds.length > 0
        ? this.prisma.song.findMany({
            where: { id: { in: songIds } },
            include: { album: { include: { artists: true } } },
          })
        : ([] as any),
    ]);

    const sortedArtists = artistIds
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      .map((id) => artists.find((a: any) => a.id === id))
      .filter((a: any) => a !== undefined);

    const sortedAlbums = albumIds
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      .map((id) => albums.find((a: any) => a.id === id))
      .filter((a: any) => a !== undefined);

    const sortedSongs = songIds
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      .map((id) => songs.find((a: any) => a.id === id))
      .filter((a: any) => a !== undefined);

    return {
      artists: sortedArtists,
      albums: sortedAlbums,
      songs: sortedSongs,
    };
  }

  async findAllArtists() {
    return this.prisma.artist.findMany({
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        _count: { select: { albums: true } },
        albums: { take: 1, select: { id: true } },
      },
    });
  }

  async findArtistById(id: number) {
    return this.prisma.artist.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        headerUrl: true,
        bio: true,
        bioImageUrl: true,
        albums: {
          select: {
            id: true,
            title: true,
            coverPath: true,
            artists: { select: { id: true, name: true } },
            songs: { orderBy: { trackNumber: 'asc' } },
            _count: { select: { songs: true } },
          },
        },
      },
    });
  }

  async findAllAlbums() {
    return this.prisma.album.findMany({
      select: {
        id: true,
        title: true,
        coverPath: true,
        artists: { select: { id: true, name: true } },
        _count: { select: { songs: true } },
      },
    });
  }

  async findRandomAlbums(take: number) {
    const albumCount = await this.prisma.album.count();
    const skip = Math.max(0, Math.floor(Math.random() * albumCount) - take);
    return this.prisma.album.findMany({
      take,
      skip,
      select: {
        id: true,
        title: true,
        coverPath: true,
        artists: { select: { id: true, name: true } },
        _count: { select: { songs: true } },
      },
    });
  }

  async findAlbumById(id: number) {
    return this.prisma.album.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        coverPath: true,
        artists: { select: { id: true, name: true } },
        songs: {
          orderBy: { trackNumber: 'asc' },
          select: {
            id: true,
            title: true,
            trackNumber: true,
            duration: true,
            lyrics: true,
          },
        },
      },
    });
  }

  async findSongById(id: number) {
    return this.prisma.song.findUnique({ where: { id } });
  }

  async findAlbumArt(id: number) {
    return this.prisma.album.findUnique({
      where: { id },
      select: { coverPath: true },
    });
  }

  async findSongPath(id: number): Promise<string | null> {
    const song = await this.prisma.song.findUnique({
      where: { id },
      select: { path: true },
    });
    return song?.path ?? null;
  }

  async getAudioFilePaths(dir: string): Promise<string[]> {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      dirents.map(async (dirent) => {
        const res = path.resolve(dir, dirent.name);
        if (dirent.isDirectory()) {
          return this.getAudioFilePaths(res);
        } else if (
          ['.mp3', '.flac', '.m4a'].includes(path.extname(res).toLowerCase())
        ) {
          return res;
        }
        return null;
      }),
    );
    return files.flat().filter((file): file is string => !!file);
  }

  async createPlaylist(name: string, description?: string) {
    return this.prisma.playlist.create({
      data: {
        name,
        description,
      },
    });
  }

  async addSongsToPlaylist(playlistId: number, songIds: number[]) {
    return this.prisma.playlist.update({
      where: { id: playlistId },
      data: {
        songs: {
          connect: songIds.map((id) => ({ id })),
        },
      },
    });
  }

  async findAllPlaylists() {
    return this.prisma.playlist.findMany({
      include: {
        songs: {
          take: 1,
          include: {
            album: true,
          },
        },
        _count: {
          select: { songs: true },
        },
      },
    });
  }

  async findPlaylistById(id: number) {
    return this.prisma.playlist.findUnique({
      where: { id },
      include: {
        songs: {
          include: {
            album: {
              include: {
                artists: true,
              },
            },
          },
        },
      },
    });
  }
}
