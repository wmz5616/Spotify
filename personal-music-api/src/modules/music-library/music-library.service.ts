/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { PrismaService } from 'src/prisma/prisma.service';
import * as mm from 'music-metadata';
import { ensureDir, ensureSymlink, pathExists, remove, copy } from 'fs-extra';
import { Artist, Album } from '@prisma/client';
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
  filePath: string;
  embeddedLyrics?: string;
}

@Injectable()
export class MusicLibraryService {
  private readonly logger = new Logger(MusicLibraryService.name);
  private progressSubject = new Subject<ScanProgress>();
  private artistIdCache = new Map<string, number>();
  private albumIdCache = new Map<string, number>();

  constructor(private prisma: PrismaService) {}

  getProgressStream(): Observable<ScanProgress> {
    return this.progressSubject.asObservable();
  }

  async scanAndSaveMusic(directory: string, forceUpdate: boolean = false) {
    this.logger.log(`Starting optimized scan... (Force: ${forceUpdate})`);
    const startTime = Date.now();

    this.progressSubject.next({ percentage: 0, message: 'Initializing...' });
    const coversDir = path.join(process.cwd(), 'public', 'covers');
    const artistImagesDir = path.join(process.cwd(), 'public', 'artist-images');
    await ensureDir(coversDir);
    await ensureDir(artistImagesDir);

    this.artistIdCache.clear();
    this.albumIdCache.clear();
    this.progressSubject.next({
      percentage: 5,
      message: 'Scanning artist directories...',
    });

    try {
      const dirents = await fs.readdir(directory, { withFileTypes: true });
      for (const dirent of dirents) {
        if (dirent.isDirectory()) {
          const artistName = this.sanitizeString(dirent.name);
          if (!artistName) continue;

          const artist = await this.prisma.artist.upsert({
            where: { name: artistName },
            create: { name: artistName },
            update: {},
          });

          const artistPath = path.join(directory, dirent.name);
          await this.processArtistImage(artist.id, artistPath, artistImagesDir);
          this.artistIdCache.set(artistName, artist.id);
        }
      }
    } catch (e) {
      this.logger.warn(`Error scanning top-level directories: ${e}`);
    }

    const filePaths = await this.getAudioFilePaths(directory);
    const totalFiles = filePaths.length;
    this.logger.log(
      `Found ${totalFiles} audio files. Starting batch processing...`,
    );

    const BATCH_SIZE = 50;
    let processedCount = 0;

    for (let i = 0; i < totalFiles; i += BATCH_SIZE) {
      const batchPaths = filePaths.slice(i, i + BATCH_SIZE);

      const parsedBatch = await Promise.all(
        batchPaths.map(async (filePath) => {
          try {
            return await this.extractMetadata(filePath, directory);
          } catch (e) {
            this.logger.warn(`Failed to parse ${filePath}: ${e}`);
            return null;
          }
        }),
      );

      for (const info of parsedBatch) {
        if (!info) continue;
        await this.saveTrackToDb(
          info,
          directory,
          coversDir,
          artistImagesDir,
          forceUpdate,
        );
        processedCount++;
      }

      const percentage = Math.round((processedCount / totalFiles) * 80) + 10;
      this.progressSubject.next({
        percentage,
        message: `Processing: ${processedCount}/${totalFiles}`,
        current: processedCount,
        total: totalFiles,
      });
    }

    this.progressSubject.next({
      percentage: 95,
      message: 'Cleaning up library...',
    });
    await this.cleanupOrphanedRecords(filePaths);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    this.logger.log(`Scan complete in ${duration}s.`);
    this.progressSubject.next({
      percentage: 100,
      message: 'Done!',
      current: totalFiles,
      total: totalFiles,
    });

    this.artistIdCache.clear();
    this.albumIdCache.clear();
  }

