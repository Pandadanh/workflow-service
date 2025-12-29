import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { IReservationRepository } from '../domain/reservation.repository';

@Injectable()
export class PrismaReservationRepository implements IReservationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    court_id: string;
    host_id: string;
    user_id: string;
    created_by?: string;
    updated_by?: string;
  }) {
    return this.prisma.processing.reservation.create({
      data: {
        court_id: data.court_id,
        host_id: data.host_id,
        user_id: data.user_id,
        created_by: data.created_by,
        updated_by: data.updated_by,
      },
    });
  }
}


