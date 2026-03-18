import {
    Injectable,
    NotFoundException,
    ConflictException,
    UnauthorizedException,
    Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProfileDto, UpdateSettingsDto, ChangePasswordDto } from './dto/user.dto';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(private prisma: PrismaService) { }

    async getProfile(userId: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatarPath: true,
                bio: true,
                createdAt: true,
                _count: {
                    select: {
                        favoriteSongs: true,
                        favoriteAlbums: true,
                        followedArtists: true,
                        playlists: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        return user;
    }

    async updateProfile(userId: number, dto: UpdateProfileDto) {
        if (dto.username) {
            const existingUser = await this.prisma.user.findFirst({
                where: {
                    username: dto.username,
                    NOT: { id: userId },
                },
            });
            if (existingUser) {
                throw new ConflictException('用户名已被使用');
            }
        }

        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                displayName: dto.displayName,
                username: dto.username,
                bio: dto.bio,
            },
            select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatarPath: true,
                bio: true,
            },
        });

        this.logger.log(`用户资料更新: ${user.email}`);
        return user;
    }

    async updateAvatar(userId: number, avatarPath: string) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { avatarPath },
            select: {
                id: true,
                avatarPath: true,
            },
        });

        this.logger.log(`用户头像更新: userId=${userId}`);
        return user;
    }

    async getSettings(userId: number) {
        let settings = await this.prisma.userSettings.findUnique({
            where: { userId },
        });

        if (!settings) {
            settings = await this.prisma.userSettings.create({
                data: { userId },
            });
        }

        return settings;
    }

    async updateSettings(userId: number, dto: UpdateSettingsDto) {
        const settings = await this.prisma.userSettings.upsert({
            where: { userId },
            update: {
                theme: dto.theme,
                audioQuality: dto.audioQuality,
                autoPlay: dto.autoPlay,
                notifications: dto.notifications,
            },
            create: {
                userId,
                theme: dto.theme || 'dark',
                audioQuality: dto.audioQuality || 'high',
                autoPlay: dto.autoPlay ?? true,
                notifications: dto.notifications ?? true,
            },
        });

        this.logger.log(`用户设置更新: userId=${userId}`);
        return settings;
    }

    async changePassword(userId: number, dto: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { passwordHash: true },
        });

        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!isValid) {
            throw new UnauthorizedException('当前密码错误');
        }

        const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash },
        });

        this.logger.log(`用户密码更新: userId=${userId}`);
        return { message: '密码修改成功' };
    }

    async deleteAccount(userId: number) {
        await this.prisma.user.delete({
            where: { id: userId },
        });

        this.logger.log(`用户账户删除: userId=${userId}`);
        return { message: '账户已删除' };
    }
}
