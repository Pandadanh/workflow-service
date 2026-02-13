import { Module } from '@nestjs/common';
import { GlickoService } from './application/glicko.service';
import { RatingService } from './application/rating.service';
import { PrismaRatingRepository } from './infrastructure/prisma-rating.repository';
import { PrismaService } from '../../prisma.service';
import { Logger } from '@nestjs/common';

@Module({
  providers: [
    GlickoService,
    RatingService,
    PrismaService,
    Logger,
    {
      provide: 'IRatingRepository',
      useClass: PrismaRatingRepository,
    },
  ],
  exports: [GlickoService, RatingService],
})
export class RankingModule {}
