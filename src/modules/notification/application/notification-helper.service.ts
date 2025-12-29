import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto, NotificationType } from '../dto/index';

export interface EmailNotificationData {
  userId: string;
  email: string;
  subject?: string;
  content?: string;
  type?: string;
  resourceId?: string;
  resourceType?: string;
  metadata?: any;
}

@Injectable()
export class NotificationHelperService {
  private readonly logger = new Logger(NotificationHelperService.name);

  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  async createNotificationForEmail(
    emailType: string,
    data: EmailNotificationData
  ): Promise<void> {
    try {
      const notificationData = this.mapEmailToNotification(emailType, data);
      if (notificationData) {
        await this.notificationService.create(notificationData);
        this.logger.log(`[Notification] Created notification for email type: ${emailType}, userId: ${data.userId}`);
      }
    } catch (error) {
      this.logger.error(`[Notification] Failed to create notification for email type: ${emailType}`, error);
      // Không throw error để không ảnh hưởng đến việc gửi email
    }
  }

  private mapEmailToNotification(
    emailType: string,
    data: EmailNotificationData
  ): CreateNotificationDto | null {
    const baseNotification = {
      userId: data.userId,
      resourceId: data.resourceId,
      resourceType: data.resourceType,
      metadata: {
        emailType,
        email: data.email,
        ...data.metadata,
      },
    };

    switch (emailType) {
      case 'email_otp':
        return {
          ...baseNotification,
          title: 'Mã OTP đã được gửi',
          message: 'Chúng tôi đã gửi mã OTP đến email của bạn. Vui lòng kiểm tra và nhập mã để xác thực.',
          type: NotificationType.SYSTEM,
          actionUrl: '/auth/verify-otp',
        };

      case 'email_verification':
        return {
          ...baseNotification,
          title: 'Xác thực email',
          message: 'Chúng tôi đã gửi link xác thực đến email của bạn. Vui lòng kiểm tra và click vào link để xác thực tài khoản.',
          type: NotificationType.SYSTEM,
          actionUrl: '/auth/verify-email',
        };

      case 'email_notification':
        return {
          ...baseNotification,
          title: data.subject || 'Thông báo mới',
          message: data.content || 'Bạn có một thông báo mới từ hệ thống.',
          type: NotificationType.GENERAL,
        };

      case 'email_booking_member_joined':
        return {
          ...baseNotification,
          title: 'Có người tham gia booking',
          message: 'Có thành viên mới tham gia vào lịch đặt sân của bạn. Hãy kiểm tra chi tiết booking.',
          type: NotificationType.BOOKING,
          resourceType: 'booking',
          actionUrl: `/bookings/${data.resourceId}`,
          details: [{
            content: 'Thành viên mới đã tham gia vào lịch đặt sân. Bạn có thể xem thông tin chi tiết và liên hệ với họ.',
            actionLabel: 'Xem chi tiết booking',
            actionUrl: `/bookings/${data.resourceId}`,
            priority: 2,
          }],
        };

      case 'email_booking_paid':
        return {
          ...baseNotification,
          title: 'Thanh toán booking thành công',
          message: 'Thanh toán cho lịch đặt sân đã được xử lý thành công. Cảm ơn bạn đã sử dụng dịch vụ.',
          type: NotificationType.PAYMENT,
          resourceType: 'booking',
          actionUrl: `/bookings/${data.resourceId}`,
          details: [{
            content: 'Giao dịch thanh toán đã được xử lý thành công. Bạn có thể xem chi tiết thanh toán và booking.',
            actionLabel: 'Xem chi tiết',
            actionUrl: `/bookings/${data.resourceId}`,
            priority: 2,
          }],
        };

      case 'email_booking_member_canceled':
        return {
          ...baseNotification,
          title: 'Thành viên đã hủy booking',
          message: 'Có thành viên đã hủy tham gia lịch đặt sân. Vui lòng kiểm tra và cập nhật thông tin.',
          type: NotificationType.BOOKING,
          resourceType: 'booking',
          actionUrl: `/bookings/${data.resourceId}`,
          details: [{
            content: 'Một thành viên đã hủy tham gia booking. Slot đã được giải phóng cho người khác đăng ký.',
            actionLabel: 'Xem chi tiết',
            actionUrl: `/bookings/${data.resourceId}`,
            priority: 2,
          }],
        };

      case 'withdrawal_notification':
        return {
          ...baseNotification,
          title: 'Thông báo rút tiền',
          message: 'Có cập nhật về yêu cầu rút tiền của bạn. Vui lòng kiểm tra chi tiết.',
          type: NotificationType.PAYMENT,
          resourceType: 'withdrawal',
          actionUrl: `/wallet/withdrawals/${data.resourceId}`,
          details: [{
            content: 'Trạng thái yêu cầu rút tiền đã được cập nhật. Bạn có thể xem chi tiết giao dịch.',
            actionLabel: 'Xem chi tiết rút tiền',
            actionUrl: `/wallet/withdrawals/${data.resourceId}`,
            priority: 3,
          }],
        };

      case 'withdrawal_alert':
        return {
          ...baseNotification,
          title: 'Cảnh báo rút tiền',
          message: 'Có vấn đề với yêu cầu rút tiền của bạn. Vui lòng kiểm tra và xử lý.',
          type: NotificationType.WARNING,
          resourceType: 'withdrawal',
          actionUrl: `/wallet/withdrawals/${data.resourceId}`,
          details: [{
            content: 'Yêu cầu rút tiền gặp vấn đề và cần được xử lý. Vui lòng liên hệ hỗ trợ nếu cần thiết.',
            actionLabel: 'Xem chi tiết',
            actionUrl: `/wallet/withdrawals/${data.resourceId}`,
            priority: 4,
          }],
        };

      default:
        this.logger.warn(`[Notification] Unknown email type: ${emailType}`);
        return null;
    }
  }

  // Helper methods để tạo notification cho các trường hợp cụ thể
  async createBookingNotification(
    userId: string,
    bookingId: string,
    title: string,
    message: string,
    actionUrl?: string
  ): Promise<void> {
    await this.notificationService.create({
      userId,
      title,
      message,
      type: NotificationType.BOOKING,
      resourceId: bookingId,
      resourceType: 'booking',
      actionUrl: actionUrl || `/bookings/${bookingId}`,
    });
  }

  async createPaymentNotification(
    userId: string,
    paymentId: string,
    title: string,
    message: string,
    actionUrl?: string
  ): Promise<void> {
    await this.notificationService.create({
      userId,
      title,
      message,
      type: NotificationType.PAYMENT,
      resourceId: paymentId,
      resourceType: 'payment',
      actionUrl: actionUrl || `/payments/${paymentId}`,
    });
  }

  async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    actionUrl?: string
  ): Promise<void> {
    await this.notificationService.create({
      userId,
      title,
      message,
      type: NotificationType.SYSTEM,
      actionUrl,
    });
  }

  async createPromotionNotification(
    userId: string,
    promotionId: string,
    title: string,
    message: string,
    actionUrl?: string
  ): Promise<void> {
    await this.notificationService.create({
      userId,
      title,
      message,
      type: NotificationType.PROMOTION,
      resourceId: promotionId,
      resourceType: 'promotion',
      actionUrl: actionUrl || `/promotions/${promotionId}`,
    });
  }
}
