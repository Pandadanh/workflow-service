import { Module } from '@nestjs/common';
import { QueueService } from '../shared/services/queue.service';
import { QueueConsumerController } from './application/queue-consumer.controller';
import { OtpService } from './application/otp.service';
import { LoginService } from './application/login.service';
import { EmailService } from './application/email.service';
import { PrismaModule } from '../../prisma.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [PrismaModule, SharedModule],
  providers: [OtpService, LoginService, EmailService],
  controllers: [QueueConsumerController],
  exports: [OtpService, LoginService, EmailService],
})
export class QueueConsumerModule {}
