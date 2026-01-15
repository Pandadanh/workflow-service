import { Module, Logger } from '@nestjs/common';

import { RealtimeService } from './applications/realtime.service';

import { RealtimeGateway } from './infrastructure/realtime.gateway';
import { RealtimeMessageRepository } from './infrastructure/realtime-message.repository';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [
    Logger,
    RealtimeGateway,
    RealtimeService,
    PrismaService,
    {
      provide: 'RealtimeMessageRepository',
      useClass: RealtimeMessageRepository,
    },
  ],
})
export class RealtimeModule {}
