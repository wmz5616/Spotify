import { Controller, Get, Post, Put, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Get()
    findAll(@Request() req) {
        return this.notificationService.findAll(req.user.userId);
    }

    @Put(':id/read')
    markAsRead(@Param('id') id: string, @Request() req) {
        return this.notificationService.markAsRead(id, req.user.userId);
    }

    @Put('read-all')
    markAllAsRead(@Request() req) {
        return this.notificationService.markAllAsRead(req.user.userId);
    }
}
