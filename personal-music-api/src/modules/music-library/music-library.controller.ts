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
import { createReadStream, statSync } from 'fs';

@Controller('api')
export class MusicLibraryController {
  constructor(private readonly musicLibraryService: MusicLibraryService) {}

  @Post('library/scan')
  async scanLibrary() {
    const musicDirectory = 'D:\\音乐库\\已收录';
    await this.musicLibraryService.scanAndSaveMusic(musicDirectory);
    return { message: 'Library scan completed successfully.' };
  }

  // 我们已经删除了 getAlbumArt 和 getArtistImage 方法
  // 因为 ServeStaticModule 会自动处理它们

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

  @Get('playlists')
  findAllPlaylists() {
    return this.musicLibraryService.findAllPlaylists();
  }

  @Get('playlists/:id')
  findPlaylistById(@Param('id', ParseIntPipe) id: number) {
    return this.musicLibraryService.findPlaylistById(id);
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
