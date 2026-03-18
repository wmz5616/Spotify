
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PlayHistoryService } from './src/modules/play-history/play-history.service';
import { PrismaService } from './src/prisma/prisma.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const service = app.get(PlayHistoryService);
    const prisma = app.get(PrismaService);

    console.log('Seeding mock history to ensure report generation...');
    const user = await prisma.user.findFirst();
    if (user) {

        const song = await prisma.song.findFirst();
        if (song) {

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(12, 0, 0, 0);

            await prisma.playHistory.create({
                data: {
                    userId: user.id,
                    songId: song.id,
                    duration: 300,
                    playedAt: yesterday,
                    completed: true
                }
            });
            console.log(`Created mock play history for user ${user.username} at ${yesterday}`);
        } else {
            console.log('No songs found in DB, skipping seed.');
        }
    }

    console.log('Manually triggering daily report...');
    try {
        await service.handleDailyReport();
        console.log('Daily report triggered successfully.');
    } catch (error) {
        console.error('Error triggering daily report:', error);
    } finally {
        await app.close();
    }
}

bootstrap();
