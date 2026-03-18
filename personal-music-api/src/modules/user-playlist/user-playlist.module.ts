import { Module } from '@nestjs/common';
import { UserPlaylistService } from './user-playlist.service';
import { UserPlaylistController } from './user-playlist.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [UserPlaylistController],
    providers: [UserPlaylistService],
    exports: [UserPlaylistService],
})
export class UserPlaylistModule { }
