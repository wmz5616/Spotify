import {
  Controller,
  Get,
  Param,
  Post,
  ParseIntPipe,
  Res,
  Req,
  NotFoundException,
} from '@nestjs/common'; // 1. 移除了未使用的 Header 和 StreamableFile
import { MusicLibraryService } from './music-library.service';
import type { Request, Response } from 'express'; // 2. 将 import 改为 import type
import { createReadStream, statSync } from 'fs';
// 3. 移除了未使用的 join

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
    if (!result || !result.cover) {
      throw new NotFoundException('Album art not found');
    }
    response.setHeader('Content-Type', 'image/jpeg');
    response.send(result.cover);
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
}
