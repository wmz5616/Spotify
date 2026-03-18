import {
    Controller,
    Get,
    Post,
    Param,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('收藏')
@Controller('api/favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
    constructor(private readonly favoritesService: FavoritesService) { }

    @Get('ids')
    @ApiOperation({ summary: '获取所有收藏ID（用于前端状态初始化）' })
    @ApiResponse({ status: 200, description: '获取成功' })
    async getFavoriteIds(@CurrentUser() user: { id: number }) {
        return this.favoritesService.getFavoriteIds(user.id);
    }

    @Get('songs')
    @ApiOperation({ summary: '获取收藏的歌曲' })
    @ApiResponse({ status: 200, description: '获取成功' })
    async getFavoriteSongs(@CurrentUser() user: { id: number }) {
        return this.favoritesService.getFavoriteSongs(user.id);
    }

    @Post('songs/:id')
    @ApiOperation({ summary: '收藏/取消收藏歌曲' })
    @ApiResponse({ status: 200, description: '操作成功' })
    async toggleFavoriteSong(
        @CurrentUser() user: { id: number },
        @Param('id', ParseIntPipe) songId: number,
    ) {
        return this.favoritesService.toggleFavoriteSong(user.id, songId);
    }

    @Get('songs/:id/status')
    @ApiOperation({ summary: '检查歌曲是否已收藏' })
    async isSongFavorited(
        @CurrentUser() user: { id: number },
        @Param('id', ParseIntPipe) songId: number,
    ) {
        return this.favoritesService.isSongFavorited(user.id, songId);
    }

    @Get('albums')
    @ApiOperation({ summary: '获取收藏的专辑' })
    @ApiResponse({ status: 200, description: '获取成功' })
    async getFavoriteAlbums(@CurrentUser() user: { id: number }) {
        return this.favoritesService.getFavoriteAlbums(user.id);
    }

    @Post('albums/:id')
    @ApiOperation({ summary: '收藏/取消收藏专辑' })
    @ApiResponse({ status: 200, description: '操作成功' })
    async toggleFavoriteAlbum(
        @CurrentUser() user: { id: number },
        @Param('id', ParseIntPipe) albumId: number,
    ) {
        return this.favoritesService.toggleFavoriteAlbum(user.id, albumId);
    }

    @Get('artists')
    @ApiOperation({ summary: '获取关注的艺术家' })
    @ApiResponse({ status: 200, description: '获取成功' })
    async getFollowedArtists(@CurrentUser() user: { id: number }) {
        return this.favoritesService.getFollowedArtists(user.id);
    }

    @Post('artists/:id')
    @ApiOperation({ summary: '关注/取消关注艺术家' })
    @ApiResponse({ status: 200, description: '操作成功' })
    async toggleFollowArtist(
        @CurrentUser() user: { id: number },
        @Param('id', ParseIntPipe) artistId: number,
    ) {
        return this.favoritesService.toggleFollowArtist(user.id, artistId);
    }
}
