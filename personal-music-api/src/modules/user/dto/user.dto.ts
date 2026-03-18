import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
    @ApiPropertyOptional({ example: 'John Doe' })
    @IsOptional()
    @IsString()
    displayName?: string;

    @ApiPropertyOptional({ example: 'johndoe' })
    @IsOptional()
    @IsString()
    username?: string;

    @ApiPropertyOptional({ example: 'Music lover and audiophile' })
    @IsOptional()
    @IsString()
    bio?: string;

    @ApiPropertyOptional({ example: '/backgrounds/default.jpg' })
    @IsOptional()
    @IsString()
    backgroundPath?: string;

    @ApiPropertyOptional({ example: 'China' })
    @IsOptional()
    @IsString()
    ipLocation?: string;

    @ApiPropertyOptional({ example: '50% 50%' })
    @IsOptional()
    @IsString()
    avatarPosition?: string;

    @ApiPropertyOptional({ example: '50% 50%' })
    @IsOptional()
    @IsString()
    backgroundPosition?: string;
}

export class UpdateSettingsDto {
    @ApiPropertyOptional({ enum: ['dark', 'light', 'system', 'black', 'modern'] })
    @IsOptional()
    @IsEnum(['dark', 'light', 'system', 'black', 'modern'])
    theme?: string;

    @ApiPropertyOptional({ enum: ['low', 'normal', 'high', 'veryhigh', 'lossless'] })
    @IsOptional()
    @IsEnum(['low', 'normal', 'high', 'veryhigh', 'lossless'])
    audioQuality?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    autoPlay?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    notifications?: boolean;
}

export class ChangePasswordDto {
    @IsString()
    currentPassword: string;

    @IsString()
    newPassword: string;
}
