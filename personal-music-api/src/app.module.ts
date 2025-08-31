import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MusicLibraryModule } from './modules/music-library/music-library.module';
import { StreamingModule } from './modules/streaming/streaming.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [MusicLibraryModule, StreamingModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
