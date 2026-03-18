import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLibraryPlaylistDto {
  @ApiProperty({
    description: '播放列表名称',
    example: '我的收藏',
  })
  @IsString({ message: '歌单名称必须是字符串' })
  @IsNotEmpty({ message: '歌单名称不能为空' })
  name: string;

  @ApiPropertyOptional({
    description: '播放列表描述',
    example: '收藏的喜欢的歌曲',
  })
  @IsString({ message: '描述必须是字符串' })
  @IsOptional()
  description?: string;
}

export class AddSongsDto {
  @ApiProperty({
    description: '要添加的歌曲 ID 列表',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray({ message: 'songIds 必须是数组' })
  @IsInt({ each: true, message: '歌曲 ID 必须是整数' })
  @Min(1, { each: true, message: '无效的歌曲 ID' })
  @IsNotEmpty({ message: '歌曲列表不能为空' })
  songIds: number[];
}

export class SearchQueryDto {
  @ApiPropertyOptional({
    description: '搜索关键词',
    example: '周杰伦',
  })
  @IsString()
  @IsOptional()
  q?: string;
}

export class GetCoverQueryDto {
  @ApiPropertyOptional({
    description: '封面尺寸 (例如: 128, 300, 600)',
    example: '300',
  })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({
    description: '缓存旁路参数 (用于突破浏览器缓存)',
    example: 'Title',
  })
  @IsOptional()
  @IsString()
  t?: string;

  @ApiPropertyOptional({
    description: 'API Key (可选，通过 URL 参数认证)',
  })
  @IsOptional()
  @IsString()
  key?: string;
}
