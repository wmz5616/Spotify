import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Query,
    Param,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { PlayHistoryService } from './play-history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

class RecordPlayDto {
    @IsNumber()
    @Type(() => Number)
    songId: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    duration?: number;

    @IsOptional()
    @IsBoolean()
    completed?: boolean;
}

@ApiTags('播放历史')
@Controller('api/history')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlayHistoryController {
    constructor(private readonly playHistoryService: PlayHistoryService) { }

    @Get()
    @ApiOperation({ summary: '获取播放历史' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @ApiResponse({ status: 200, description: '获取成功' })
    async getHistory(
        @CurrentUser() user: { id: number },
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.playHistoryService.getHistory(
            user.id,
            limit ? parseInt(limit) : 50,
            offset ? parseInt(offset) : 0,
        );
    }

    @Get('recent')
    @ApiOperation({ summary: '获取最近播放（去重）' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: '获取成功' })
    async getRecentlyPlayed(
        @CurrentUser() user: { id: number },
        @Query('limit') limit?: string,
    ) {
        return this.playHistoryService.getRecentlyPlayed(
            user.id,
            limit ? parseInt(limit) : 20,
        );
    }

    @Post()
    @ApiOperation({ summary: '记录播放' })
    @ApiResponse({ status: 201, description: '记录成功' })
    async recordPlay(
        @CurrentUser() user: { id: number },
        @Body() dto: RecordPlayDto,
    ) {
        return this.playHistoryService.recordPlay(
            user.id,
            dto.songId,
            dto.duration,
            dto.completed,
        );
    }

    @Delete()
    @ApiOperation({ summary: '清空播放历史' })
    @ApiResponse({ status: 200, description: '清空成功' })
    async clearHistory(@CurrentUser() user: { id: number }) {
        return this.playHistoryService.clearHistory(user.id);
    }

    @Delete(':id')
    @ApiOperation({ summary: '删除单条播放记录' })
    @ApiResponse({ status: 200, description: '删除成功' })
    async deleteHistoryItem(
        @CurrentUser() user: { id: number },
        @Param('id', ParseIntPipe) historyId: number,
    ) {
        return this.playHistoryService.deleteHistoryItem(user.id, historyId);
    }

    @Post('daily-report')
    @ApiOperation({ summary: '手动触发每日报告 (测试用)' })
    async triggerDailyReport() {
        await this.playHistoryService.handleDailyReport();
        return { message: 'Daily report triggered' };
    }
}
