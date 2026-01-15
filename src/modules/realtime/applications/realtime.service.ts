import { Inject, Injectable } from '@nestjs/common';

import { RealtimeMessage } from '../domain/realtime-message.entity';
import type { IRealtimeMessageRepository } from '../domain/realtime-message.repository';
import { SendMessageDto } from '../dto/send-message.dto';
import { RealtimeMessageMapper } from '../mappers/realtime-message.mapper';

@Injectable()
export class RealtimeService {
  constructor(
    @Inject('RealtimeMessageRepository')
    private readonly repo: IRealtimeMessageRepository,
  ) {}

  async createMessage(dto: SendMessageDto) {
    const message = new RealtimeMessage(
      dto.room,
      dto.content,
      dto.type,
      dto.senderId,
    );

    await this.repo.save(message);

    return RealtimeMessageMapper.toBroadcastPayload(message);
  }

  async getRecentMessages(room: string, limit = 20) {
    const list = await this.repo.findRecentByRoom(room, limit);
    return list.map(RealtimeMessageMapper.toBroadcastPayload);
  }
}
