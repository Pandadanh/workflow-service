

export interface FindUpcomingBookingsParams {
  now: Date;
  twoHoursLater: Date;
  systemUserId: string;
}

export interface BookingWithSlotsAndHost {
  id: string;
  court_name: string | null;
  court_address: string | null;
  time_start: Date;
  time_end: Date;
  price: number | null;
  link_url: string | null;
  count: number | null;
  created_by: string;
  insufficient_slots_notified_at: Date | null;
  host_email: string | null;
  host_username: string;
  current_slots: string;
  hours_until_start: string; // Calculated by database with correct timezone
}
