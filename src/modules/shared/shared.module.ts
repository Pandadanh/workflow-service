import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';

// Shared Services
import { QueueService } from './services/queue.service';

// Email Service (moved from queue-consumer to avoid circular dependency)
import { EmailService } from '../queue-consumer/application/email.service';

// Core modules
import { PrismaModule } from '../../prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { ReservationModule } from '../reservation/reservation.module';
import { RealtimeService } from '../realtime/applications/realtime.service';
import { RealtimeMessageRepository } from '../realtime/infrastructure/realtime-message.repository';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    PrismaModule,
    NotificationModule,
    ReservationModule,
  ],
  providers: [
    QueueService,
    EmailService,
    RealtimeService,
    {
      provide: 'RealtimeMessageRepository',
      useClass: RealtimeMessageRepository,
    }
  ],
  exports: [
    QueueService,
    EmailService,
    RealtimeService,
  ],
})
export class SharedModule {}
