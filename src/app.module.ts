import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './modules/shared/shared.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { QueueConsumerModule } from './modules/queue-consumer/queue-consumer.module';
import { GatewayRegistryService } from './common/services/gateway-registry.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SharedModule,
    SchedulerModule,
    QueueConsumerModule,
  ],
  controllers: [AppController],
  providers: [AppService, GatewayRegistryService],
})
export class AppModule {}
