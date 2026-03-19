import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() conversationId: number, @ConnectedSocket() client: Socket) {
    const roomId = `conversation_${conversationId}`;
    client.join(roomId);
    console.log(`Client ${client.id} joined room ${roomId}`);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@MessageBody() conversationId: number, @ConnectedSocket() client: Socket) {
    const roomId = `conversation_${conversationId}`;
    client.leave(roomId);
    console.log(`Client ${client.id} left room ${roomId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { 
      recipientId: number; 
      content: string; 
      senderId: number;
      type?: string;
      imagePath?: string;
      songId?: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.chatService.sendMessage(
      data.senderId, 
      data.recipientId, 
      data.content,
      data.type || "text",
      data.imagePath,
      data.songId
    );
    
    const roomId = `conversation_${message.conversationId}`;
    
    // Emit the message to the room (both sender and recipient if joined)
    this.server.to(roomId).emit('newMessage', message);
    
    // Also emit a private notification to the recipient (for sound/badges)
    this.server.emit(`user_notification_${data.recipientId}`, {
      type: 'message',
      message: message,
    });

    return message;
  }

  @SubscribeMessage('heartbeat')
  async handleHeartbeat(@MessageBody() userId: number) {
    await this.chatService.updateLastActive(userId);
  }
}
