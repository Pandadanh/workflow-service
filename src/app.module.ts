import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SmashClubCommonModule } from '@smashclub/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './modules/shared/shared.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { QueueConsumerModule } from './modules/queue-consumer/queue-consumer.module';
import { HealthController } from './common/controllers/health.controller';
import { HealthCheckService } from './common/services/health-check.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SmashClubCommonModule,
    SharedModule,
    SchedulerModule,
    QueueConsumerModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, HealthCheckService],
})
export class AppModule {}
