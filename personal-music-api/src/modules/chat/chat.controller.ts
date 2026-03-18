import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  getConversations(@Req() req) {
    return this.chatService.getConversations(req.user.id);
  }

  @Get('messages/:id')
  getMessages(@Param('id') id: string) {
    return this.chatService.getMessages(parseInt(id));
  }

  @Post('friend/request')
  sendFriendRequest(@Req() req, @Body('friendId') friendId: number) {
    return this.chatService.sendFriendRequest(req.user.id, friendId);
  }

  @Post('friend/accept')
  acceptFriendRequest(@Req() req, @Body('friendId') friendId: number) {
    return this.chatService.acceptFriendRequest(req.user.id, friendId);
  }

  @Get('friends')
  getFriends(@Req() req) {
    return this.chatService.getFriends(req.user.id);
  }

  @Get('search/:username')
  searchUser(@Param('username') username: string) {
    return this.chatService.searchUserByUsername(username);
  }

  @Post('read/:conversationId')
  markAsRead(@Param('conversationId') conversationId: string, @Req() req: any) {
    return this.chatService.markAsRead(parseInt(conversationId), req.user.id);
  }
}
