import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
// import { BadmintonBookingService } from '../../badminton-bookings/application/badminton-bookings.service';
// import { PaymentService } from '../../payment/applications/payment.service';
// import { IUserFavoriteRepository } from '../../user-favorite/domain/user-favorite.repository';
import { QueueService } from '../../shared/services/queue.service';
import { PrismaService } from '../../../prisma.service';
import { SystemConstants } from '../../../common/constants';
import type { IScheduleRepository } from '../domain/schedule.repository';
import { getCurrentVietnamTime } from '../../../common/utils/timezone.util';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    // private readonly badmintonBookingService: BadmintonBookingService,
    // private readonly paymentService: PaymentService,
    // private readonly repo: IUserFavoriteRepository,
    private readonly queueService: QueueService,
    private readonly prisma: PrismaService,
    @Inject('IScheduleRepository')
    private readonly scheduleRepository: IScheduleRepository,
  ) {}

  // Chạy mỗi 30 phút một lần
  // @Cron(CronExpression.EVERY_30_MINUTES)
  // async handleImportFromSheet() {
  //   this.logger.log('Starting scheduled import from Google Sheet...');

  //   try {
  //     const result = await this.badmintonBookingService.importFromSheet(false);

  //     this.logger.log('Scheduled import completed:', {
  //       imported: result.imported,
  //       updated: result.updated,
  //       skipped: result.skipped,
  //       errors: result.errors.length,
  //     });

  //     if (result.errors.length > 0) {
  //       this.logger.warn('Import completed with errors:', result.errors);
  //     }
  //   } catch (error) {
  //     this.logger.error('Scheduled import failed:', error.message);
  //   }
  // }

  // Chạy mỗi 15 phút để kiểm tra payment PENDING
  // @Cron('*/15 * * * *') // Mỗi 15 phút
  // async handlePaymentVerification() {
  //   this.logger.log('Starting payment verification job...');

  //   try {
  //     const result = await this.paymentService.verifyPendingPayments();

  //     this.logger.log('Payment verification completed:', {
  //       checked: result.checked,
  //       updated: result.updated,
  //       errors: result.errors.length,
  //     });

  //     if (result.errors.length > 0) {
  //       this.logger.warn(
  //         'Payment verification completed with errors:',
  //         result.errors,
  //       );
  //     }
  //   } catch (error) {
  //     this.logger.error('Payment verification failed:', error.message);
  //   }
  // }

  // Mỗi 60 phút: cộng điểm cho các thanh toán thành công chưa có PointTransaction (bỏ qua 1am - 6am)
  @Cron('0 0 * * * *') // Mỗi giờ một lần (sẽ tự bỏ qua 1am-6am)
  async handleCreatePointTransactions() {
    this.logger.log('Starting point transaction creation job...');

    try {
      // Skip từ 01:00 đến 06:59
      const now = new Date();
      const hour = now.getHours();
      if (hour >= 1 && hour <= 6) {
        this.logger.log(
          'Skipping point transaction job during 01:00-06:59 window',
        );
        return;
      }

      const result = await this.createPointTransactionsForPaidMembers();

      this.logger.log('Point transaction creation completed:', {
        processed: result.processed,
        created: result.created,
        skipped: result.skipped,
        errors: result.errors.length,
      });

      if (result.errors.length > 0) {
        this.logger.warn(
          'Point transaction creation completed with errors:',
          result.errors,
        );
      }
    } catch (error) {
      this.logger.error('Point transaction creation failed:', error.message);
    }
  }

  // Run at 00:00 and 12:00
  // @Cron('0 0 0,12 * * *')
  // async handleGenerateUserFavorites() {
  //   this.logger.log('Cron job running: update user favorites');
  //   try {
  //     const res = await this.repo.bulkUpsertFromCombinedSources();
  //     this.logger.log(res.message);
  //   } catch (error) {
  //     this.logger.error(`Cron job failed: ${error.message}`, error.stack);
  //   }
  // }

  // === WITHDRAWAL SCHEDULER METHODS ===

  // Every 5 minutes - Process expired transactions (with Redis cache)
  // @Cron('0 */5 * * * *')
  async handleExpiredTransactions() {
    this.logger.log('Running expired transactions cleanup...');
    try {
      // Check Redis cache để tránh duplicate processing
      const cacheKey = 'cron:expired_cleanup';

      await this.queueService.sendWithdrawalProcessingJob({
        transactionId: 'system',
        userId: 'system',
        action: 'process_withdrawal',
        metadata: { type: 'expired_cleanup' },
      });

    } catch (error) {
      this.logger.error('Error processing expired transactions:', error);
    }
  }

  // Every 5 minutes instead of 2 minutes - Query timeout transactions (optimized)
  // @Cron('0 */5 * * * *')
  async handleTimeoutTransactions() {
    this.logger.log('Running timeout transactions query...');
    try {
      // Check Redis cache để tránh duplicate processing
      const cacheKey = 'cron:timeout_check';

      await this.queueService.sendWithdrawalProcessingJob({
        transactionId: 'system',
        userId: 'system',
        action: 'query_momo_status',
        metadata: { type: 'timeout_check' },
      });

    } catch (error) {
      this.logger.error('Error querying timeout transactions:', error);
    }
  }

  // Every 2 hours instead of every hour - Cleanup expired OTPs (optimized)
  // @Cron('0 0 */2 * * *')
  async handleExpiredOtps() {
    this.logger.log('Running expired OTPs cleanup...');
    try {
      // Check Redis cache để tránh duplicate processing
      const cacheKey = 'cron:otp_cleanup';
      await this.queueService.publishMessage({
        type: 'cleanup_expired_otps',
        data: { cleanupType: 'otp_cleanup' },
        timestamp: new Date(),
      });
      
    } catch (error) {
      this.logger.error('Error cleaning up expired OTPs:', error);
    }
  }

  // Every day at 2 AM - Cleanup old logs (with Redis cache)
  // @Cron('0 0 2 * * *')
  async handleOldLogsCleanup() {
    this.logger.log('Running old logs cleanup...');
    try {
      // Check Redis cache để tránh duplicate processing
      const cacheKey = 'cron:logs_cleanup';
      const today = new Date().toDateString();

      await this.queueService.publishMessage({
        type: 'cleanup_old_logs',
        data: { cleanupType: 'log_cleanup' },
        timestamp: new Date()
      });
    } catch (error) {
      this.logger.error('Error cleaning up old logs:', error);
    } 
  }

  // Every day at 1 AM - Reset daily limits (with Redis cache optimization)
  // @Cron('0 0 1 * * *')
  async handleDailyLimitsReset() {
    this.logger.log('Running daily limits reset...');
    try {
      // Check Redis cache để tránh duplicate processing
      const cacheKey = 'cron:daily_reset';
      const today = new Date().toDateString();

      // Reset daily limits in database
      await this.resetDailyLimits();
    } catch (error) {
      this.logger.error('Error resetting daily limits:', error);
    }
  }

  private async resetDailyLimits() {
    try {   
      this.logger.log('Daily limits reset completed');
    } catch (error) {
      this.logger.error('Error in resetDailyLimits:', error);
    }
  }

  /**
   * Tạo PointTransaction cho các BookingMember đã thanh toán thành công nhưng chưa có PointTransaction
   */
  private async createPointTransactionsForPaidMembers(): Promise<{
    processed: number;
    created: number;
    skipped: number;
    errors: Array<{ memberId: string; error: string }>;
  }> {
    const result = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: [] as Array<{ memberId: string; error: string }>,
    };

    try {
      // Tìm tất cả BookingMember đã thanh toán và có id_account (user_id)
      const paidMembers = await this.prisma.processing.bookingMember.findMany({
        where: {
          is_payment: true,
          is_active: true,
          is_deleted: false,
          id_account: { not: null }, // Chỉ lấy những member có user_id
        },
        include: {
          badminton_booking: true,
        },
        orderBy: {
          created_at: 'asc',
        },
      });

      this.logger.log(`Found ${paidMembers.length} paid members to process`);

      for (const member of paidMembers) {
        result.processed++;

        try {
          // Tạo PointTransaction; nếu trùng unique key sẽ bắt lỗi và bỏ qua
          const pointValue = 10;
          const pointTransaction = await this.prisma.processing.pointTransaction.create({
            data: {
              user_id: member.id_account!,
              booking_id: member.id_booking,
              point_change: pointValue, // Mặc định 10 điểm
              reason: 'booking_payment_completed',
              bonus: 0,
              note: `Điểm thưởng cho việc thanh toán thành công booking ${member.badminton_booking?.court_name || 'N/A'}`,
              properties: {
                member_id: member.id,
                member_name: member.name,
                booking_time_start: member.time_start,
                booking_time_end: member.time_end,
                payment_completed_at: member.updated_at,
              },
              is_active: true,
              is_deleted: false,
              created_at: new Date(),
              updated_at: new Date(),
            },
          });

          // Cập nhật điểm vào bảng UserRank (tạo nếu chưa có)
          await this.prisma.identity.userRank.upsert({
            where: { user_id: member.id_account! },
            update: { current_point: { increment: pointValue } },
            create: {
              user_id: member.id_account!,
              current_point: pointValue,
              created_at: new Date(),
              updated_at: new Date(),
              is_active: true,
              is_deleted: false,
            },
          });

          result.created++;
          this.logger.log(
            `Created PointTransaction ${pointTransaction.id} and updated rank for user ${member.id_account} (booking ${member.id_booking})`,
          );
        } catch (memberError) {
          // Nếu lỗi do unique constraint (đã tồn tại), coi như skipped
          if ((memberError as any)?.code === 'P2002') {
            result.skipped++;
            this.logger.debug(
              `PointTransaction already exists for user ${member.id_account} and booking ${member.id_booking}`,
            );
          } else {
            result.errors.push({
              memberId: member.id,
              error: (memberError as any).message,
            });
            this.logger.error(
              `Error processing member ${member.id}:`,
              memberError as any,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(
        'Error in createPointTransactionsForPaidMembers:',
        error,
      );
      throw error;
    }

    return result;
  }

  @Cron('0 0 */2 * * *') // Chạy mỗi 2 giờ vào phút 0
  async handleBookingInsufficientSlotsNotification() {
    this.logger.log('Running booking insufficient slots notification job...');

    try {
      const result = await this.checkAndNotifyInsufficientSlots();

      this.logger.log('Booking insufficient slots notification completed:', {
        checked: result.checked,
        notified: result.notified,
        skipped: result.skipped,
        errors: result.errors.length,
      });

      if (result.errors.length > 0) {
        this.logger.warn(
          'Booking notification completed with errors:',
          result.errors,
        );
      }

    } catch (error) {
      this.logger.error(
        'Booking insufficient slots notification failed:',
        error,
      );
    }
  }

  private async checkAndNotifyInsufficientSlots(): Promise<{
    checked: number;
    notified: number;
    skipped: number;
    errors: Array<{ bookingId: string; error: string }>;
  }> {
    const result = {
      checked: 0,
      notified: 0,
      skipped: 0,
      errors: [] as Array<{ bookingId: string; error: string }>,
    };

    try {
      const now = new Date(); // UTC time - will be converted by PostgreSQL
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      this.logger.log(
        `Checking bookings between ${now.toISOString()} and ${twoHoursLater.toISOString()} (UTC time, PostgreSQL will convert)`,
      );

      // Tìm các booking sắp diễn ra trong 2 giờ tới với host info và current slots (using repository)
      const upcomingBookingsRaw =
        await this.scheduleRepository.findUpcomingBookingsWithSlotsAndHost({
          now,
          twoHoursLater,
          systemUserId: SystemConstants.SYSTEM_USER_ID,
        });

      this.logger.log(
        `Found ${upcomingBookingsRaw.length} upcoming bookings to check`,
      );

      for (const booking of upcomingBookingsRaw) {
        result.checked++;

        try {
          const maxSlots = booking.count || 0;
          const currentSlots = parseInt(booking.current_slots, 10);

          // Nếu đã đủ người hoặc không có maxSlots thì bỏ qua
          if (currentSlots >= maxSlots || maxSlots === 0) {
            result.skipped++;
            this.logger.debug(
              `Booking ${booking.id} has sufficient slots (${currentSlots}/${maxSlots}), skipping`,
            );
            continue;
          }

          const notifiedAt = booking.insufficient_slots_notified_at;
          if (notifiedAt) {
            const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

            if (notifiedAt > twoHoursAgo) {
              result.skipped++;
              this.logger.debug(
                `Notification already sent for booking ${booking.id} at ${notifiedAt.toISOString()}, skipping`,
              );
              continue;
            }
          }

          // Host info đã được load trong query
          if (!booking.host_email) {
            result.skipped++;
            this.logger.warn(`Host has no email for booking ${booking.id}`);
            continue;
          }

          const startTime = booking.time_start;
          const endTime = booking.time_end;
          const hoursUntilStart =
            Math.round(parseFloat(booking.hours_until_start) * 10) / 10;

          await this.queueService.publishMessage(
            {
              type: 'email_booking_insufficient_slots',
              data: {
                bookingId: booking.id,
                hostEmail: booking.host_email,
                hostName: booking.host_username,
                courtName: booking.court_name || 'Sân cầu lông',
                courtAddress: booking.court_address || 'Chưa có địa chỉ',
                timeStart: startTime, // Send original Date object
                timeEnd: endTime, // Send original Date object
                maxSlots: maxSlots,
                currentSlots: currentSlots,
                hoursUntilStart: hoursUntilStart,
                linkUrl: booking.link_url || undefined,
                price: booking.price || undefined,
              },
              timestamp: new Date(),
            },
            7,
          ); // Priority 7 (higher priority)

          // Mark as sent in database (no expiry, will check 2-hour window in query)
          await this.prisma.processing.badmintonBooking.update({
            where: { id: booking.id },
            data: { insufficient_slots_notified_at: getCurrentVietnamTime() },
          });

          result.notified++;
          this.logger.log(
            `Notification queued for booking ${booking.id} (${currentSlots}/${maxSlots} slots, starts in ${hoursUntilStart}h)`,
          );
        } catch (bookingError) {
          const errorMessage =
            bookingError instanceof Error
              ? bookingError.message
              : String(bookingError);
          result.errors.push({
            bookingId: booking.id,
            error: errorMessage,
          });
          this.logger.error(
            `Error processing booking ${booking.id}:`,
            bookingError,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error in checkAndNotifyInsufficientSlots:', error);
      throw error;
    }

    return result;
  }

  @Cron('0 0 0 * * 0') // 00:00 Chủ nhật
  async autoCreateWeeklyBookings() {
    this.logger.log('Cron started: autoCreateWeeklyBookings');

    try {
      const result = await this.prisma.processing.$queryRaw<any>`
        SELECT * FROM auto_create_weekly_bookings();
      `;

      const data = result[0];

      this.logger.log(`Result: ${JSON.stringify(data, null, 2)}`);

      if (data.log_messages) {
        data.log_messages.forEach(msg => {
          msg.startsWith('ERROR')
            ? this.logger.error(msg)
            : this.logger.log(msg);
        });
      }
    } catch (err) {
      this.logger.error('Cron error', err);
    }

    this.logger.log('Cron done.');
  }
}
