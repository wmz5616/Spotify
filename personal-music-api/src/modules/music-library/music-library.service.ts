/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { PrismaService } from 'src/prisma/prisma.service';
import * as mm from 'music-metadata';
import { ensureDir, ensureSymlink, pathExists, remove, copy } from 'fs-extra';
import { Artist, Album } from '@prisma/client';
import Fuse from 'fuse.js';
import { Subject, Observable } from 'rxjs';

export interface ScanProgress {
  percentage: number;
  message: string;
  current?: number;
  total?: number;
}

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
  private readonly logger = new Logger(MusicLibraryService.name);
  private artistFuse: FuseSearchInstance<ArtistSearchItem> | null = null;
  private albumFuse: FuseSearchInstance<AlbumSearchItem> | null = null;
  private songFuse: FuseSearchInstance<SongSearchItem> | null = null;

  private progressSubject = new Subject<ScanProgress>();

  constructor(private prisma: PrismaService) {}

  getProgressStream(): Observable<ScanProgress> {
    return this.progressSubject.asObservable();
  }

  async getAlbumArtBuffer(id: number): Promise<Buffer | null> {
    const album = await this.prisma.album.findUnique({
      where: { id },
      select: { coverPath: true },
    });

    if (!album || !album.coverPath) {
      return null;
    }

    const projectRoot = process.cwd();
    const relativePath = album.coverPath.startsWith('/')
      ? album.coverPath.slice(1)
      : album.coverPath;
    const fullPath = path.join(projectRoot, 'public', relativePath);

    try {
      return await fs.readFile(fullPath);
    } catch {
      return null;
    }
  }

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
      this.logger.warn(
        `Skipping file with invalid path structure: ${filePath}`,
      );
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
        this.logger.error(
          `Error parsing metadata for ${filePath}: ${error.message}`,
        );
      } else {
        this.logger.error(
          `An unknown error occurred while parsing ${filePath}`,
          error,
        );
      }
      return {};
    }
  }

  private async findFolderCover(albumPath: string): Promise<string | null> {
    try {
      const files = await fs.readdir(albumPath);
      const targetNames = new Set([
        'cover.jpg',
        'cover.png',
        'cover.jpeg',
        'folder.jpg',
        'folder.png',
        'folder.jpeg',
      ]);

      for (const file of files) {
        if (targetNames.has(file.toLowerCase())) {
          return path.join(albumPath, file);
        }
      }
    } catch (e) {
      this.logger.warn(
        `Failed to read directory for cover search: ${albumPath}`,
      );
    }
    return null;
  }

  private async processArtistImage(
    artist: Artist,
    artistFolderPath: string,
    artistImagesDir: string,
  ): Promise<Artist> {
    const bioTextPath = path.join(artistFolderPath, 'bio.txt');
    const dataToUpdate: {
      avatarUrl?: string;
      headerUrl?: string;
      bio?: string;
      bioImageUrl?: string;
    } = {};

    let files: string[] = [];
    try {
      files = await fs.readdir(artistFolderPath);
    } catch {
      return artist;
    }

    const processImage = async (
      type: 'avatar' | 'header' | 'bio',
      candidates: string[],
    ): Promise<string | undefined> => {
      const foundFile = files.find((f) => candidates.includes(f.toLowerCase()));
      if (!foundFile) return undefined;

      const sourcePath = path.join(artistFolderPath, foundFile);
      const ext = path.extname(foundFile);
      const targetFileName = `${artist.id}-${type}${ext}`;
      const targetPath = path.join(artistImagesDir, targetFileName);

      try {
        if (await pathExists(targetPath)) {
          await remove(targetPath);
        }

        await ensureSymlink(sourcePath, targetPath);
        return `/artist-images/${targetFileName}`;
      } catch (e: any) {
        if (e.code === 'EPERM') {
          try {
            await copy(sourcePath, targetPath, { overwrite: true });
            this.logger.debug(
              `[Fallback] Copied artist image due to permissions: ${targetFileName}`,
            );
            return `/artist-images/${targetFileName}`;
          } catch (copyErr) {
            this.logger.error(
              `Failed to copy artist image fallback: ${copyErr}`,
            );
            return undefined;
          }
        }
        this.logger.error(`Failed to symlink artist image: ${e}`);
        return undefined;
      }
    };

    const newAvatarUrl = await processImage('avatar', [
      '头像.png',
      'avatar.jpg',
      'avatar.png',
    ]);
    if (newAvatarUrl) dataToUpdate.avatarUrl = newAvatarUrl;

    const newHeaderUrl = await processImage('header', [
      '封面图.png',
      'header.jpg',
      'banner.jpg',
    ]);
    if (newHeaderUrl) dataToUpdate.headerUrl = newHeaderUrl;

    const newBioImageUrl = await processImage('bio', ['bio.png', 'bio.jpg']);
    if (newBioImageUrl) dataToUpdate.bioImageUrl = newBioImageUrl;

    try {
      if (await pathExists(bioTextPath)) {
        const bioContent = await fs.readFile(bioTextPath, 'utf-8');
        if (bioContent) dataToUpdate.bio = bioContent;
      }
    } catch {
      /* ignore */
    }

    if (Object.keys(dataToUpdate).length > 0) {
      return this.prisma.artist.update({
        where: { id: artist.id },
        data: dataToUpdate,
      });
    }

    return artist;
  }

  async scanAndSaveMusic(directory: string, forceUpdate: boolean = false) {
    this.logger.log(
      `Starting music library scan... (Force Update: ${forceUpdate})`,
    );

    this.progressSubject.next({
      percentage: 0,
      message: 'Initializing scan...',
      current: 0,
      total: 0,
    });

    const coversDir = path.join(process.cwd(), 'public', 'covers');
    const artistImagesDir = path.join(process.cwd(), 'public', 'artist-images');

    await ensureDir(coversDir);
    await ensureDir(artistImagesDir);

    const artistCache = new Map<string, Artist>();
    const albumCache = new Map<string, Album & { coverAttempted?: boolean }>();

    try {
      const topLevelDirents = await fs.readdir(directory, {
        withFileTypes: true,
      });
      this.logger.log('Scanning artist directories...');

      for (const dirent of topLevelDirents) {
        if (dirent.isDirectory()) {
          const artistName = this.sanitizeString(dirent.name);
          if (!artistName) continue;

          let artist = await this.prisma.artist.upsert({
            where: { name: artistName },
            create: { name: artistName },
            update: {},
          });

          const artistFolderPath = path.join(directory, dirent.name);
          artist = await this.processArtistImage(
            artist,
            artistFolderPath,
            artistImagesDir,
          );

          artistCache.set(artistName, artist);
        }
      }
    } catch (e) {
      this.logger.error('Error scanning artist directories:', e);
    }

    this.progressSubject.next({
      percentage: 10,
      message: 'Discovering audio files...',
    });

    const filePaths = await this.getAudioFilePaths(directory);
    const totalFiles = filePaths.length;
    this.logger.log(`Found ${totalFiles} audio files. Processing...`);

    let processedCount = 0;

    for (const filePath of filePaths) {
      processedCount++;
      const percentage = Math.round((processedCount / totalFiles) * 80) + 10;

      if (processedCount % 5 === 0 || processedCount === totalFiles) {
        this.progressSubject.next({
          percentage,
          message: `Processing: ${path.basename(filePath)}`,
          current: processedCount,
          total: totalFiles,
        });
      }

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
        const artistFolderPath = path.dirname(path.dirname(filePath));
        artist = await this.processArtistImage(
          artist,
          artistFolderPath,
          artistImagesDir,
        );
        artistCache.set(artistName, artist);
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
            if (await pathExists(newCoverPath)) await remove(newCoverPath);
            await ensureSymlink(folderCoverPath, newCoverPath);
            const coverPathForDb = `/covers/${album.id}${fileExtension}`;
            const updatedAlbum = await this.prisma.album.update({
              where: { id: album.id },
              data: { coverPath: coverPathForDb },
            });
            album.coverPath = updatedAlbum.coverPath;
            coverSaved = true;
          } catch (e: any) {
            if (e.code === 'EPERM') {
              try {
                await copy(folderCoverPath, newCoverPath, { overwrite: true });
                const coverPathForDb = `/covers/${album.id}${fileExtension}`;
                const updatedAlbum = await this.prisma.album.update({
                  where: { id: album.id },
                  data: { coverPath: coverPathForDb },
                });
                album.coverPath = updatedAlbum.coverPath;
                coverSaved = true;
              } catch (copyErr) {
                this.logger.error(`Failed to copy cover fallback: ${copyErr}`);
              }
            } else {
              this.logger.error(
                `Failed to link folder cover for album ID ${album.id}:`,
                e,
              );
            }
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
          } catch (e) {
            this.logger.error(
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

    this.progressSubject.next({
      percentage: 95,
      message: 'Cleaning up deleted songs...',
    });

    const validPathsSet = new Set(filePaths);
    const allSongs = await this.prisma.song.findMany({
      select: { path: true },
    });
    const pathsToDelete = allSongs
      .map((s) => s.path)
      .filter((p) => !validPathsSet.has(p));

    if (pathsToDelete.length > 0) {
      await this.prisma.song.deleteMany({
        where: { path: { in: pathsToDelete } },
      });
    }

    this.artistFuse = null;
    this.albumFuse = null;
    this.songFuse = null;

    this.progressSubject.next({
      percentage: 100,
      message: 'Scan complete!',
      current: totalFiles,
      total: totalFiles,
    });

    this.logger.log(
      'Music library scan and save complete. Search index invalidated.',
    );
  }

  private async ensureSearchIndex() {
    if (this.artistFuse && this.albumFuse && this.songFuse) return;

    this.logger.debug('Building in-memory search index...');

    const [artists, albums, songs] = await Promise.all([
      this.prisma.artist.findMany({ select: { id: true, name: true } }),
      this.prisma.album.findMany({ select: { id: true, title: true } }),
      this.prisma.song.findMany({ select: { id: true, title: true } }),
    ]);

    const commonOptions = { includeScore: true, threshold: 0.4 };

    this.artistFuse = new Fuse(artists, {
      ...commonOptions,
      keys: ['name'],
    }) as unknown as FuseSearchInstance<ArtistSearchItem>;
    this.albumFuse = new Fuse(albums, {
      ...commonOptions,
      keys: ['title'],
    }) as unknown as FuseSearchInstance<AlbumSearchItem>;
    this.songFuse = new Fuse(songs, {
      ...commonOptions,
      keys: ['title'],
    }) as unknown as FuseSearchInstance<SongSearchItem>;

    this.logger.debug('Search index built successfully.');
  }

  async search(query: string) {
    if (!query || !query.trim()) {
      return { artists: [], albums: [], songs: [] };
    }

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
      .map((id) => artists.find((a: any) => a.id === id))
      .filter((a: any) => a !== undefined);
    const sortedAlbums = albumIds
      .map((id) => albums.find((a: any) => a.id === id))
      .filter((a: any) => a !== undefined);
    const sortedSongs = songIds
      .map((id) => songs.find((a: any) => a.id === id))
      .filter((a: any) => a !== undefined);

    return { artists: sortedArtists, albums: sortedAlbums, songs: sortedSongs };
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

  async getAudioFilePaths(
    dir: string,
    visited = new Set<string>(),
  ): Promise<string[]> {
    const realPath = await fs.realpath(dir);
    if (visited.has(realPath)) return [];
    visited.add(realPath);

    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      dirents.map(async (dirent) => {
        const res = path.resolve(dir, dirent.name);

        if (dirent.isSymbolicLink()) {
          return null;
        }

        if (dirent.isDirectory()) {
          return this.getAudioFilePaths(res, visited);
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
    return this.prisma.playlist.create({ data: { name, description } });
  }

  async addSongsToPlaylist(playlistId: number, songIds: number[]) {
    return this.prisma.playlist.update({
      where: { id: playlistId },
      data: { songs: { connect: songIds.map((id) => ({ id })) } },
    });
  }

  async findAllPlaylists() {
    return this.prisma.playlist.findMany({
      include: {
        songs: { take: 1, include: { album: true } },
        _count: { select: { songs: true } },
      },
    });
  }

  async findPlaylistById(id: number) {
    return this.prisma.playlist.findUnique({
      where: { id },
      include: {
        songs: { include: { album: { include: { artists: true } } } },
      },
    });
  }
}
