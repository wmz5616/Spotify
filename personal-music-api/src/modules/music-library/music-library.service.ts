import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { PrismaService } from 'src/prisma/prisma.service';
import * as mm from 'music-metadata';
import { ensureDir } from 'fs-extra';

interface ParsedInfo {
  artist: string;
  album: string;
  title: string;
  trackNumber?: number;
  imageBuffer?: Buffer;
  duration?: number;
}

@Injectable()
export class MusicLibraryService {
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

  async scanAndSaveMusic(directory: string) {
    console.log('Starting music library scan...');
    const filePaths = await this.getAudioFilePaths(directory);
    console.log(`Found ${filePaths.length} audio files.`);

    const coversDir = path.join(process.cwd(), 'public', 'covers');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await ensureDir(coversDir);

    for (const filePath of filePaths) {
      const pathInfo = this.parseInfoFromPath(filePath, directory);
      if (!pathInfo) continue;

      const supplementaryInfo = await this.getSupplementaryMetadata(filePath);
      const tags = { ...pathInfo, ...supplementaryInfo };

      const artistName = this.sanitizeString(tags.artist);
      if (!artistName) continue;

      let artist = await this.prisma.artist.upsert({
        where: { name: artistName },
        create: { name: artistName },
        update: {},
      });

      const artistFolderPath = path.dirname(path.dirname(filePath));
      const avatarPath = path.join(artistFolderPath, '头像.png');
      const headerPath = path.join(artistFolderPath, '封面图.png');
      const dataToUpdate: { avatarUrl?: string; headerUrl?: string } = {};

      try {
        await fs.access(avatarPath);
        dataToUpdate.avatarUrl = path
          .relative(directory, avatarPath)
          .replace(/\\/g, '/');
      } catch {
        /* ignore */
      }
      try {
        await fs.access(headerPath);
        dataToUpdate.headerUrl = path
          .relative(directory, headerPath)
          .replace(/\\/g, '/');
      } catch {
        /* ignore */
      }

      if (Object.keys(dataToUpdate).length > 0) {
        artist = await this.prisma.artist.update({
          where: { id: artist.id },
          data: dataToUpdate,
        });
      }

      const cleanAlbum = this.sanitizeString(tags.album);
      const cleanTitle = this.sanitizeString(tags.title);
      if (!cleanAlbum || !cleanTitle) continue;

      const albumUniqueId = `${cleanAlbum}___${artist.name}`;

      const album = await this.prisma.album.upsert({
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

      // 健壮的封面处理逻辑
      if (!album.coverPath && tags.imageBuffer) {
        const finalCoverBuffer = tags.imageBuffer;
        const newCoverPath = path.join(coversDir, `${album.id}.jpg`);
        try {
          await fs.writeFile(newCoverPath, finalCoverBuffer);
          const coverPathForDb = `/covers/${album.id}.jpg`;
          await this.prisma.album.update({
            where: { id: album.id },
            data: { coverPath: coverPathForDb },
          });
        } catch (e) {
          console.error(`Failed to write cover for album ID ${album.id}:`, e);
        }
      }

      await this.prisma.song.upsert({
        where: { path: filePath },
        update: {
          title: cleanTitle,
          trackNumber: tags.trackNumber,
          albumId: album.id,
          duration: tags.duration,
        },
        create: {
          path: filePath,
          title: cleanTitle,
          trackNumber: tags.trackNumber,
          albumId: album.id,
          duration: tags.duration,
        },
      });
    }
    console.log('Music library scan and save complete.');
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
        albums: {
          select: {
            id: true,
            title: true,
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
        artists: { select: { id: true, name: true } },
        songs: { orderBy: { trackNumber: 'asc' } },
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

  async search(query: string) {
    const artists = await this.prisma.artist.findMany({
      where: { name: { contains: query } },
      include: { albums: { take: 1 } },
      take: 5,
    });
    const albums = await this.prisma.album.findMany({
      where: { title: { contains: query } },
      include: { artists: true, _count: { select: { songs: true } } },
      take: 5,
    });
    const songs = await this.prisma.song.findMany({
      where: { title: { contains: query } },
      include: { album: { include: { artists: true } } },
      take: 10,
    });
    return { artists, albums, songs };
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
