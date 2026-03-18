import {
    Controller,
    Get,
    Patch,
    Post,
    Delete,
    Body,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Res,
    Param,
    ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiConsumes,
} from '@nestjs/swagger';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { UserService } from './user.service';
import { UpdateProfileDto, UpdateSettingsDto, ChangePasswordDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('用户')
@Controller('api/user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get('profile')
    @ApiOperation({ summary: '获取当前用户资料' })
    @ApiResponse({ status: 200, description: '获取成功' })
    async getProfile(@CurrentUser() user: { id: number }) {
        return this.userService.getProfile(user.id);
    }

    @Get('profile/:userId')
    @Public()
    @ApiOperation({ summary: '获取指定用户资料' })
    @ApiResponse({ status: 200, description: '获取成功' })
    async getPublicProfile(@Param('userId', ParseIntPipe) userId: number) {
        return this.userService.getProfile(userId);
    }

    @Patch('profile')
    @ApiOperation({ summary: '更新用户资料' })
    @ApiResponse({ status: 200, description: '更新成功' })
    async updateProfile(
        @CurrentUser() user: { id: number },
        @Body() dto: UpdateProfileDto,
    ) {
        return this.userService.updateProfile(user.id, dto);
    }

    @Post('avatar')
    @ApiOperation({ summary: '上传头像' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('avatar', { limits: { fileSize: 50 * 1024 * 1024 } }))
    async uploadAvatar(
        @CurrentUser() user: { id: number },
        @UploadedFile() file: { originalname: string; buffer: Buffer },
    ) {
        const uploadDir = path.join(process.cwd(), 'public', 'avatars');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileName = `${user.id}_${Date.now()}${path.extname(file.originalname)}`;
        const filePath = path.join(uploadDir, fileName);

        fs.writeFileSync(filePath, file.buffer);

        const avatarPath = `/avatars/${fileName}`;
        return this.userService.updateAvatar(user.id, avatarPath);
    }

    @Post('background')
    @ApiOperation({ summary: '上传背景图' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('background', { limits: { fileSize: 50 * 1024 * 1024 } }))
    async uploadBackground(
        @CurrentUser() user: { id: number },
        @UploadedFile() file: { originalname: string; buffer: Buffer },
    ) {
        const uploadDir = path.join(process.cwd(), 'public', 'backgrounds');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileName = `${user.id}_${Date.now()}${path.extname(file.originalname)}`;
        const filePath = path.join(uploadDir, fileName);

        fs.writeFileSync(filePath, file.buffer);

        const backgroundPath = `/backgrounds/${fileName}`;
        return this.userService.updateProfile(user.id, { backgroundPath });
    }

    @Get('avatar/:userId')
    @ApiOperation({ summary: '获取用户头像' })
    async getAvatar(
        @Param('userId', ParseIntPipe) userId: number,
        @Res() res: Response,
    ) {
        const profile = await this.userService.getProfile(userId);

        if (!profile.avatarPath) {
            return res.status(404).json({ message: '头像不存在' });
        }

        const avatarFullPath = path.join(process.cwd(), 'public', profile.avatarPath);

        if (!fs.existsSync(avatarFullPath)) {
            return res.status(404).json({ message: '头像文件不存在' });
        }

        return res.sendFile(avatarFullPath);
    }

    @Get('settings')
    @ApiOperation({ summary: '获取用户设置' })
    @ApiResponse({ status: 200, description: '获取成功' })
    async getSettings(@CurrentUser() user: { id: number }) {
        return this.userService.getSettings(user.id);
    }

    @Patch('settings')
    @ApiOperation({ summary: '更新用户设置' })
    @ApiResponse({ status: 200, description: '更新成功' })
    async updateSettings(
        @CurrentUser() user: { id: number },
        @Body() dto: UpdateSettingsDto,
    ) {
        return this.userService.updateSettings(user.id, dto);
    }

    @Patch('password')
    @ApiOperation({ summary: '修改密码' })
    @ApiResponse({ status: 200, description: '修改成功' })
    @ApiResponse({ status: 401, description: '当前密码错误' })
    async changePassword(
        @CurrentUser() user: { id: number },
        @Body() dto: ChangePasswordDto,
    ) {
        return this.userService.changePassword(user.id, dto);
    }

    @Delete('account')
    @ApiOperation({ summary: '删除账户' })
    @ApiResponse({ status: 200, description: '删除成功' })
    async deleteAccount(@CurrentUser() user: { id: number }) {
        return this.userService.deleteAccount(user.id);
    }
}