  private async extractMetadata(
    filePath: string,
    rootDir: string,
  ): Promise<ParsedInfo | null> {
    const relativePath = path.relative(rootDir, filePath);
    const parts = relativePath.split(path.sep);
    if (parts.length < 3) return null;

    const artistName = this.sanitizeString(parts[0]);
    const albumTitle = this.sanitizeString(parts[1]);
    if (!artistName || !albumTitle) return null;

    let title = path.basename(filePath, path.extname(filePath));
    title = title.replace(/^\d+\s*[-.]?\s*/, '');

    let trackNumber: number | undefined;
    let duration: number | undefined;
    let imageBuffer: Buffer | undefined;
    let embeddedLyrics: string | undefined;

    try {
      const metadata = await mm.parseFile(filePath, { skipCovers: false });
      trackNumber = metadata.common.track.no ?? undefined;
      duration = metadata.format.duration;
      title =
        this.sanitizeString(metadata.common.title) ||
        this.sanitizeString(title);

      if (metadata.common.picture && metadata.common.picture.length > 0) {
        imageBuffer = Buffer.from(metadata.common.picture[0].data);
      }

      if (metadata.common.lyrics && metadata.common.lyrics.length > 0) {
        const lyricEntry = metadata.common.lyrics[0];
        embeddedLyrics =
          typeof lyricEntry === 'string' ? lyricEntry : lyricEntry.text;
      }
    } catch {
      /* ignore */
    }

    return {
      artist: artistName,
      album: albumTitle,
      title,
      trackNumber,
      duration,
      imageBuffer,
      filePath,
      embeddedLyrics,
    };
  }

  private async saveTrackToDb(
    info: ParsedInfo,
    rootDir: string,
    coversDir: string,
    artistImagesDir: string,
    forceUpdate: boolean,
  ) {
    await this.prisma.$transaction(async (tx) => {
      let artistId = this.artistIdCache.get(info.artist);
      if (!artistId) {
        const artist = await tx.artist.upsert({
          where: { name: info.artist },
          create: { name: info.artist },
          update: {},
        });
        artistId = artist.id;
        this.artistIdCache.set(info.artist, artistId);

        const artistDir = path.dirname(path.dirname(info.filePath));
        this.processArtistImage(artistId, artistDir, artistImagesDir).catch(
          () => {},
        );
      }

      const albumUniqueId = `${info.album}___${info.artist}`;
      let albumId = this.albumIdCache.get(albumUniqueId);

      if (!albumId) {
        const album = await tx.album.upsert({
          where: { uniqueId: albumUniqueId },
          create: {
            title: info.album,
            uniqueId: albumUniqueId,
            artists: { connect: { id: artistId } },
          },
          update: {
            artists: { connect: { id: artistId } },
          },
        });
        albumId = album.id;
        this.albumIdCache.set(albumUniqueId, albumId);

        if (!album.coverPath || forceUpdate) {
          const albumDir = path.dirname(info.filePath);
          await this.processAlbumCover(
            album.id,
            albumDir,
            coversDir,
            info.imageBuffer,
            tx,
          );
        }
      }

      const lrcPath = info.filePath.replace(/\.[^/.]+$/, '.lrc');
      let finalLyrics: string | null = null;
      try {
        if (await pathExists(lrcPath)) {
          finalLyrics = await fs.readFile(lrcPath, 'utf-8');
        } else if (info.embeddedLyrics) {
          finalLyrics = info.embeddedLyrics;
        }
      } catch {
        /* ignore */
      }

      await tx.song.upsert({
        where: { path: info.filePath },
        update: {
          title: info.title,
          trackNumber: info.trackNumber,
          duration: info.duration,
          albumId: albumId,
          ...(finalLyrics ? { lyrics: finalLyrics } : {}),
        },
        create: {
          path: info.filePath,
          title: info.title,
          trackNumber: info.trackNumber,
          duration: info.duration,
          albumId: albumId!,
          lyrics: finalLyrics,
        },
      });
    });
  }

