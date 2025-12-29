import {
  BookingWithSlotsAndHost,
  FindUpcomingBookingsParams,
} from './schedule.interface';

export interface IScheduleRepository {

  findUpcomingBookingsWithSlotsAndHost(
    params: FindUpcomingBookingsParams,
  ): Promise<BookingWithSlotsAndHost[]>;
}
