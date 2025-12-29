import { Injectable } from '@nestjs/common';
import { IReservationRepository } from '../domain/reservation.repository';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class ReservationService {
  constructor(
    private readonly reservationRepo: IReservationRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateReservationDto, userId: string) {
    // Prevent duplicates: if exists inactive -> reactivate; if active -> return
    const existed = await this.prisma.processing.reservation.findFirst({
      where: {
        user_id: userId,
        host_id: dto.host_id,
        court_id: dto.court_id,
        is_deleted: false,
      },
    });

    if (existed) {
      if (!existed.is_active) {
        const updated = await this.prisma.processing.reservation.update({
          where: { id: existed.id },
          data: { is_active: true, updated_at: new Date(), updated_by: userId },
        });
        return updated;
      }
      return existed;
    }

    return this.reservationRepo.create({
      court_id: dto.court_id,
      host_id: dto.host_id,
      user_id: userId,
      created_by: userId || dto.created_by,
      updated_by: userId || dto.updated_by,
    });
  }

  async activateIfExists(params: { court_id: string; host_id: string; user_id: string; updated_by: string }) {
    const existed = await this.prisma.processing.reservation.findFirst({
      where: {
        user_id: params.user_id,
        host_id: params.host_id,
        court_id: params.court_id,
        is_deleted: false,
      },
    });

    if (!existed) return null;
    if (existed.is_active) return existed;

    return this.prisma.processing.reservation.update({
      where: { id: existed.id },
      data: { is_active: true, updated_at: new Date(), updated_by: params.updated_by },
    });
  }

  async checkReservationForHost(host_id: string, court_id: string, booking_url?: string) {
    try {
      const reservations = await this.prisma.processing.reservation.findMany({
        where: {
          host_id,
          court_id,
          is_active: true,
          is_deleted: false,
        },
        orderBy: { created_at: 'asc' },
        select: { id: true, user_id: true },
      });
      
      if (!reservations || reservations.length === 0) {
        return null;
      }
      
      // Return array of user IDs and booking info for email notification
      return { 
        user_ids: reservations.map(r => r.user_id),
        booking_url: booking_url || null
      };
    } catch (error) {
      throw error;
    }
  }

  async findByUserId(userId: string, params: { page: number; limit: number; status?: string }) {
    const { page, limit, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      user_id: userId,
      is_deleted: false,
      is_active: true,
    };

    const [reservations, total] = await Promise.all([
      this.prisma.processing.reservation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          court: {
            select: {
              id: true,
              court_name: true,
              court_address: true,
            },
          },
        },
      }),
      this.prisma.processing.reservation.count({ where }),
    ]);

    // Get unique host IDs
    const hostIds = [...new Set(reservations.map(r => r.host_id))];
    
    // Query hosts from identity database
    const hosts = await this.prisma.identity.user.findMany({
      where: {
        id: { in: hostIds },
        is_deleted: false,
        is_active: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    // Create host map for quick lookup
    const hostMap = new Map(hosts.map(h => [h.id, h]));

    // Map reservations with host data
    const reservationsWithHost = reservations.map(reservation => ({
      ...reservation,
      host: hostMap.get(reservation.host_id) || null,
    }));

    return {
      data: reservationsWithHost,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, userId: string) {
    const reservation = await this.prisma.processing.reservation.findFirst({
      where: {
        id,
        user_id: userId,
        is_deleted: false,
      },
      include: {
        court: {
          select: {
            id: true,
            court_name: true,
            court_address: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    // Query host from identity database
    const host = await this.prisma.identity.user.findFirst({
      where: {
        id: reservation.host_id,
        is_deleted: false,
        is_active: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    return {
      ...reservation,
      host: host || null,
    };
  }

  async cancel(id: string, userId: string) {
    const reservation = await this.prisma.processing.reservation.findFirst({
      where: {
        id,
        user_id: userId,
        is_deleted: false,
      },
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (!reservation.is_active) {
      throw new Error('Reservation is already cancelled');
    }

    const updatedReservation = await this.prisma.processing.reservation.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: new Date(),
        updated_by: userId,
      },
    });

    return {
      id: updatedReservation.id,
      message: 'Reservation cancelled successfully',
    };
  }
}