  private async processAlbumCover(
    albumId: number,
    albumDir: string,
    coversDir: string,
    buffer: Buffer | undefined,
    tx: any,
  ) {
    let coverPathForDb: string | null = null;

    const folderCover = await this.findFolderCover(albumDir);
    if (folderCover) {
      const ext = path.extname(folderCover);
      const targetName = `${albumId}${ext}`;
      const targetPath = path.join(coversDir, targetName);
      if (await this.safeLinkOrCopy(folderCover, targetPath)) {
        coverPathForDb = `/covers/${targetName}`;
      }
    }

    if (!coverPathForDb && buffer) {
      const targetName = `${albumId}.jpg`;
      const targetPath = path.join(coversDir, targetName);
      try {
        await fs.writeFile(targetPath, buffer);
        coverPathForDb = `/covers/${targetName}`;
      } catch (e) {
        this.logger.warn(`Failed to write embedded cover for album ${albumId}`);
      }
    }

    if (coverPathForDb) {
      await tx.album.update({
        where: { id: albumId },
        data: { coverPath: coverPathForDb },
      });
    }
  }

  private async safeLinkOrCopy(src: string, dest: string): Promise<boolean> {
    try {
      if (await pathExists(dest)) await remove(dest);
      await ensureSymlink(src, dest);
      return true;
    } catch (e: any) {
      try {
        await copy(src, dest, { overwrite: true });
        return true;
      } catch (copyErr) {
        return false;
      }
    }
  }

  private async findFolderCover(albumPath: string): Promise<string | null> {
    try {
      const files = await fs.readdir(albumPath);
      const candidates = ['cover.jpg', 'cover.png', 'folder.jpg', 'folder.png'];
      for (const f of files) {
        if (candidates.includes(f.toLowerCase()))
          return path.join(albumPath, f);
      }
    } catch {
      return null;
    }
    return null;
  }

  private async processArtistImage(
    artistId: number,
    artistDir: string,
    targetDir: string,
  ) {
    const candidates = ['avatar.jpg', 'avatar.png', 'artist.jpg'];
    let found: string | null = null;
    try {
      const files = await fs.readdir(artistDir);
      for (const f of files) {
        if (candidates.includes(f.toLowerCase())) {
          found = path.join(artistDir, f);
          break;
        }
      }
    } catch {
      return;
    }

    if (found) {
      const ext = path.extname(found);
      const target = path.join(targetDir, `${artistId}-avatar${ext}`);
      if (await this.safeLinkOrCopy(found, target)) {
        await this.prisma.artist
          .update({
            where: { id: artistId },
            data: { avatarUrl: `/artist-images/${artistId}-avatar${ext}` },
          })
          .catch(() => {});
      }
    }
  }

  private async cleanupOrphanedRecords(currentValidPaths: string[]) {
    const validPathsSet = new Set(currentValidPaths);
    const allSongs = await this.prisma.song.findMany({
      select: { id: true, path: true },
    });
    const songIdsToDelete = allSongs
      .filter((s) => !validPathsSet.has(s.path))
      .map((s) => s.id);

    if (songIdsToDelete.length > 0) {
      this.logger.log(`Deleting ${songIdsToDelete.length} orphaned songs...`);
      await this.prisma.song.deleteMany({
        where: { id: { in: songIdsToDelete } },
      });
    }

    const emptyAlbums = await this.prisma.album.findMany({
      where: { songs: { none: {} } },
      select: { id: true },
    });
    if (emptyAlbums.length > 0) {
      await this.prisma.album.deleteMany({
        where: { id: { in: emptyAlbums.map((a) => a.id) } },
      });
    }

    const emptyArtists = await this.prisma.artist.findMany({
      where: {
        albums: { none: {} },
        avatarUrl: null,
      },
      select: { id: true },
    });
    if (emptyArtists.length > 0) {
      await this.prisma.artist.deleteMany({
        where: { id: { in: emptyArtists.map((a) => a.id) } },
      });
    }
  }

