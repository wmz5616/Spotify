import {
  Controller,
  Get,
  Param,
  Post,
  ParseIntPipe,
  Res,
  Req,
  NotFoundException,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { MusicLibraryService } from './music-library.service';
import type { Request, Response } from 'express';
import { createReadStream, statSync, promises as fs } from 'fs';
import { join } from 'path';

@Controller('api')
export class MusicLibraryController {
  constructor(private readonly musicLibraryService: MusicLibraryService) {}

  @Post('library/scan')
  async scanLibrary() {
    const musicDirectory = 'D:\\音乐库\\已收录';
    await this.musicLibraryService.scanAndSaveMusic(musicDirectory);
    return { message: 'Library scan completed successfully.' };
  }

  @Get('artists')
  findAllArtists() {
    return this.musicLibraryService.findAllArtists();
  }

  @Get('artists/:id')
  findArtistById(@Param('id', ParseIntPipe) id: number) {
    return this.musicLibraryService.findArtistById(id);
  }

  @Get('albums')
  findAllAlbums() {
    return this.musicLibraryService.findAllAlbums();
  }

  @Get('albums/:id')
  findAlbumById(@Param('id', ParseIntPipe) id: number) {
    return this.musicLibraryService.findAlbumById(id);
  }

  @Get('songs/:id')
  findSongById(@Param('id', ParseIntPipe) id: number) {
    return this.musicLibraryService.findSongById(id);
  }

  @Get('album-art/:id')
  async getAlbumArt(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    const result = await this.musicLibraryService.findAlbumArt(id);
    const placeholderPath = join(process.cwd(), 'assets', 'placeholder.png');

    if (result && result.cover) {
      response.setHeader('Content-Type', 'image/jpeg');
      response.send(result.cover);
    } else {
      try {
        await fs.access(placeholderPath);
        response.setHeader('Content-Type', 'image/png');
        createReadStream(placeholderPath).pipe(response);
      } catch {
        throw new NotFoundException('Album art not found');
      }
    }
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
      throw new NotFoundException('Song not found');
    }

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
        'Content-Type': 'audio/mpeg',
      };
      response.writeHead(206, head);
      file.pipe(response);
    } else {
      const head = {
        'Content-Length': size,
        'Content-Type': 'audio/mpeg',
      };
      response.writeHead(200, head);
      createReadStream(songPath).pipe(response);
    }
  }

  @Get('artist-image/*')
  getArtistImage(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): StreamableFile {
    const imagePath = request.params[0];
    const musicDirectory = 'D:\\音乐库\\已收录';
    const fullPath = join(musicDirectory, imagePath);
    const placeholderPath = join(process.cwd(), 'assets', 'placeholder.png');

    try {
      statSync(fullPath);
      const file = createReadStream(fullPath);
      response.set({ 'Content-Type': 'image/png' });
      return new StreamableFile(file);
    } catch {
      const file = createReadStream(placeholderPath);
      response.set({ 'Content-Type': 'image/png' });
      return new StreamableFile(file);
    }
  }
}
