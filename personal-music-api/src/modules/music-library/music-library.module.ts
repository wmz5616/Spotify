import { Module } from '@nestjs/common';
import { MusicLibraryService } from './music-library.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MusicLibraryController } from './music-library.controller';

@Module({
  controllers: [MusicLibraryController],
  providers: [MusicLibraryService, PrismaService],
})
export class MusicLibraryModule {}
