import { RealtimeMessage } from './realtime-message.entity';

export interface IRealtimeMessageRepository {
  save(message: RealtimeMessage): Promise<void>;
  findRecentByRoom(room: string, limit?: number): Promise<RealtimeMessage[]>;
}
