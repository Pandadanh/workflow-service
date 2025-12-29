import { Module } from '@nestjs/common';
import { NotificationService } from './application/notification.service';
import { NotificationHelperService } from './application/notification-helper.service';
import { PrismaNotificationRepository } from './infrastructure/prisma-notification.repository';
import { NotificationRepository } from './domain/notification.repository';
import { PrismaService } from '../../prisma.service';

@Module({
  providers: [
    NotificationService,
    NotificationHelperService,
    {
      provide: NotificationRepository,
      useClass: PrismaNotificationRepository,
    },
    PrismaService,
  ],
  exports: [NotificationService, NotificationHelperService],
})
export class NotificationModule {}
