import { RealtimeMessage } from '../domain/realtime-message.entity';

export class RealtimeMessageMapper {
  static toBroadcastPayload(message: RealtimeMessage) {
    return {
      room: message.room,
      content: message.content,
      type: message.type,
      senderId: message.senderId ?? null,
    };
  }
}
