import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { PrismaService } from 'src/prisma/prisma.service';
import * as mm from 'music-metadata';
import { Artist } from '@prisma/client';

interface ParsedTags {
  artist?: string;
  album?: string;
  title?: string;
  trackNumber?: number;
  imageBuffer?: Buffer;
  duration?: number;
}

@Injectable()
export class MusicLibraryService {
  constructor(private prisma: PrismaService) {}

  private sanitizeString(str: string): string {
    if (!str) return '';
    // eslint-disable-next-line no-control-regex
    return str.replace(/\u0000/g, '').trim();
  }

  async parseMetadata(filePath: string): Promise<ParsedTags | null> {
    try {
      const metadata = await mm.parseFile(filePath);
      const track = metadata.common.track.no;
      const picture = metadata.common.picture?.[0];

      return {
        artist: metadata.common.artist,
        album: metadata.common.album,
        title: metadata.common.title,
        trackNumber: track && !isNaN(track) ? track : undefined,
        imageBuffer: picture ? Buffer.from(picture.data) : undefined,
        duration: metadata.format.duration,
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
      return null;
    }
  }

  async scanAndSaveMusic(directory: string) {
    console.log('Starting music library scan...');
    const filePaths = await this.getAudioFilePaths(directory);
    console.log(`Found ${filePaths.length} audio files.`);

    for (const filePath of filePaths) {
      const tags = await this.parseMetadata(filePath);
      if (!tags || !tags.artist || !tags.album || !tags.title) {
        console.warn(`Skipping file with incomplete metadata: ${filePath}`);
        continue;
      }

      const artistNames = tags.artist
        .split(/[,;&/／]| feat\. /)
        .map((name) => this.sanitizeString(name))
        .filter(Boolean);
      if (artistNames.length === 0) {
        console.warn(`Skipping file with no valid artist names: ${filePath}`);
        continue;
      }

      const artistEntities: Artist[] = [];
      for (const name of artistNames) {
        let artist = await this.prisma.artist.upsert({
          where: { name },
          create: { name },
          update: {},
        });

        if (!artist.avatarUrl || !artist.headerUrl) {
          const artistFolderPath = path.dirname(filePath);
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
        }
        artistEntities.push(artist);
      }

      const cleanAlbum = this.sanitizeString(tags.album);
      const cleanTitle = this.sanitizeString(tags.title);

      if (!cleanAlbum || !cleanTitle) continue;

      const sortedArtistNames = artistEntities
        .map((a) => a.name)
        .sort()
        .join(', ');
      const albumUniqueId = `${cleanAlbum}___${sortedArtistNames}`;

      const album = await this.prisma.album.upsert({
        where: { uniqueId: albumUniqueId },
        create: {
          title: cleanAlbum,
          uniqueId: albumUniqueId,
          cover: tags.imageBuffer,
          artists: { connect: artistEntities.map((a) => ({ id: a.id })) },
        },
        update: {
          ...(tags.imageBuffer && { cover: tags.imageBuffer }),
        },
      });

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
      include: {
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
      select: { cover: true },
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
}
