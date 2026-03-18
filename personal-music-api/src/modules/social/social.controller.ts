import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { SocialService } from './social.service';
import { CreateFeedPostDto } from './dto/social.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('社交')
@Controller('api/social')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SocialController {
    constructor(private readonly socialService: SocialService) { }

    @Post('follow/:userId')
    @ApiOperation({ summary: '关注用户' })
    async follow(
        @CurrentUser() user: { id: number },
        @Param('userId', ParseIntPipe) targetId: number,
    ) {
        return this.socialService.follow(user.id, targetId);
    }

    @Delete('follow/:userId')
    @ApiOperation({ summary: '取消关注' })
    async unfollow(
        @CurrentUser() user: { id: number },
        @Param('userId', ParseIntPipe) targetId: number,
    ) {
        return this.socialService.unfollow(user.id, targetId);
    }

    @Get('following/:userId')
    @Public()
    @ApiOperation({ summary: '获取关注列表' })
    async getFollowing(@Param('userId', ParseIntPipe) userId: number) {
        return this.socialService.getFollowing(userId);
    }

    @Get('followers/:userId')
    @Public()
    @ApiOperation({ summary: '获取粉丝列表' })
    async getFollowers(@Param('userId', ParseIntPipe) userId: number) {
        return this.socialService.getFollowers(userId);
    }

    @Post('feed')
    @ApiOperation({ summary: '发布动态' })
    async createFeedPost(
        @CurrentUser() user: { id: number },
        @Body() dto: CreateFeedPostDto,
    ) {
        return this.socialService.createFeedPost(user.id, dto);
    }

    @Get('feed/:userId')
    @Public()
    @ApiOperation({ summary: '获取用户动态' })
    async getUserFeed(
        @Param('userId', ParseIntPipe) userId: number,
        @CurrentUser() user?: { id: number }
    ) {
        return this.socialService.getUserFeed(userId, user?.id);
    }

    @Get('feed')
    @Public()
    @ApiOperation({ summary: '获取全局动态' })
    async getGlobalFeed(@CurrentUser() user?: { id: number }) {
        return this.socialService.getGlobalFeed(user?.id);
    }
    @Post('feed/image')
    @ApiOperation({ summary: '上传动态图片' })
    @UseInterceptors(FileInterceptor('image', {
        storage: diskStorage({
            destination: './public/feed',
            filename: (req: any, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, `${req.user?.id || 'post'}_${uniqueSuffix}${extname(file.originalname)}`);
            },
        }),
        limits: { fileSize: 50 * 1024 * 1024 },
    }))
    async uploadFeedImage(@UploadedFile() file: any) {
        if (!file) throw new BadRequestException('未上传文件');
        return { url: `/public/feed/${file.filename}` };
    }

    @Post('feed/:postId/like')
    @ApiOperation({ summary: '点赞动态' })
    async likePost(
        @CurrentUser() user: { id: number },
        @Param('postId', ParseIntPipe) postId: number,
    ) {
        return this.socialService.likePost(user.id, postId);
    }

    @Delete('feed/:postId/like')
    @ApiOperation({ summary: '取消点赞动态' })
    async unlikePost(
        @CurrentUser() user: { id: number },
        @Param('postId', ParseIntPipe) postId: number,
    ) {
        return this.socialService.unlikePost(user.id, postId);
    }

    @Post('feed/:postId/comment')
    @ApiOperation({ summary: '评论动态' })
    async commentPost(
        @CurrentUser() user: { id: number },
        @Param('postId', ParseIntPipe) postId: number,
        @Body('content') content: string,
    ) {
        return this.socialService.commentPost(user.id, postId, content);
    }

    @Get('feed/:postId/comments')
    @Public()
    @ApiOperation({ summary: '获取动态评论' })
    async getComments(@Param('postId', ParseIntPipe) postId: number) {
        return this.socialService.getComments(postId);
    }

    @Put('feed/:postId')
    @ApiOperation({ summary: '更新动态' })
    async updatePost(
        @CurrentUser() user: { id: number },
        @Param('postId', ParseIntPipe) postId: number,
        @Body('content') content: string,
    ) {
        return this.socialService.updateFeedPost(user.id, postId, content);
    }

    @Delete('feed/:postId')
    @ApiOperation({ summary: '删除动态' })
    async deletePost(
        @CurrentUser() user: { id: number },
        @Param('postId', ParseIntPipe) postId: number,
    ) {
        return this.socialService.deleteFeedPost(user.id, postId);
    }
}
