import { Module } from '@nestjs/common';
import { MusicLibraryService } from './music-library.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MusicLibraryController } from './music-library.controller'; // 1. 导入Controller

@Module({
  controllers: [MusicLibraryController], // 2. 在这里注册Controller
  providers: [MusicLibraryService, PrismaService],
})
export class MusicLibraryModule {}
