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
}

export class UpdateSettingsDto {
    @ApiPropertyOptional({ enum: ['dark', 'light', 'system'] })
    @IsOptional()
    @IsEnum(['dark', 'light', 'system'])
    theme?: string;

    @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'lossless'] })
    @IsOptional()
    @IsEnum(['low', 'medium', 'high', 'lossless'])
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
