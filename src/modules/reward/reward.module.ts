import { Module } from '@nestjs/common';
import { RewardService } from './application/reward.service';
import { PrismaRewardRepository } from './infrastructure/prisma-reward.repository';
import { PrismaModule } from '../../prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    RewardService,
    PrismaRewardRepository,
    {
      provide: 'IRewardRepository',
      useClass: PrismaRewardRepository,
    },
  ],
  exports: [RewardService],
})
export class RewardModule {}
