import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { IRealtimeMessageRepository } from '../domain/realtime-message.repository';
import { RealtimeMessage } from '../domain/realtime-message.entity';

@Injectable()
export class RealtimeMessageRepository implements IRealtimeMessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(message: RealtimeMessage): Promise<void> {
    console.log("~ ~ message:", message);
    await this.prisma.media.realtimeMessage.create({
      data: {
        room: message.room,
        content: (message as any).content,
        type: (message as any).type ?? 'text',
        senderId: (message as any).senderId ?? null,
      },
    });
  }

  async findRecentByRoom(room: string, limit = 20): Promise<RealtimeMessage[]> {
    const rows = await this.prisma.media.realtimeMessage.findMany({
      where: { room },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return rows.reverse() as unknown as RealtimeMessage[];
  }
}
