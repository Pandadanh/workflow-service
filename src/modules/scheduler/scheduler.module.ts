import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './application/scheduler.service';
import { SchedulerController } from './application/scheduler.controller';
// import { BadmintonBookingModule } from '../badminton-bookings/badminton-bookings.module';
// import { PaymentModule } from '../payment/payment.module';
// import { UserFavoriteModule } from '../user-favorite/user-favorite.module';
import { SharedModule } from '../shared/shared.module';
import { PrismaModule } from '../../prisma.module';
import { PrismaScheduleRepository } from './infrastructure/prisma-schedule.repository';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // BadmintonBookingModule,
    // PaymentModule,
    // UserFavoriteModule,
    SharedModule, // For Redis and Queue services
    PrismaModule,
  ],
  controllers: [SchedulerController],
  providers: [
    SchedulerService,
    {
      provide: 'IScheduleRepository',
      useClass: PrismaScheduleRepository,
    },
  ],
  exports: [SchedulerService],
})
export class SchedulerModule {}
