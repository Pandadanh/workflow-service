import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { IScheduleRepository } from '../domain/schedule.repository';
import {
  BookingWithSlotsAndHost,
  FindUpcomingBookingsParams,
} from '../domain/schedule.interface';

@Injectable()
export class PrismaScheduleRepository implements IScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUpcomingBookingsWithSlotsAndHost(
    params: FindUpcomingBookingsParams,
  ): Promise<BookingWithSlotsAndHost[]> {
    const { now, twoHoursLater, systemUserId } = params;

    const result = await this.prisma.processing.$queryRaw<BookingWithSlotsAndHost[]>`
      SELECT 
        b.id,
        b.court_name,
        b.court_address,
        b.time_start,
        b.time_end,
        b.price,
        b.link_url,
        b.count,
        b.created_by,
        b.insufficient_slots_notified_at,
        u.email as host_email,
        u.username as host_username,
        COALESCE(SUM(bm.slot), 0) as current_slots,
        CAST(EXTRACT(EPOCH FROM (b.time_start - NOW())) / 3600 AS TEXT) as hours_until_start
      FROM "BadmintonBooking" b
      INNER JOIN "User" u ON b.created_by = u.id
      LEFT JOIN "BookingMember" bm ON b.id = bm.id_booking 
        AND bm.is_active = true 
        AND bm.is_deleted = false
      WHERE b.time_start >= ${now}
        AND b.time_start <= ${twoHoursLater}
        AND b.is_active = true
        AND b.is_deleted = false
        AND b.count IS NOT NULL
        AND b.created_by IS NOT NULL
        AND b.created_by != ${systemUserId}::uuid
      GROUP BY b.id, b.court_name, b.court_address, b.time_start, b.time_end, 
               b.price, b.link_url, b.count, b.created_by, 
               b.insufficient_slots_notified_at, u.email, u.username
      ORDER BY b.time_start ASC
    `;

    return result;
  }
}
