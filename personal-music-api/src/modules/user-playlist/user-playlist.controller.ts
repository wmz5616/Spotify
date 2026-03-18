import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    UseGuards,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserPlaylistService } from './user-playlist.service';
import {
    CreatePlaylistDto,
    UpdatePlaylistDto,
    AddSongsToPlaylistDto,
    ReorderSongsDto,
} from './dto/user-playlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('用户播放列表')
@Controller('api/user-playlists')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserPlaylistController {
    constructor(private readonly userPlaylistService: UserPlaylistService) { }

    @Get()
    @ApiOperation({ summary: '获取用户的播放列表' })
    @ApiResponse({ status: 200, description: '获取成功' })
    async getUserPlaylists(@CurrentUser() user: { id: number }) {
        return this.userPlaylistService.getUserPlaylists(user.id);
    }

    @Get(':id')
    @ApiOperation({ summary: '获取播放列表详情' })
    @ApiResponse({ status: 200, description: '获取成功' })
    async getPlaylistById(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: { id: number },
    ) {
        return this.userPlaylistService.getPlaylistById(id, user.id);
    }

    @Post()
    @ApiOperation({ summary: '创建播放列表' })
    @ApiResponse({ status: 201, description: '创建成功' })
    async createPlaylist(
        @CurrentUser() user: { id: number },
        @Body() dto: CreatePlaylistDto,
    ) {
        return this.userPlaylistService.createPlaylist(user.id, dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: '更新播放列表' })
    @ApiResponse({ status: 200, description: '更新成功' })
    async updatePlaylist(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: { id: number },
        @Body() dto: UpdatePlaylistDto,
    ) {
        return this.userPlaylistService.updatePlaylist(id, user.id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: '删除播放列表' })
    @ApiResponse({ status: 200, description: '删除成功' })
    async deletePlaylist(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: { id: number },
    ) {
        return this.userPlaylistService.deletePlaylist(id, user.id);
    }

    @Post(':id/songs')
    @ApiOperation({ summary: '添加歌曲到播放列表' })
    @ApiResponse({ status: 200, description: '添加成功' })
    async addSongsToPlaylist(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: { id: number },
        @Body() dto: AddSongsToPlaylistDto,
    ) {
        return this.userPlaylistService.addSongsToPlaylist(id, user.id, dto);
    }

    @Delete(':id/songs/:songId')
    @ApiOperation({ summary: '从播放列表移除歌曲' })
    @ApiResponse({ status: 200, description: '移除成功' })
    async removeSongFromPlaylist(
        @Param('id', ParseIntPipe) id: number,
        @Param('songId', ParseIntPipe) songId: number,
        @CurrentUser() user: { id: number },
    ) {
        return this.userPlaylistService.removeSongFromPlaylist(id, songId, user.id);
    }

    @Patch(':id/reorder')
    @ApiOperation({ summary: '重新排序歌曲' })
    @ApiResponse({ status: 200, description: '排序成功' })
    async reorderSongs(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: { id: number },
        @Body() dto: ReorderSongsDto,
    ) {
        return this.userPlaylistService.reorderSongs(id, user.id, dto);
    }

    @Post(':id/cover')
    @ApiOperation({ summary: '上传歌单封面' })
    @ApiConsumes('multipart/form-data')
    @ApiResponse({ status: 200, description: '上传成功' })
    @UseInterceptors(FileInterceptor('cover'))
    async uploadCover(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: { id: number },
        @UploadedFile() file: { originalname: string; buffer: Buffer },
    ) {
        const uploadDir = path.join(process.cwd(), 'public', 'playlist-covers');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileName = `${id}_${Date.now()}${path.extname(file.originalname)}`;
        const filePath = path.join(uploadDir, fileName);

        fs.writeFileSync(filePath, file.buffer);

        const coverPath = `/playlist-covers/${fileName}`;
        return this.userPlaylistService.updateCover(id, user.id, coverPath);
    }

    @Delete(':id/cover')
    @ApiOperation({ summary: '删除歌单封面' })
    @ApiResponse({ status: 200, description: '删除成功' })
    async deleteCover(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: { id: number },
    ) {
        return this.userPlaylistService.deleteCover(id, user.id);
    }
}

