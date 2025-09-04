import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MusicLibraryModule } from './modules/music-library/music-library.module';
import { StreamingModule } from './modules/streaming/streaming.module';
import { PrismaService } from './prisma/prisma.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // 静态资源文件夹的物理路径
      serveRoot: '/static', // 访问静态资源的URL前缀
    }),
    MusicLibraryModule,
    StreamingModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
