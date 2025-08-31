import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { PrismaService } from 'src/prisma/prisma.service';
import * as mm from 'music-metadata';

// ... (Interface ParsedTags, constructor, sanitizeString, parseMetadata, scanAndSaveMusic, findAllArtists, findArtistById, findAllAlbums - all remain the same)
interface ParsedTags {
  artist?: string;
  album?: string;
  title?: string;
  trackNumber?: number;
  imageBuffer?: Buffer;
}

@Injectable()
export class MusicLibraryService {
  constructor(private prisma: PrismaService) {}

  private sanitizeString(str: string): string {
    if (!str) return '';
    return str.replace(/[^a-zA-Z0-9\s.,'()_-]/g, '').trim();
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

      const cleanArtist = this.sanitizeString(tags.artist);
      const cleanAlbum = this.sanitizeString(tags.album);
      const cleanTitle = this.sanitizeString(tags.title);

      if (!cleanArtist || !cleanAlbum || !cleanTitle) {
        console.warn(
          `Skipping file after sanitization (empty metadata): ${filePath}`,
        );
        continue;
      }

      const artist = await this.prisma.artist.upsert({
        where: { name: cleanArtist },
        update: {},
        create: { name: cleanArtist },
      });

      const album = await this.prisma.album.upsert({
        where: { title_artistId: { title: cleanAlbum, artistId: artist.id } },
        update: { cover: tags.imageBuffer },
        create: {
          title: cleanAlbum,
          artistId: artist.id,
          cover: tags.imageBuffer,
        },
      });

      await this.prisma.song.upsert({
        where: { path: filePath },
        update: {
          title: cleanTitle,
          trackNumber: tags.trackNumber,
          albumId: album.id,
        },
        create: {
          path: filePath,
          title: cleanTitle,
          trackNumber: tags.trackNumber,
          albumId: album.id,
        },
      });
    }
    console.log('Music library scan and save complete.');
  }

  async findAllArtists() {
    return this.prisma.artist.findMany({
      include: {
        _count: {
          select: { albums: true },
        },
      },
    });
  }

  async findArtistById(id: number) {
    return this.prisma.artist.findUnique({
      where: { id },
      include: {
        albums: {
          select: {
            id: true,
            title: true,
            _count: {
              select: { songs: true },
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
        artist: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // --- 修正这里的代码 ---
  async findAlbumById(id: number) {
    return this.prisma.album.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        artist: true, // 把 artist 加回来
        songs: {
          orderBy: {
            trackNumber: 'asc',
          },
        },
      },
    });
  }
  // --- 修正结束 ---

  async findSongById(id: number) {
    return this.prisma.song.findUnique({
      where: { id },
    });
  }

  async findAlbumArt(id: number) {
    return this.prisma.album.findUnique({
      where: { id },
      select: {
        cover: true,
      },
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
        } else {
          if (
            ['.mp3', '.flac', '.m4a'].includes(path.extname(res).toLowerCase())
          ) {
            return res;
          }
          return null;
        }
      }),
    );
    return files.flat().filter(Boolean) as string[];
  }
}
