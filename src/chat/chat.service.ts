import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class ChatService {
  private userStreams: Map<string, Subject<any>> = new Map();

  // 쌍의 메시지 저장 
  private roomMessages: Map<string, any[]> = new Map();

  // roomId별로 참여자 목록을 관리해야 합니다.
  private roomUsers: Map<string, Set<string>> = new Map();

  // 두 유저의 대화방 key
  private getChatKey(user1: string, user2: string): string {
    return [user1, user2].sort().join('_');
  }
  // 메시지 저장
  saveMessage(roomId: string, message: any) {
    if (!this.roomMessages.has(roomId)) {
      this.roomMessages.set(roomId, []);
    }
    this.roomMessages.get(roomId).push(message);
  }

  // 메시지 조회
  getMessages(roomId: string): any[] {
    return this.roomMessages.get(roomId) || [];
  }

  // 메시지 push
  broadcastToRoom(roomId: string, message: any) {
    const users = this.roomUsers.get(roomId);
    if (!users) return;
    for (const userId of users) {
      this.sendMessageToUser(userId, message);
    }
  }

  addUserToRoom(roomId: string, userId: string) {
    if (!this.roomUsers.has(roomId)) {
      this.roomUsers.set(roomId, new Set());
    }
    this.roomUsers.get(roomId).add(userId);
  }

  getUserStream(userId: string): Observable<any> {
    let subject = this.userStreams.get(userId);
    if (!subject) {
      subject = new Subject();
      this.userStreams.set(userId, subject);
    }
    return subject.asObservable();
  }

  sendMessageToUser(userId: string, message: any, from?: string) {
    let subject = this.userStreams.get(userId);
    if (!subject) {
      subject = new Subject();
      this.userStreams.set(userId, subject);
    }
    subject.next({
      data: JSON.stringify(message),
    });

    // 메시지 저장
    if (from) {
      const key = this.getChatKey(userId, from);
      if (!this.roomMessages.has(key)) {
        this.roomMessages.set(key, []);
      }
      const history = this.roomMessages.get(key);
      if (history) {
        history.push(message);
      }
    }
  }

  // 대화 내역 조회
  getChatHistory(userA: string, userB: string): any[] {
    const key = this.getChatKey(userA, userB);
    return this.roomMessages.get(key) || [];
  }
}
