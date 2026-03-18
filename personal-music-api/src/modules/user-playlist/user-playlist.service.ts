import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
    CreatePlaylistDto,
    UpdatePlaylistDto,
    AddSongsToPlaylistDto,
    ReorderSongsDto,
} from './dto/user-playlist.dto';

@Injectable()
export class UserPlaylistService {
    private readonly logger = new Logger(UserPlaylistService.name);

    constructor(private prisma: PrismaService) { }

    async getUserPlaylists(userId: number) {
        return this.prisma.userPlaylist.findMany({
            where: { userId },
            include: {
                _count: { select: { songs: true } },
                songs: {
                    take: 4,
                    orderBy: { position: 'asc' },
                    include: {
                        song: {
                            include: {
                                album: true,
                            },
                        },
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async getPlaylistById(playlistId: number, userId: number) {
        const playlist = await this.prisma.userPlaylist.findUnique({
            where: { id: playlistId },
            include: {
                user: {
                    select: { id: true, displayName: true, username: true },
                },
                songs: {
                    orderBy: { position: 'asc' },
                    include: {
                        song: {
                            include: {
                                album: {
                                    include: { artists: true },
                                },
                            },
                        },
                    },
                },
                _count: { select: { songs: true } },
            },
        });

        if (!playlist) {
            throw new NotFoundException('播放列表不存在');
        }

        if (!playlist.isPublic && playlist.userId !== userId) {
            throw new ForbiddenException('无权访问此播放列表');
        }

        return {
            ...playlist,
            songs: playlist.songs.map((ps) => ({
                ...ps.song,
                position: ps.position,
                addedAt: ps.addedAt,
            })),
        };
    }

    async createPlaylist(userId: number, dto: CreatePlaylistDto) {
        const playlist = await this.prisma.userPlaylist.create({
            data: {
                userId,
                name: dto.name,
                description: dto.description,
                isPublic: dto.isPublic ?? false,
            },
        });

        this.logger.log(`创建播放列表: userId=${userId}, name=${dto.name}`);
        return playlist;
    }

    async updatePlaylist(playlistId: number, userId: number, dto: UpdatePlaylistDto) {
        const playlist = await this.prisma.userPlaylist.findUnique({
            where: { id: playlistId },
        });

        if (!playlist) {
            throw new NotFoundException('播放列表不存在');
        }

        if (playlist.userId !== userId) {
            throw new ForbiddenException('无权修改此播放列表');
        }

        return this.prisma.userPlaylist.update({
            where: { id: playlistId },
            data: {
                name: dto.name,
                description: dto.description,
                isPublic: dto.isPublic,
            },
        });
    }

    async deletePlaylist(playlistId: number, userId: number) {
        const playlist = await this.prisma.userPlaylist.findUnique({
            where: { id: playlistId },
        });

        if (!playlist) {
            throw new NotFoundException('播放列表不存在');
        }

        if (playlist.userId !== userId) {
            throw new ForbiddenException('无权删除此播放列表');
        }

        await this.prisma.userPlaylist.delete({
            where: { id: playlistId },
        });

        this.logger.log(`删除播放列表: playlistId=${playlistId}`);
        return { message: '播放列表已删除' };
    }

    async addSongsToPlaylist(
        playlistId: number,
        userId: number,
        dto: AddSongsToPlaylistDto,
    ) {
        const playlist = await this.prisma.userPlaylist.findUnique({
            where: { id: playlistId },
        });

        if (!playlist) {
            throw new NotFoundException('播放列表不存在');
        }

        if (playlist.userId !== userId) {
            throw new ForbiddenException('无权修改此播放列表');
        }

        const maxPosition = await this.prisma.userPlaylistSong.aggregate({
            where: { playlistId },
            _max: { position: true },
        });

        let position = (maxPosition._max.position ?? 0) + 1;

        for (const songId of dto.songIds) {
            const existing = await this.prisma.userPlaylistSong.findUnique({
                where: { playlistId_songId: { playlistId, songId } },
            });

            if (!existing) {
                await this.prisma.userPlaylistSong.create({
                    data: {
                        playlistId,
                        songId,
                        position: position++,
                    },
                });
            }
        }

        await this.prisma.userPlaylist.update({
            where: { id: playlistId },
            data: { updatedAt: new Date() },
        });

        this.logger.log(`添加歌曲到播放列表: playlistId=${playlistId}, count=${dto.songIds.length}`);
        return { message: '歌曲已添加' };
    }

    async removeSongFromPlaylist(playlistId: number, songId: number, userId: number) {
        const playlist = await this.prisma.userPlaylist.findUnique({
            where: { id: playlistId },
        });

        if (!playlist) {
            throw new NotFoundException('播放列表不存在');
        }

        if (playlist.userId !== userId) {
            throw new ForbiddenException('无权修改此播放列表');
        }

        await this.prisma.userPlaylistSong.deleteMany({
            where: { playlistId, songId },
        });

        this.logger.log(`从播放列表移除歌曲: playlistId=${playlistId}, songId=${songId}`);
        return { message: '歌曲已移除' };
    }

    async reorderSongs(playlistId: number, userId: number, dto: ReorderSongsDto) {
        const playlist = await this.prisma.userPlaylist.findUnique({
            where: { id: playlistId },
        });

        if (!playlist) {
            throw new NotFoundException('播放列表不存在');
        }

        if (playlist.userId !== userId) {
            throw new ForbiddenException('无权修改此播放列表');
        }

        for (let i = 0; i < dto.songIds.length; i++) {
            await this.prisma.userPlaylistSong.updateMany({
                where: { playlistId, songId: dto.songIds[i] },
                data: { position: i + 1 },
            });
        }

        return { message: '排序已更新' };
    }

    async updateCover(playlistId: number, userId: number, coverPath: string) {
        const playlist = await this.prisma.userPlaylist.findUnique({
            where: { id: playlistId },
        });

        if (!playlist) {
            throw new NotFoundException('播放列表不存在');
        }

        if (playlist.userId !== userId) {
            throw new ForbiddenException('无权修改此播放列表');
        }

        const updated = await this.prisma.userPlaylist.update({
            where: { id: playlistId },
            data: { coverPath },
        });

        this.logger.log(`更新歌单封面: playlistId=${playlistId}`);
        return updated;
    }

    async deleteCover(playlistId: number, userId: number) {
        const playlist = await this.prisma.userPlaylist.findUnique({
            where: { id: playlistId },
        });

        if (!playlist) {
            throw new NotFoundException('播放列表不存在');
        }

        if (playlist.userId !== userId) {
            throw new ForbiddenException('无权修改此播放列表');
        }

        const updated = await this.prisma.userPlaylist.update({
            where: { id: playlistId },
            data: { coverPath: null },
        });

        this.logger.log(`删除歌单封面: playlistId=${playlistId}`);
        return updated;
    }
}

