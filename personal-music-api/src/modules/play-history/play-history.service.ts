import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class PlayHistoryService {
    private readonly logger = new Logger(PlayHistoryService.name);

    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService
    ) { }

    @Cron('0 14 * * *')
    async handleDailyReport() {
        this.logger.log('Running daily listening report...');

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const endOfYesterday = new Date(yesterday);
        endOfYesterday.setHours(23, 59, 59, 999);

        const users = await this.prisma.user.findMany({ select: { id: true, username: true } });

        for (const user of users) {
            const history = await this.prisma.playHistory.findMany({
                where: {
                    userId: user.id,
                    playedAt: {
                        gte: yesterday,
                        lte: endOfYesterday
                    }
                },
                select: { duration: true }
            });

            const totalSeconds = history.reduce((acc, curr) => acc + (curr.duration || 0), 0);

            if (totalSeconds > 0) {
                const minutes = Math.floor(totalSeconds / 60);
                const message = `昨天你一共听了 ${minutes} 分钟的音乐，继续保持！`;

                await this.notificationService.create(
                    user.id,
                    '昨日听歌报告',
                    message,
                    'success'
                );
                this.logger.log(`Sent daily report to user ${user.id}: ${minutes} mins`);
            }
        }
    }

    async recordPlay(
        userId: number,
        songId: number,
        duration?: number,
        completed?: boolean,
    ) {
        const record = await this.prisma.$transaction(async (tx) => {
            await tx.playHistory.deleteMany({
                where: { userId, songId },
            });

            return tx.playHistory.create({
                data: {
                    userId,
                    songId,
                    duration,
                    completed: completed ?? false,
                },
            });
        });

        this.logger.log(`记录播放: userId=${userId}, songId=${songId}`);

        const count = await this.prisma.playHistory.count({ where: { userId } });
        if (count > 200) {
            const toDelete = await this.prisma.playHistory.findMany({
                where: { userId },
                orderBy: { playedAt: 'asc' },
                take: count - 200,
                select: { id: true },
            });

            await this.prisma.playHistory.deleteMany({
                where: { id: { in: toDelete.map(r => r.id) } },
            });

            this.logger.log(`清理旧播放记录: userId=${userId}, deleted=${toDelete.length}`);
        }

        return record;
    }

    async getHistory(userId: number, limit: number = 50, offset: number = 0) {
        const [history, total] = await Promise.all([
            this.prisma.playHistory.findMany({
                where: { userId },
                include: {
                    song: {
                        include: {
                            album: {
                                include: {
                                    artists: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { playedAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.playHistory.count({ where: { userId } }),
        ]);

        return {
            items: history.map((h) => ({
                ...h.song,
                playedAt: h.playedAt,
                playDuration: h.duration,
                completed: h.completed,
            })),
            total,
            limit,
            offset,
        };
    }

    async getRecentlyPlayed(userId: number, limit: number = 20) {
        const history = await this.prisma.playHistory.findMany({
            where: { userId },
            include: {
                song: {
                    include: {
                        album: {
                            include: {
                                artists: true,
                            },
                        },
                    },
                },
            },
            orderBy: { playedAt: 'desc' },
            take: limit,
        });

        return history.map((h) => ({
            ...h.song,
            playedAt: h.playedAt,
        }));
    }

    async clearHistory(userId: number) {
        await this.prisma.playHistory.deleteMany({
            where: { userId },
        });

        this.logger.log(`清空播放历史: userId=${userId}`);
        return { message: '播放历史已清空' };
    }

    async deleteHistoryItem(userId: number, historyId: number) {
        await this.prisma.playHistory.deleteMany({
            where: { id: historyId, userId },
        });

        return { message: '已删除' };
    }
}
