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
  UseGuards,
  UsePipes,
  ValidationPipe,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  BadRequestException,
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
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import {
  CreatePlaylistDto,
  AddSongsDto,
  SearchQueryDto,
  GetCoverQueryDto,
} from './dto/music-library.dto';

@Controller('api')
export class MusicLibraryController {
  private readonly logger = new Logger(MusicLibraryController.name);
  private isScanning = false;

  constructor(private readonly musicLibraryService: MusicLibraryService) {}

  @UseGuards(ApiKeyGuard)
  @Sse('library/scan/progress')
  scanProgress(): Observable<MessageEvent> {
    return this.musicLibraryService.getProgressStream().pipe(
      map((progress) => ({
        data: progress,
      })),
    );
  }

  @UseGuards(ApiKeyGuard)
  @Post('library/scan')
  async scanLibrary(@Query('force') force: string) {
    // 解决问题 18：检查是否正在扫描
    if (this.isScanning) {
      throw new HttpException('扫描正在进行中，请稍后', HttpStatus.CONFLICT);
    }

    const musicDirectory = process.env.MUSIC_DIRECTORY;
    if (!musicDirectory) {
      throw new HttpException(
        '服务器未配置 MUSIC_DIRECTORY 环境变量',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const forceUpdate = force === 'true';
    this.logger.log(`Received scan request. Force update: ${forceUpdate}`);

    this.isScanning = true;
    this.musicLibraryService
      .scanAndSaveMusic(musicDirectory, forceUpdate)
      .finally(() => {
        this.isScanning = false;
      });

    return {
      message:
        'Scan started in background. Please connect to /api/library/scan/progress for updates.',
    };
  }

  @Get('covers/:id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getAlbumCover(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: GetCoverQueryDto,
    @Res() response: Response,
  ) {
    let width: number | undefined;
    if (query.size) {
      width = parseInt(query.size);
      if (isNaN(width) || width > 2048) {
        width = 2048;
      } else if (width <= 0) {
        width = undefined;
      }
    }

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

      if (width) {
        pipeline.resize(width, width, { fit: 'cover' });
      }

      pipeline
        .jpeg({ quality: 80, mozjpeg: true })
        .on('error', (err) => {
          this.logger.error('Sharp processing error', err);
          response.end();
        })
        .pipe(response);
    } catch (error) {
      this.logger.error('Error processing image:', error);
      createReadStream(targetPath).pipe(response);
    }
  }

  @UseGuards(ApiKeyGuard)
  @Get('albums/random')
  findRandomAlbums(
    @Query('take', new ParseIntPipe({ optional: true })) take: number = 6,
  ) {
    return this.musicLibraryService.findRandomAlbums(take);
  }

  @UseGuards(ApiKeyGuard)
  @Get('artists')
  findAllArtists() {
    return this.musicLibraryService.findAllArtists();
  }

  @UseGuards(ApiKeyGuard)
  @Get('artists/:id')
  async findArtistById(@Param('id', ParseIntPipe) id: number) {
    const artist = await this.musicLibraryService.findArtistById(id);
    if (!artist) {
      throw new NotFoundException(`Artist with ID ${id} not found`);
    }
    return artist;
  }

  @UseGuards(ApiKeyGuard)
  @Get('albums')
  findAllAlbums() {
    return this.musicLibraryService.findAllAlbums();
  }

  @UseGuards(ApiKeyGuard)
  @Get('albums/:id')
  async findAlbumById(@Param('id', ParseIntPipe) id: number) {
    const album = await this.musicLibraryService.findAlbumById(id);
    if (!album) {
      throw new NotFoundException(`Album with ID ${id} not found`);
    }
    return album;
  }

  @UseGuards(ApiKeyGuard)
  @Get('songs/:id')
  async findSongById(@Param('id', ParseIntPipe) id: number) {
    const song = await this.musicLibraryService.findSongById(id);
    if (!song) {
      throw new NotFoundException(`Song with ID ${id} not found`);
    }
    return song;
  }

  @UseGuards(ApiKeyGuard)
  @Get('search')
  @UsePipes(new ValidationPipe({ transform: true }))
  search(@Query() query: SearchQueryDto) {
    return this.musicLibraryService.search(query.q || '');
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

    const handleStreamError = (stream: any) => {
      stream.on('error', (err: any) => {
        if (err.code !== 'ECONNRESET') {
          this.logger.error(`Stream error for file ${songPath}:`, err);
        }
        if (!response.headersSent) {
          response.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }
      });
    };

    if (rangeHeader) {
      const ranges = rangeParser(size, rangeHeader, { combine: true });

      if (ranges === -1 || ranges === -2) {
        throw new HttpException(
          'Range Not Satisfiable',
          HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
        );
      }

      if (Array.isArray(ranges) && ranges.length > 0) {
        const { start, end } = ranges[0];
        const chunksize = end - start + 1;

        response.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': mimeType,
        });

        const file = createReadStream(songPath, { start, end });
        handleStreamError(file);
        file.pipe(response);
        return;
      }
    }

    response.writeHead(200, {
      'Content-Length': size,
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
    });

    const file = createReadStream(songPath);
    handleStreamError(file);
    file.pipe(response);
  }

  @UseGuards(ApiKeyGuard)
  @Get('playlists')
  findAllPlaylists() {
    return this.musicLibraryService.findAllPlaylists();
  }

  @UseGuards(ApiKeyGuard)
  @Get('playlists/:id')
  async findPlaylistById(@Param('id', ParseIntPipe) id: number) {
    const playlist = await this.musicLibraryService.findPlaylistById(id);
    if (!playlist) {
      throw new NotFoundException(`Playlist with ID ${id} not found`);
    }
    return playlist;
  }

  @UseGuards(ApiKeyGuard)
  @Post('playlists')
  @UsePipes(new ValidationPipe())
  createPlaylist(@Body() createPlaylistDto: CreatePlaylistDto) {
    return this.musicLibraryService.createPlaylist(
      createPlaylistDto.name,
      createPlaylistDto.description,
    );
  }

  @UseGuards(ApiKeyGuard)
  @Post('playlists/:id/songs')
  @UsePipes(new ValidationPipe())
  addSongsToPlaylist(
    @Param('id', ParseIntPipe) id: number,
    @Body() addSongsDto: AddSongsDto,
  ) {
    return this.musicLibraryService.addSongsToPlaylist(id, addSongsDto.songIds);
  }
}
