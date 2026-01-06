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
} from '@nestjs/common';
import { MusicLibraryService } from './music-library.service';
import type { Request, Response } from 'express';
import { createReadStream, statSync, existsSync } from 'fs';
import * as mime from 'mime-types';
import * as path from 'path';
import sharp from 'sharp';

@Controller('api')
export class MusicLibraryController {
  constructor(private readonly musicLibraryService: MusicLibraryService) {}

  @Post('library/scan')
  async scanLibrary(@Query('force') force: string) {
    const musicDirectory = 'D:\\Music';
    const forceUpdate = force === 'true';
    console.log(`Received scan request. Force update: ${forceUpdate}`);

    await this.musicLibraryService.scanAndSaveMusic(
      musicDirectory,
      forceUpdate,
    );

    return {
      message: forceUpdate
        ? 'Library scan completed with forced cover refresh.'
        : 'Incremental library scan completed.',
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
      console.warn(`Missing placeholder image at ${targetPath}`);
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
      console.error('Error processing image:', error);
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
      console.error(`File missing at path: ${songPath}`);
      throw new NotFoundException('Audio file not found on disk');
    }

    const mimeType = mime.lookup(songPath) || 'application/octet-stream';
    const { size } = statSync(songPath);
    const range = request.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : size - 1;
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
    } else {
      const head = {
        'Content-Length': size,
        'Content-Type': mimeType,
      };
      response.writeHead(200, head);
      createReadStream(songPath).pipe(response);
    }
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