  async search(query: string) {
    if (!query || !query.trim()) return { artists: [], albums: [], songs: [] };
    const q = query.trim();

    const [artists, albums, songs] = await Promise.all([
      this.prisma.artist.findMany({
        where: { name: { contains: q } },
        take: 5,
        include: { albums: { take: 1 } },
      }),
      this.prisma.album.findMany({
        where: { title: { contains: q } },
        take: 5,
        include: { artists: true },
      }),
      this.prisma.song.findMany({
        where: { title: { contains: q } },
        take: 10,
        select: {
          id: true,
          title: true,
          trackNumber: true,
          duration: true,
          albumId: true,
          lyrics: true,
          album: { include: { artists: true } },
        },
      }),
    ]);
    return { artists, albums, songs };
  }

  async getAlbumArtBuffer(id: number): Promise<Buffer | null> {
    const album = await this.prisma.album.findUnique({
      where: { id },
      select: { coverPath: true },
    });
    if (!album?.coverPath) return null;
    const fullPath = path.join(
      process.cwd(),
      'public',
      album.coverPath.startsWith('/')
        ? album.coverPath.slice(1)
        : album.coverPath,
    );
    try {
      return await fs.readFile(fullPath);
    } catch {
      return null;
    }
  }

  async getAudioFilePaths(dir: string): Promise<string[]> {
    const files: string[] = [];
    const stack: string[] = [path.resolve(dir)];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const currentPath = stack.pop()!;
      try {
        const realPath = await fs.realpath(currentPath);
        if (visited.has(realPath)) continue;
        visited.add(realPath);

        const dirents = await fs.readdir(realPath, { withFileTypes: true });
        for (const dirent of dirents) {
          const res = path.resolve(realPath, dirent.name);
          if (dirent.isDirectory()) stack.push(res);
          else if (
            ['.mp3', '.flac', '.m4a'].includes(path.extname(res).toLowerCase())
          )
            files.push(res);
        }
      } catch (e) {
        /* ignore */
      }
    }
    return files;
  }

  async findAllArtists() {
    return this.prisma.artist.findMany({ take: 50, orderBy: { name: 'asc' } });
  }

  async findArtistById(id: number) {
    return this.prisma.artist.findUnique({
      where: { id },
      include: {
        albums: {
          include: {
            songs: {
              orderBy: { trackNumber: 'asc' },
              select: { id: true, title: true, duration: true },
            },
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

  async findAlbumById(id: number) {
    return this.prisma.album.findUnique({
      where: { id },
      include: {
        artists: true,
        songs: {
          orderBy: { trackNumber: 'asc' },
          select: {
            id: true,
            title: true,
            duration: true,
            trackNumber: true,
            lyrics: true,
          },
        },
      },
    });
  }

  async findSongById(id: number) {
    return this.prisma.song.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        duration: true,
        lyrics: true,
        album: { include: { artists: true } },
      },
    });
  }

  async findSongPath(id: number) {
    const s = await this.prisma.song.findUnique({
      where: { id },
      select: { path: true },
    });
    return s?.path ?? null;
  }

  async findAlbumArt(id: number) {
    return this.prisma.album.findUnique({
      where: { id },
      select: { coverPath: true },
    });
  }

  async findRandomAlbums(take: number) {
    const count = await this.prisma.album.count();
    const skip = Math.max(0, Math.floor(Math.random() * count) - take);
    return this.prisma.album.findMany({
      take,
      skip,
      include: { artists: true },
    });
  }

  async findAllPlaylists() {
    return this.prisma.playlist.findMany({
      include: { _count: { select: { songs: true } } },
    });
  }
  async createPlaylist(name: string, description?: string) {
    return this.prisma.playlist.create({ data: { name, description } });
  }
  async findPlaylistById(id: number) {
    return this.prisma.playlist.findUnique({
      where: { id },
      include: { songs: { include: { album: true } } },
    });
  }
  async addSongsToPlaylist(playlistId: number, songIds: number[]) {
    return this.prisma.playlist.update({
      where: { id: playlistId },
      data: { songs: { connect: songIds.map((id) => ({ id })) } },
    });
  }

  private sanitizeString(str: string | undefined): string {
    // eslint-disable-next-line no-control-regex
    return str ? str.replace(/\u0000/g, '').trim() : '';
  }
}
