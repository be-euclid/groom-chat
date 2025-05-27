import { Controller, Sse, Param, Post, Body, Get, Query } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Sse('sse/:userId')
  sse(@Param('userId') userId: string, @Query('roomId') roomId?: string): Observable<any> {
    if (roomId) {
      this.chatService.addUserToRoom(roomId, userId);
    }
    return this.chatService.getUserStream(userId);
  }
  // 1:1 대화 내역 조회
  @Get('history')
  getHistory(@Query('userA') userA: string, @Query('userB') userB: string) {
    // 예: /chat/history?userA=user1&userB=user2
    return this.chatService.getChatHistory(userA, userB);
  }

  // 메시지 전송시 from 정보도 함께 전달
  @Post('send')
  sendMessage(
    @Body() body: { roomId: string; username: string; message: string; timestamp: string; image?: string; from?: string }
  ) {
    const msg = {
      event: 'new_message',
      data: {
        username: body.username,
        message: body.message,
        timestamp: body.timestamp,
        ...(body.image && { image: body.image }),
      },
    };
    this.chatService.saveMessage(body.roomId, msg);
    this.chatService.broadcastToRoom(body.roomId, msg);
    return { status: 'ok' };
  }

  @Get('messages')
  getMessages(@Query('roomId') roomId: string) {
    return this.chatService.getMessages(roomId);
  }

  // 유저 입장 알림
  @Post('join')
  userJoined(
    @Body() body: { to: string; username: string; message: string; timestamp: string }
  ) {
    this.chatService.sendMessageToUser(body.to, {
      event: 'user_joined',
      data: {
        username: body.username,
        message: body.message,
        timestamp: body.timestamp,
      },
    });
    return { status: 'ok' };
  }

  // 유저 퇴장 알림
  @Post('leave')
  userLeft(
    @Body() body: { to: string; username: string; message: string; timestamp: string }
  ) {
    this.chatService.sendMessageToUser(body.to, {
      event: 'user_left',
      data: {
        username: body.username,
        message: body.message,
        timestamp: body.timestamp,
      },
    });
    return { status: 'ok' };
  }
}
