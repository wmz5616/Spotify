import { IsString, IsOptional, IsBoolean, IsArray, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlaylistDto {
    @ApiProperty({ example: '我的播放列表' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: '一些好听的歌' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isPublic?: boolean;
}

export class UpdatePlaylistDto {
    @ApiPropertyOptional({ example: '新的列表名称' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ example: '新的描述' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isPublic?: boolean;
}

export class AddSongsToPlaylistDto {
    @ApiProperty({ example: [1, 2, 3] })
    @IsArray()
    @IsNumber({}, { each: true })
    songIds: number[];
}

export class ReorderSongsDto {
    @ApiProperty({ example: [3, 1, 2] })
    @IsArray()
    @IsNumber({}, { each: true })
    songIds: number[];
}
