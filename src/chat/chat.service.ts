import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class ChatService {
  private userStreams: Map<number, Subject<any>> = new Map();
  private roomMessages: Map<string, any[]> = new Map();
  private roomUsers: Map<string, Set<number>> = new Map();

  private getChatKey(user1: string, user2: string): string {
    return [user1, user2].sort().join('_');
  }

  saveMessage(roomId: string, message: any) {
    if (!this.roomMessages.has(roomId)) {
      this.roomMessages.set(roomId, []);
    }
    this.roomMessages.get(roomId).push(message);
  }

  getMessages(roomId: string): any[] {
    return this.roomMessages.get(roomId) || [];
  }

  broadcastToRoom(roomId: string, message: any) {
    const users = this.roomUsers.get(roomId);
    if (!users) return;
    for (const uuid of users) {
      this.sendMessageToUser(uuid, message);
    }
  }

  addUserToRoom(roomId: string, uuid: number) {
    if (!this.roomUsers.has(roomId)) {
      this.roomUsers.set(roomId, new Set());
    }
    this.roomUsers.get(roomId).add(uuid);
  }

  getUserStream(uuid: number): Observable<any> {
    let subject = this.userStreams.get(uuid);
    if (!subject) {
      subject = new Subject();
      this.userStreams.set(uuid, subject);
    }
    return subject.asObservable();
  }

  sendMessageToUser(uuid: number, message: any, from?: string) {
    let subject = this.userStreams.get(uuid);
    if (!subject) {
      subject = new Subject();
      this.userStreams.set(uuid, subject);
    }
    subject.next({
      data: JSON.stringify(message),
    });

    // 메시지 저장
    if (from) {
      const key = this.getChatKey(uuid.toString(), from);
      if (!this.roomMessages.has(key)) {
        this.roomMessages.set(key, []);
      }
      const history = this.roomMessages.get(key);
      if (history) {
        history.push(message);
      }
    }
  }

  getChatHistory(userA: string, userB: string): any[] {
    const key = this.getChatKey(userA, userB);
    return this.roomMessages.get(key) || [];
  }
}
