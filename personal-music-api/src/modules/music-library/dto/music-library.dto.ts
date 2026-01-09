import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';

export class CreatePlaylistDto {
  @IsString({ message: '歌单名称必须是字符串' })
  @IsNotEmpty({ message: '歌单名称不能为空' })
  name: string;

  @IsString({ message: '描述必须是字符串' })
  @IsOptional()
  description?: string;
}

export class AddSongsDto {
  @IsArray({ message: 'songIds 必须是数组' })
  @IsInt({ each: true, message: '歌曲 ID 必须是整数' })
  @Min(1, { each: true, message: '无效的歌曲 ID' })
  @IsNotEmpty({ message: '歌曲列表不能为空' })
  songIds: number[];
}

export class SearchQueryDto {
  @IsString()
  @IsOptional()
  q?: string;
}

export class GetCoverQueryDto {
  @IsOptional()
  @IsString()
  size?: string;
}
