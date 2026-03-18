import { IsString, IsOptional, IsInt, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeedPostDto {
    @ApiPropertyOptional({ example: '今天心情不错，分享一首歌' })
    @IsOptional()
    @IsString()
    content?: string;

    @ApiProperty({ enum: ['text', 'song', 'playlist', 'album'], default: 'text' })
    @IsEnum(['text', 'song', 'playlist', 'album'])
    type: string;

    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @IsInt()
    targetId?: number;

    @ApiPropertyOptional({ example: ['/public/feed/1.jpg'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];
}
