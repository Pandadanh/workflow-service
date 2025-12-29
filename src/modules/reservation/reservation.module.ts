import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ReservationService } from './application/reservation.service';
import { IReservationRepository } from './domain/reservation.repository';
import { PrismaReservationRepository } from './infrastructure/prisma-reservation.repository';
import { RequestUserProvider } from '../../common/request-user.provider';

@Module({
  providers: [
    PrismaService,
    ReservationService,
    { provide: IReservationRepository, useClass: PrismaReservationRepository },
    RequestUserProvider,
  ],
  exports: [ReservationService, IReservationRepository],
})
export class ReservationModule {}


