import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  ParseIntPipe,
  Res,
  Req,
  NotFoundException,
  Query,
  HttpException,
  HttpStatus,
  Logger,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { MusicLibraryService } from './music-library.service';
import type { Request, Response } from 'express';
import { createReadStream, statSync, existsSync } from 'fs';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as mime from 'mime-types';
import * as path from 'path';
import sharp from 'sharp';
import rangeParser from 'range-parser';

@Controller('api')
export class MusicLibraryController {
  private readonly logger = new Logger(MusicLibraryController.name);

  constructor(private readonly musicLibraryService: MusicLibraryService) {}

  @Sse('library/scan/progress')
  scanProgress(): Observable<MessageEvent> {
    return this.musicLibraryService.getProgressStream().pipe(
      map((progress) => ({
        data: progress,
      })),
    );
  }

  @Post('library/scan')
  async scanLibrary(@Query('force') force: string) {
    const musicDirectory = process.env.MUSIC_DIRECTORY || 'D:\\Music';
    const forceUpdate = force === 'true';
    this.logger.log(`Received scan request. Force update: ${forceUpdate}`);
    this.musicLibraryService.scanAndSaveMusic(musicDirectory, forceUpdate);

    return {
      message:
        'Scan started in background. Please connect to /api/library/scan/progress for updates.',
    };
  }

  @Get('covers/:id')
  async getAlbumCover(
    @Param('id', ParseIntPipe) id: number,
    @Query('size') size: string | undefined,
    @Res() response: Response,
  ) {
    const projectRoot = process.cwd();
    const placeholderPath = path.join(projectRoot, 'public', 'placeholder.jpg');
    let targetPath = placeholderPath;
    let isPlaceholder = true;
    const album = await this.musicLibraryService.findAlbumArt(id);
    if (album && album.coverPath) {
      const relativePath = album.coverPath.startsWith('/')
        ? album.coverPath.slice(1)
        : album.coverPath;
      const fullPath = path.join(projectRoot, 'public', relativePath);

      if (existsSync(fullPath)) {
        targetPath = fullPath;
        isPlaceholder = false;
      }
    }

    if (!existsSync(targetPath)) {
      this.logger.warn(`Missing placeholder image at ${targetPath}`);
      throw new NotFoundException('Cover image not found');
    }

    response.setHeader('Content-Type', 'image/jpeg');
    const cacheAge = isPlaceholder ? 3600 : 31536000;
    response.setHeader('Cache-Control', `public, max-age=${cacheAge}`);

    try {
      const pipeline = sharp(targetPath);

      if (size) {
        const width = parseInt(size);
        if (!isNaN(width) && width > 0) {
          pipeline.resize(width, width, { fit: 'cover' });
        }
      }

      pipeline.jpeg({ quality: 80, mozjpeg: true }).pipe(response);
    } catch (error) {
      this.logger.error('Error processing image:', error);
      createReadStream(targetPath).pipe(response);
    }
  }

  @Get('albums/random')
  findRandomAlbums(
    @Query('take', new ParseIntPipe({ optional: true })) take: number = 6,
  ) {
    return this.musicLibraryService.findRandomAlbums(take);
  }

  @Get('artists')
  findAllArtists() {
    return this.musicLibraryService.findAllArtists();
  }

  @Get('artists/:id')
  async findArtistById(@Param('id', ParseIntPipe) id: number) {
    const artist = await this.musicLibraryService.findArtistById(id);
    if (!artist) {
      throw new NotFoundException(`Artist with ID ${id} not found`);
    }
    return artist;
  }

  @Get('albums')
  findAllAlbums() {
    return this.musicLibraryService.findAllAlbums();
  }

  @Get('albums/:id')
  async findAlbumById(@Param('id', ParseIntPipe) id: number) {
    const album = await this.musicLibraryService.findAlbumById(id);
    if (!album) {
      throw new NotFoundException(`Album with ID ${id} not found`);
    }
    return album;
  }

  @Get('songs/:id')
  async findSongById(@Param('id', ParseIntPipe) id: number) {
    const song = await this.musicLibraryService.findSongById(id);
    if (!song) {
      throw new NotFoundException(`Song with ID ${id} not found`);
    }
    return song;
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.musicLibraryService.search(query || '');
  }

  @Get('stream/:id')
  async getAudioStream(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const songPath = await this.musicLibraryService.findSongPath(id);

    if (!songPath) {
      throw new NotFoundException('Song not found in database');
    }

    if (!existsSync(songPath)) {
      this.logger.error(`File missing at path: ${songPath}`);
      throw new NotFoundException('Audio file not found on disk');
    }

    const mimeType = mime.lookup(songPath) || 'application/octet-stream';
    const { size } = statSync(songPath);
    const rangeHeader = request.headers.range;

    if (rangeHeader) {
      const ranges = rangeParser(size, rangeHeader);

      if (ranges === -1) {
        throw new HttpException(
          'Range Not Satisfiable',
          HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
        );
      }

      if (Array.isArray(ranges) && ranges.length > 0) {
        const { start, end } = ranges[0];
        const chunksize = end - start + 1;
        const file = createReadStream(songPath, { start, end });

        const head = {
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': mimeType,
        };

        response.writeHead(206, head);
        file.pipe(response);
        return;
      }
    }

    const head = {
      'Content-Length': size,
      'Content-Type': mimeType,
    };
    response.writeHead(200, head);
    createReadStream(songPath).pipe(response);
  }

  @Get('playlists')
  findAllPlaylists() {
    return this.musicLibraryService.findAllPlaylists();
  }

  @Get('playlists/:id')
  async findPlaylistById(@Param('id', ParseIntPipe) id: number) {
    const playlist = await this.musicLibraryService.findPlaylistById(id);
    if (!playlist) {
      throw new NotFoundException(`Playlist with ID ${id} not found`);
    }
    return playlist;
  }

  @Post('playlists')
  createPlaylist(
    @Body() createPlaylistDto: { name: string; description?: string },
  ) {
    return this.musicLibraryService.createPlaylist(
      createPlaylistDto.name,
      createPlaylistDto.description,
    );
  }

  @Post('playlists/:id/songs')
  addSongsToPlaylist(
    @Param('id', ParseIntPipe) id: number,
    @Body() addSongsDto: { songIds: number[] },
  ) {
    return this.musicLibraryService.addSongsToPlaylist(id, addSongsDto.songIds);
  }
}
