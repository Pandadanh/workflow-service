import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma.service';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';

export interface OtpData {
  email: string;
  otp: string;
  userId?: string;
  transactionId: string;
  expiresAt: Date;
  purpose?: string; // 'SIGNUP' | 'LOGIN'
}

export interface VerificationData {
  email: string;
  verificationToken: string;
  userId: string;
}

export interface NotificationData {
  email: string;
  subject: string;
  message: string;
  userId?: string;
}

export interface BookingMemberJoinedData {
  bookingMemberId: string;
}

export interface BookingPaidData {
  orderId: string;
}

export interface MemberSlotChangedData {
  bookingMemberId: string;
  oldSlot: number;
  newSlot: number;
}

export interface MemberCanceledData {
  bookingMemberId: string;
}

export interface ReservationNotificationData {
  user_id: string;
  host_id: string;
  court_id: string;
  booking_url?: string;
}

export interface BookingInsufficientSlotsData {
  bookingId: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private readonly emailCache = new Map<string, number>(); // Rate limiting cache
  private readonly maxEmailsPerMinute = 10;
  private cacheCleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    this.initializeTransporter();
    this.startCacheCleanup();
  }

  // Cleanup on destroy to prevent memory leak
  onModuleDestroy() {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
      this.cacheCleanupInterval = null;
    }
    if (this.transporter) {
      this.transporter.close();
    }
    this.emailCache.clear();
  }

  private initializeTransporter() {
    // Cấu hình SMTP từ environment variables
    const smtpConfig = {
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: this.configService.get<number>('SMTP_PORT') || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
      pool: true, // Use connection pooling
      maxConnections: 5, // Max concurrent connections
      maxMessages: 100, // Max messages per connection
      rateDelta: 1000, // Time window for rate limiting (1 second)
      rateLimit: 10, // Max messages per rateDelta
    };

    this.transporter = nodemailer.createTransport(smtpConfig);
    
    // Verify connection on startup
    this.transporter.verify((error) => {
      if (error) {
        this.logger.error('SMTP connection verification failed:', error);
      } else {
        this.logger.log('SMTP server is ready to send emails');
      }
    });
  }

  private startCacheCleanup() {
    // Clean up email cache every minute
    this.cacheCleanupInterval = setInterval(() => {
      const now = Date.now();
      const before = this.emailCache.size;
      for (const [email, timestamp] of this.emailCache.entries()) {
        if (now - timestamp > 60000) { // 1 minute
          this.emailCache.delete(email);
        }
      }
      const after = this.emailCache.size;
      if (before !== after) {
        this.logger.debug(`[Email] Cache cleanup: ${before - after} entries removed, ${after} remaining`);
      }
    }, 60000);
  }

  private getLogoAttachment() {
    try {
      const logoPath = path.resolve(process.cwd(), 'public', 'favicon.ico');
      if (fs.existsSync(logoPath)) {
        return {
          filename: 'favicon.ico',
          path: logoPath,
          cid: 'app_logo',
        };
      }
      this.logger.warn(`[Email] Logo not found at ${logoPath}`);
      return null;
    } catch (e) {
      this.logger.warn('[Email] Error resolving logo path', e as any);
      return null;
    }
  }

  private checkRateLimit(email: string): boolean {
    const now = Date.now();
    const lastSent = this.emailCache.get(email) || 0;
    
    if (now - lastSent < 60000 / this.maxEmailsPerMinute) {
      this.logger.warn(`Rate limit exceeded for email: ${email}`);
      return false;
    }
    
    this.emailCache.set(email, now);
    return true;
  }

  async sendOtpEmail(data: OtpData) {
    const startTime = Date.now();
    this.logger.log(`[Email] Sending OTP to: ${data.email}`);
    
    try {
      // Skip rate limit for OTP emails (critical for user experience)
      // if (!this.checkRateLimit(data.email)) {
      //   throw new Error(`Rate limit exceeded for ${data.email}`);
      // }

      // Store OTP in database first
      await this.storeOtp(data);
      
      // Send actual email
      const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM') || 'noreply@badminton-booking.com',
        to: data.email,
        subject: 'Mã OTP xác thực tài khoản',
        html: this.generateOtpEmailTemplate(data.otp, data.expiresAt),
      };

      const result = await this.transporter.sendMail(mailOptions);
      const duration = Date.now() - startTime;
      this.logger.log(`[Email] OTP sent successfully to ${data.email} in ${duration}ms. MessageId: ${result.messageId}`);
      
      return result;
    } catch (error) {
      this.logger.error(`[Email] Failed to send OTP to ${data.email}:`, error);
      throw error;
    }
  }

  async sendVerificationEmail(data: VerificationData) {
    this.logger.log(`Sending verification email to: ${data.email}`);
    
    try {
      // Store verification token in database first
      await this.storeVerificationToken(data);
      
      // Send actual email
      const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM') || 'noreply@badminton-booking.com',
        to: data.email,
        subject: 'Xác thực tài khoản email',
        html: this.generateVerificationEmailTemplate(data.verificationToken),
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent successfully to ${data.email}. MessageId: ${result.messageId}`);
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${data.email}:`, error);
      throw error;
    }
  }

  async sendNotificationEmail(data: NotificationData) {
    this.logger.log(`Sending notification email to: ${data.email}`);
    
    try {
      const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM') || 'noreply@badminton-booking.com',
        to: data.email,
        subject: data.subject,
        html: this.generateNotificationEmailTemplate(data.message),
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Notification email sent successfully to ${data.email}. MessageId: ${result.messageId}`);
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to send notification email to ${data.email}:`, error);
      throw error;
    }
  }

  private async isUserEmailNotifyEnabled(userId: string | null | undefined): Promise<boolean> {
    if (!userId) return true;
    try {
      const config = await this.prismaService.identity.userSystemConfig.findUnique({ where: { userId } });
      if (!config) return true;
      return !!config.notifyEmailInApp;
    } catch (error) {
      // Fail-open: if config cannot be read, assume enabled
      this.logger.warn(`[Email] Unable to read UserSystemConfig for userId=${userId}, defaulting to enabled`);
      return true;
    }
  }

  async sendBookingMemberJoinedEmail(data: BookingMemberJoinedData) {
    this.logger.log(`[Email] Preparing booking member joined email for bookingMemberId=${data.bookingMemberId}`);

    // Load booking member and related booking
    const bookingMember = await this.prismaService.processing.bookingMember.findUnique({
      where: { id: data.bookingMemberId },
      include: {
        badminton_booking: true,
        court: true,
      },
    });

    if (!bookingMember || !bookingMember.badminton_booking) {
      this.logger.warn(`[Email] BookingMember or related booking not found: ${data.bookingMemberId}`);
      return;
    }

    const booking = bookingMember.badminton_booking;
    const hostUserId = booking.created_by || null;

    // Resolve recipient
    let recipientEmail: string | null = null;
    let recipientName: string | null = null;
    if (hostUserId) {
      const user = await this.prismaService.identity.user.findUnique({ where: { id: hostUserId } });
      recipientEmail = user?.email ?? null;
      recipientName = user?.username ?? null;
    }

    if (!recipientEmail) {
      this.logger.warn(`[Email] No recipient email for bookingMemberId=${data.bookingMemberId} (hostUserId=${hostUserId})`);
      return;
    }

    // Check opt-in
    const enabled = await this.isUserEmailNotifyEnabled(hostUserId);
    if (!enabled) {
      this.logger.log(`[Email] User ${hostUserId} disabled email notifications. Skipping.`);
      return;
    }

    // Compose email
    const subject = 'Booking của bạn đã có người tham gia';
    const html = this.generateBookingMemberJoinedTemplate({
      recipientName: recipientName || 'bạn',
      memberName: bookingMember.name,
      memberPhone: bookingMember.phone_number,
      memberSkill: bookingMember.skill_levels || 'Không rõ',
      courtName: booking.court_name || bookingMember.court?.court_name || 'Sân cầu lông',
      courtAddress: booking.court_address || bookingMember.court?.court_address || '—',
      timeStart: booking.time_start,
      timeEnd: booking.time_end,
      slot: (bookingMember as any).slot ?? 1,
      linkUrl: bookingMember.link_url || booking.link_url || undefined,
      price: bookingMember.price || booking.price || undefined,
    });

    const logo = this.getLogoAttachment();
    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM') || 'noreply@badminton-booking.com',
      to: recipientEmail,
      subject,
      html,
      attachments: logo ? [logo] : undefined,
    };

    const result = await this.transporter.sendMail(mailOptions);
    this.logger.log(`[Email] Booking joined email sent to ${recipientEmail}. MessageId: ${result.messageId}`);
    return result;
  }

  async sendBookingPaidEmail(data: BookingPaidData) {
    this.logger.log(`[Email] Preparing booking paid email for orderId=${data.orderId}`);

    // Load order and payments
    const order = await this.prismaService.finance.order.findUnique({ where: { id: data.orderId } });
    if (!order) {
      this.logger.warn(`[Email] Order not found: ${data.orderId}`);
      return;
    }

    // Try resolve booking member via multiple strategies
    const resourceId = order.resourceId || null;
    let bookingMember = null as any;

    if (resourceId) {
      bookingMember = await this.prismaService.processing.bookingMember.findFirst({
        where: { OR: [ { id: resourceId }, { resource_id: order.id } ] },
        include: { badminton_booking: true, court: true },
      });
    } else {
      bookingMember = await this.prismaService.processing.bookingMember.findFirst({
        where: { resource_id: order.id },
        include: { badminton_booking: true, court: true },
      });
    }

    if (!bookingMember || !bookingMember.badminton_booking) {
      this.logger.warn(`[Email] BookingMember not linked to orderId=${data.orderId}`);
      return;
    }

    const booking = bookingMember.badminton_booking;
    const hostUserId = booking.created_by || null;

    // Recipient
    let recipientEmail: string | null = null;
    let recipientName: string | null = null;
    if (hostUserId) {
      const user = await this.prismaService.identity.user.findUnique({ where: { id: hostUserId } });
      recipientEmail = user?.email ?? null;
      recipientName = user?.username ?? null;
    }

    if (!recipientEmail) {
      this.logger.warn(`[Email] No recipient email for paid notification (orderId=${data.orderId})`);
      return;
    }

    // Opt-in check
    const enabled = await this.isUserEmailNotifyEnabled(hostUserId);
    if (!enabled) {
      this.logger.log(`[Email] User ${hostUserId} disabled email notifications. Skipping.`);
      return;
    }

    // Payer info
    const payerUser = await this.prismaService.identity.user.findUnique({ where: { id: order.userId } });

    // Compose email
    const subject = 'Có người vừa thanh toán cho booking của bạn';
    const html = this.generateBookingPaidTemplate({
      recipientName: recipientName || 'bạn',
      payerName: payerUser?.username || 'Người dùng',
      payerEmail: payerUser?.email || undefined,
      amount: order.amount,
      courtName: booking.court_name || bookingMember.court?.court_name || 'Sân cầu lông',
      courtAddress: booking.court_address || bookingMember.court?.court_address || '—',
      timeStart: booking.time_start,
      timeEnd: booking.time_end,
      slot: (booking as any).slot ?? 1,
      linkUrl: bookingMember.link_url || booking.link_url || undefined,
      orderId: order.id,
    });

    const logo = this.getLogoAttachment();
    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM') || 'noreply@badminton-booking.com',
      to: recipientEmail,
      subject,
      html,
      attachments: logo ? [logo] : undefined,
    };

    const result = await this.transporter.sendMail(mailOptions);
    this.logger.log(`[Email] Booking paid email sent to ${recipientEmail}. MessageId: ${result.messageId}`);
    return result;
  }

  async sendBookingMemberSlotChangedEmail(data: MemberSlotChangedData) {
    const bookingMember = await this.prismaService.processing.bookingMember.findUnique({
      where: { id: data.bookingMemberId },
      include: { badminton_booking: true, court: true },
    });
    if (!bookingMember || !bookingMember.badminton_booking) return;
    const booking = bookingMember.badminton_booking;
    const hostUserId = booking.created_by || null;
    const host = hostUserId ? await this.prismaService.identity.user.findUnique({ where: { id: hostUserId } }) : null;
    const email = host?.email;
    if (!email) return;
    if (!(await this.isUserEmailNotifyEnabled(hostUserId))) return;

    const subject = 'Thay đổi slot tham gia booking';
    const html = this.generateNotificationEmailTemplate(`Người tham gia ${bookingMember.name} (${bookingMember.phone_number}) đã thay đổi slot từ <b>${data.oldSlot}</b> thành <b>${data.newSlot}</b> cho booking tại <b>${booking.court_name || bookingMember.court?.court_name || 'Sân cầu lông'}</b> lúc <b>${new Date(booking.time_start).toLocaleString('vi-VN')}</b>.`);
    const logo = this.getLogoAttachment();
    await this.transporter.sendMail({ from: this.configService.get('SMTP_FROM') || 'noreply@badminton-booking.com', to: email, subject, html, attachments: logo ? [logo] : undefined });
  }

  async sendBookingMemberCanceledEmail(data: MemberCanceledData) {
    const bookingMember = await this.prismaService.processing.bookingMember.findUnique({
      where: { id: data.bookingMemberId },
      include: { badminton_booking: true, court: true },
    });
    if (!bookingMember || !bookingMember.badminton_booking) return;
    const booking = bookingMember.badminton_booking;
    const hostUserId = booking.created_by || null;
    const host = hostUserId ? await this.prismaService.identity.user.findUnique({ where: { id: hostUserId } }) : null;
    const email = host?.email;
    if (!email) return;
    if (!(await this.isUserEmailNotifyEnabled(hostUserId))) return;

    const subject = 'Huỷ tham gia booking';
    const html = this.generateNotificationEmailTemplate(`Người tham gia ${bookingMember.name} (${bookingMember.phone_number}) đã huỷ tham gia booking tại <b>${booking.court_name || bookingMember.court?.court_name || 'Sân cầu lông'}</b> lúc <b>${new Date(booking.time_start).toLocaleString('vi-VN')}</b>.`);
    const logo = this.getLogoAttachment();
    await this.transporter.sendMail({ from: this.configService.get('SMTP_FROM') || 'noreply@badminton-booking.com', to: email, subject, html, attachments: logo ? [logo] : undefined });
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private async storeOtp(data: OtpData) {
    try {
      // Only store OTP in OtpToken table for non-withdrawal purposes
      if (data.purpose === 'WITHDRAWAL') {
        this.logger.log(`Skipping OtpToken storage for withdrawal OTP - handled by WithdrawalOtp table`);
        return;
      }

      // Generate a proper UUID for OTP token (different from withdrawal transactionId)
      const otpTokenId = this.generateUuid();
      
      // Store OTP in database with expiration and transactionId
      await this.prismaService.identity.otpToken.create({
        data: {
          id: otpTokenId,
          email: data.email,
          token: data.otp,
          type: 'EMAIL_OTP',
          expiresAt: data.expiresAt,
          transactionId: data.transactionId, // Use generated UUID for database field
          userId: data.userId || null, // Allow null for new users
          isActive: true,
          isUsed: false,
        },
      });
      
      this.logger.log(`OTP stored for ${data.email} with transactionId: ${data.transactionId} (purpose: ${data.purpose || 'SIGNUP'})`);
    } catch (error) {
      this.logger.error(`Failed to store OTP for ${data.email}:`, error);
      throw error;
    }
  }

  private async storeVerificationToken(data: VerificationData) {
    try {
      // Store verification token in database
      await this.prismaService.identity.verificationToken.create({
        data: {
          email: data.email,
          token: data.verificationToken,
          type: 'EMAIL_VERIFICATION',
          userId: data.userId,
        },
      });
      
      this.logger.log(`Verification token stored for ${data.email}`);
    } catch (error) {
      this.logger.error(`Failed to store verification token for ${data.email}:`, error);
      throw error;
    }
  }

  // Method to verify OTP with transactionId
  async verifyOtp(transactionId: string, otp: string): Promise<{ valid: boolean; email?: string; otpTokenId?: string }> {
    try {
      // Find OTP by transactionId instead of email
      const otpRecord = await this.prismaService.identity.otpToken.findFirst({
        where: {
          transactionId: transactionId,
          token: otp,
          type: 'EMAIL_OTP',
          isActive: true,
          isUsed: false
        },
      });

      if (!otpRecord) {
        this.logger.warn(`Invalid OTP or transactionId: ${transactionId}`);
        return { valid: false };
      }

      // Mark OTP as used (soft delete)
      await this.prismaService.identity.otpToken.update({
        where: { id: otpRecord.id },
        data: {
          isUsed: true,
          isActive: false,
        },
      });

      this.logger.log(`OTP verified successfully for ${otpRecord.email} (transactionId: ${transactionId}, otpTokenId: ${otpRecord.id})`);
      return { valid: true, email: otpRecord.email, otpTokenId: otpRecord.id };
    } catch (error) {
      this.logger.error(`Error verifying OTP for transactionId ${transactionId}:`, error);
      return { valid: false };
    }
  }

  // Method to verify login OTP and return userId
  async verifyLoginOtp(transactionId: string, otp: string): Promise<{ valid: boolean; userId?: string; email?: string }> {
    try {
      // Find OTP by transactionId
      const otpRecord = await this.prismaService.identity.otpToken.findFirst({
        where: {
          token: otp,
          type: 'EMAIL_OTP',
          isActive: true,
          isUsed: false,
          expiresAt: {
            gt: new Date(), // Not expired
          },
        },
      });

      if (!otpRecord) {
        return { valid: false };
      }

      // Find user by email
      const user = await this.prismaService.identity.user.findUnique({
        where: { email: otpRecord.email },
        select: { id: true, email: true }
      });

      if (!user) {
        this.logger.warn(`User not found for email: ${otpRecord.email}`);
        return { valid: false };
      }

      // Mark OTP as used
      await this.prismaService.identity.otpToken.update({
        where: { id: otpRecord.id },
        data: {
          isUsed: true,
          isActive: false,
        },
      });

      this.logger.log(`Login OTP verified successfully for ${otpRecord.email} (userId: ${user.id})`);
      return { valid: true, userId: user.id, email: user.email || undefined };
    } catch (error) {
      this.logger.error(`Error verifying login OTP for transactionId ${transactionId}:`, error);
      return { valid: false };
    }
  }

  // Method to verify email verification token
  async verifyEmailToken(email: string, token: string): Promise<boolean> {
    try {
      const verificationRecord = await this.prismaService.identity.verificationToken.findFirst({
        where: {
          email,
          token,
          type: 'EMAIL_VERIFICATION',
        },
      });

      if (!verificationRecord) {
        this.logger.warn(`Invalid verification token for ${email}`);
        return false;
      }

      // Delete the verification token after successful verification
      await this.prismaService.identity.verificationToken.delete({
        where: { id: verificationRecord.id },
      });

      this.logger.log(`Email verified successfully for ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Error verifying email for ${email}:`, error);
      return false;
    }
  }

  async sendReportThanksEmail(data: {
    reporter_id: string;
    email: string;
    username: string;
    booking_id: string;
    owner_id: string;
  }): Promise<void> {
    this.logger.log(`Start sendReportThanksEmail to ${data.email}`);
    try {
      const logo = this.getLogoAttachment();
      const mailOptions = {
        to: data.email,
        subject: 'Cảm ơn bạn đã gửi báo cáo cho hệ thống',
        html: this.generateReportEmailTemplate({username: data.username, bookingId: data.booking_id, reportType: 'Chủ sân'}),
        attachments: logo ? [logo] : undefined,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Report thanks email send successfully: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send report thanks email:`, error);
      throw error;
    }
  }

  async sendReportConfirmEmail(data: {
    email: string;
    username: string;
    booking_id: string;
    status: string;
    note?: string;
  }) {
    this.logger.log(`Start sendReportConfirmEmail to ${data.email}`);
    const logo = this.getLogoAttachment();
    try {
      const mailOptions = {
        to: data.email,
        subject: 'Cập nhật trạng thái báo cáo của bạn',
        html: this.generateReportEmailTemplate({
          username: data.username,
          bookingId: data.booking_id,
          status: data.status,
          note: data.note,
        }),
        attachments: logo ? [logo] : undefined,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Report confirm email sent successfully: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send report confirm email:`, error);
      throw error;
    }
  }

  // Email template generators
  private generateOtpEmailTemplate(otp: string, expiresAt: Date): string {
    const expiryTime = new Date(expiresAt).toLocaleString('vi-VN');
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Mã OTP xác thực</title>
        <style>
          body { margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background:#f6f7fb; color:#111827; }
          .wrapper { max-width:640px; margin:0 auto; padding:24px 16px; }
          .card { background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(2,6,23,0.06); border:1px solid #eef2f7; }
          .header { background:linear-gradient(135deg, #2563eb, #7c3aed); padding:20px 24px; color:#fff; text-align:center; }
          .brand { display:flex; align-items:center; justify-content:center; gap:12px; }
          .brand img { border-radius:8px; }
          .title { margin:0; font-weight:700; letter-spacing:.2px; }
          .content { padding:24px; }
          .lead { margin:0 0 12px; color:#374151; }
          .otp { margin:16px auto; padding:16px 20px; border-radius:12px; border:2px dashed #2563eb; background:#f0f6ff; color:#1f2937; font-weight:800; font-size:28px; text-align:center; letter-spacing:2px; max-width:260px; }
          .note { margin-top:16px; padding:12px 14px; background:#f9fafb; border:1px solid #eef2f7; border-radius:12px; color:#475569; font-size:13px; }
          .footer { padding:18px; text-align:center; font-size:12px; color:#6b7280; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="header">
              <div class="brand">
                <img src="cid:app_logo" width="28" height="28" alt="logo" />
                <h1 class="title">Xác thực tài khoản</h1>
              </div>
            </div>
            <div class="content">
              <p class="lead">Xin chào,</p>
              <p class="lead">Vui lòng dùng mã OTP dưới đây để xác thực tài khoản của bạn.</p>
              <div class="otp">${otp}</div>
              <div class="note">
                Mã OTP có hiệu lực trong 10 phút. Hết hạn lúc: <strong>${expiryTime}</strong>. Không chia sẻ mã này với bất kỳ ai.
              </div>
            </div>
            <div class="footer">Email tự động từ hệ thống Badminton Booking</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateVerificationEmailTemplate(token: string): string {
    const verificationUrl = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/verify-email?token=${token}`;
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Xác thực email</title>
        <style>
          body { margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; background:#f6f7fb; color:#111827; }
          .wrapper { max-width:640px; margin:0 auto; padding:24px 16px; }
          .card { background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(2,6,23,.06); border:1px solid #eef2f7; }
          .header { background:linear-gradient(135deg,#2563eb,#7c3aed); padding:20px 24px; color:#fff; text-align:center; }
          .brand { display:flex; align-items:center; justify-content:center; gap:12px; }
          .brand img { border-radius:8px; }
          .title { margin:0; font-weight:700; }
          .content { padding:24px; }
          .lead { margin:0 0 10px; color:#374151; }
          .btn { display:inline-block; padding:12px 20px; background:linear-gradient(135deg,#2563eb,#7c3aed); color:#fff !important; text-decoration:none; border-radius:10px; font-weight:600; }
          .muted { margin-top:12px; font-size:12px; color:#6b7280; }
          .code { word-break:break-all; background:#f9fafb; border:1px solid #eef2f7; padding:10px; border-radius:8px; color:#374151; }
          .footer { padding:18px; text-align:center; font-size:12px; color:#6b7280; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="header">
              <div class="brand">
                <img src="cid:app_logo" width="28" height="28" alt="logo" />
                <h1 class="title">Xác thực email tài khoản</h1>
              </div>
            </div>
            <div class="content">
              <p class="lead">Xin chào,</p>
              <p class="lead">Vui lòng nhấp nút bên dưới để xác thực email và hoàn tất đăng ký.</p>
              <div style="text-align:center; margin:18px 0;">
                <a class="btn" href="${verificationUrl}">Xác thực email</a>
              </div>
              <div class="muted">Hoặc mở link sau trên trình duyệt:</div>
              <div class="code">${verificationUrl}</div>
              <div class="muted">Link có hiệu lực trong 24 giờ.</div>
            </div>
            <div class="footer">Email tự động từ hệ thống Badminton Booking</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateNotificationEmailTemplate(message: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Thông báo</title>
        <style>
          body { margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; background:#f6f7fb; color:#111827; }
          .wrapper { max-width:640px; margin:0 auto; padding:24px 16px; }
          .card { background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(2,6,23,.06); border:1px solid #eef2f7; }
          .header { background:linear-gradient(135deg,#2563eb,#7c3aed); padding:20px 24px; color:#fff; text-align:center; }
          .brand { display:flex; align-items:center; justify-content:center; gap:12px; }
          .brand img { border-radius:8px; }
          .title { margin:0; font-weight:700; }
          .content { padding:24px; }
          .notice { background:#f9fafb; border:1px solid #eef2f7; border-left:4px solid #7c3aed; border-radius:12px; padding:16px; color:#374151; }
          .footer { padding:18px; text-align:center; font-size:12px; color:#6b7280; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="header">
              <div class="brand">
                <img src="cid:app_logo" width="28" height="28" alt="logo" />
                <h1 class="title">Thông báo</h1>
              </div>
            </div>
            <div class="content">
              <div class="notice">${message}</div>
            </div>
            <div class="footer">Email tự động từ hệ thống Badminton Booking</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateBookingMemberJoinedTemplate(input: {
    recipientName: string;
    memberName: string;
    memberPhone: string;
    memberSkill: string;
    courtName: string;
    courtAddress: string;
    timeStart: Date;
    timeEnd: Date;
    slot: number;
    linkUrl?: string;
    price?: any;
  }): string {
    const start = new Date(input.timeStart).toLocaleString('vi-VN');
    const end = new Date(input.timeEnd).toLocaleString('vi-VN');
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Booking có người tham gia</title>
        <style>
          body { margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; background:#f6f7fb; color:#111827; }
          .wrapper { max-width:640px; margin:0 auto; padding:24px 16px; }
          .card { background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(2,6,23,.06); border:1px solid #eef2f7; }
          .header { background:linear-gradient(135deg,#10b981,#22c55e); padding:20px 24px; color:#fff; text-align:center; }
          .brand { display:flex; align-items:center; justify-content:center; gap:12px; }
          .brand img { border-radius:8px; margin-right:12px; }
          .title { margin:0; font-weight:700; margin-left:12px; }
          .content { padding:24px; }
          .grid { display:grid; grid-template-columns:1fr; gap:12px; }
          .row { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; background:#f9fafb; border:1px solid #eef2f7; border-radius:10px; }
          .label { color:#6b7280; font-size:13px; font-weight:500; white-space:nowrap; margin-right:16px; }
          .value { color:#111827; font-weight:600; font-size:14px; line-height:1.5; word-break:break-word; text-align:right; flex:1; }
          .link { color:#2563eb; text-decoration:none; word-break:break-all; }
          .footer { padding:18px; text-align:center; font-size:12px; color:#6b7280; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="header">
              <div class="brand">
                <img src="cid:app_logo" width="28" height="28" alt="logo" />
                <h1 class="title">Booking của bạn đã có người tham gia</h1>
              </div>
            </div>
            <div class="content">
              <div class="grid">
                <div class="row">
                  <span class="label">Người tham gia</span>
                  <span class="value">${input.memberName} (${input.memberPhone})</span>
                </div>
                <div class="row">
                  <span class="label">Trình độ</span>
                  <span class="value">${input.memberSkill}</span>
                </div>
                <div class="row">
                  <span class="label">Thời gian</span>
                  <span class="value">${start} - ${end}</span>
                </div>
                <div class="row">
                  <span class="label">Slot</span>
                  <span class="value">${input.slot}</span>
                </div>
                <div class="row">
                  <span class="label">Sân</span>
                  <span class="value">${input.courtName}</span>
                </div>
                <div class="row">
                  <span class="label">Địa chỉ</span>
                  <span class="value">${input.courtAddress}</span>
                </div>
                ${input.price ? `<div class="row">
                  <span class="label">Giá</span>
                  <span class="value">${input.price}</span>
                </div>` : ''}
                ${input.linkUrl ? `<div class="row">
                  <span class="label">Link</span>
                  <span class="value"><a class="link" href="${input.linkUrl}">${input.linkUrl}</a></span>
                </div>` : ''}
              </div>
            </div>
            <div class="footer">Email tự động từ hệ thống Badminton Booking</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateBookingPaidTemplate(input: {
    recipientName: string;
    payerName: string;
    payerEmail?: string;
    amount: number;
    courtName: string;
    courtAddress: string;
    timeStart: Date;
    timeEnd: Date;
    slot: number;
    linkUrl?: string;
    orderId: string;
  }): string {
    const start = new Date(input.timeStart).toLocaleString('vi-VN');
    const end = new Date(input.timeEnd).toLocaleString('vi-VN');
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Booking có thanh toán</title>
        <style>
          body { margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; background:#f6f7fb; color:#111827; }
          .wrapper { max-width:640px; margin:0 auto; padding:24px 16px; }
          .card { background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(2,6,23,.06); border:1px solid #eef2f7; }
          .header { background:linear-gradient(135deg,#2563eb,#7c3aed); padding:20px 24px; color:#fff; text-align:center; }
          .brand { display:flex; align-items:center; justify-content:center; gap:12px; }
          .brand img { border-radius:8px; }
          .title { margin:0; font-weight:700; }
          .content { padding:24px; }
          .grid { display:grid; grid-template-columns:1fr; gap:8px; }
          .row { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:#f9fafb; border:1px solid #eef2f7; border-radius:10px; }
          .label { color:#6b7280; font-size:13px; }
          .value { color:#111827; font-weight:600; font-size:14px; }
          .link { color:#2563eb; text-decoration:none; }
          .footer { padding:18px; text-align:center; font-size:12px; color:#6b7280; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="header">
              <div class="brand">
                <img src="cid:app_logo" width="28" height="28" alt="logo" />
                <h1 class="title">Có người vừa thanh toán</h1>
              </div>
            </div>
            <div class="content">
              <div class="grid">
                <div class="row"><span class="label">Người thanh toán</span><span class="value">${input.payerName}${input.payerEmail ? ` (${input.payerEmail})` : ''}</span></div>
                <div class="row"><span class="label">Số tiền</span><span class="value">${input.amount.toLocaleString('vi-VN')} VND</span></div>
                <div class="row"><span class="label">Thời gian</span><span class="value">${start} - ${end}</span></div>
                <div class="row"><span class="label">Slot</span><span class="value">${input.slot}</span></div>
                <div class="row"><span class="label">Sân</span><span class="value">${input.courtName}</span></div>
                <div class="row"><span class="label">Địa chỉ</span><span class="value">${input.courtAddress}</span></div>
                <div class="row"><span class="label">Mã đơn hàng</span><span class="value">${input.orderId}</span></div>
                ${input.linkUrl ? `<div class="row"><span class="label">Link</span><span class="value"><a class="link" href="${input.linkUrl}">${input.linkUrl}</a></span></div>` : ''}
              </div>
            </div>
            <div class="footer">Email tự động từ hệ thống Badminton Booking</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  async sendReservationNotificationEmail(data: ReservationNotificationData): Promise<void> {
    try {
      // Get user email from user_id
      const user = await this.prismaService.identity.user.findUnique({
        where: { id: data.user_id },
        select: { email: true},
      });

      if (!user || !user.email) {
        this.logger.warn(`[EmailService] User ${data.user_id} not found or has no email`);
        return;
      }

      // Get court information
      const court = await this.prismaService.processing.badmintonCourt.findUnique({
        where: { id: data.court_id },
        select: { court_name: true, court_address: true },
      });
      const recipientEmail = user.email;
      const subject = 'Sân cầu lông bạn đã đặt trước đã có sẵn!';
      const html = this.generateReservationNotificationTemplate({
        recipientEmail: recipientEmail,
        courtName: court?.court_name || 'Sân cầu lông',
        courtAddress: court?.court_address || '',
        bookingUrl: data.booking_url || '#',
      });

      const logo = this.getLogoAttachment();
      const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM') || 'noreply@badminton-booking.com',
        to: recipientEmail,
        subject,
        html,
        attachments: logo ? [logo] : undefined,
      };

      await this.transporter.sendMail(mailOptions);

      this.logger.log(`[EmailService] Reservation notification email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`[EmailService] Failed to send reservation notification email:`, error);
      throw error;
    }
  }

  async sendReservationNotificationsToUsers(userIds: string[], hostId: string, courtId: string, bookingUrl?: string): Promise<void> {
    try {
      this.logger.log(`[EmailService] Sending reservation notifications to ${userIds.length} users`);
      
      for (const userId of userIds) {
        try {
          await this.sendReservationNotificationEmail({
            user_id: userId,
            host_id: hostId,
            court_id: courtId,
            booking_url: bookingUrl,
          });
        } catch (error) {
          this.logger.error(`[EmailService] Failed to send notification to user ${userId}:`, error);
          // Continue with other users even if one fails
        }
      }
      
      this.logger.log(`[EmailService] Completed sending reservation notifications`);
    } catch (error) {
      this.logger.error(`[EmailService] Failed to send reservation notifications:`, error);
      throw error;
    }
  }

  private generateReservationNotificationTemplate(input: {
    recipientEmail: string;
    courtName: string;
    courtAddress: string;
    bookingUrl: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Sân cầu lông đã có sẵn</title>
        <style>
          body { margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; background:#f6f7fb; color:#111827; }
          .wrapper { max-width:640px; margin:0 auto; padding:24px 16px; }
          .card { background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(2,6,23,.06); border:1px solid #eef2f7; }
          .header { background:linear-gradient(135deg,#10b981,#22c55e); padding:20px 24px; color:#fff; text-align:center; }
          .brand { display:flex; align-items:center; justify-content:center; gap:12px; }
          .brand img { border-radius:8px; }
          .title { margin:0; font-weight:700; }
          .content { padding:24px; }
          .grid { display:grid; grid-template-columns:1fr; gap:8px; }
          .row { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:#f9fafb; border:1px solid #eef2f7; border-radius:10px; }
          .label { color:#6b7280; font-size:13px; }
          .value { color:#111827; font-weight:600; font-size:14px; }
          .link { color:#2563eb; text-decoration:none; }
          .cta-button { display:inline-block; background:#10b981; color:#fff; padding:12px 24px; text-decoration:none; border-radius:8px; font-weight:600; margin:16px 0; }
          .message { font-size:16px; line-height:1.6; color:#374151; margin-bottom:20px; }
          .footer { padding:18px; text-align:center; font-size:12px; color:#6b7280; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="header">
              <div class="brand">
                <img src="https://mail.google.com/mail/u/0?ui=2&ik=bbee2aed4d&attid=0.1&permmsgid=msg-f:1846313735149960231&th=199f6c8f5789bc27&view=att&disp=emb&zw" width="28" height="28" alt="logo" />
                <h1 class="title"> Sân cầu lông đã có sẵn!</h1>
              </div>
            </div>
            <div class="content">
              <div class="message">
                <p>Xin chào <strong>${input.recipientEmail}</strong>,</p>
                <p>Chúng tôi có tin vui cho bạn! Sân cầu lông mà bạn đã đặt trước hiện đã có sẵn và bạn có thể tham gia ngay.</p>
              </div>
              
              <div class="grid">
                <div class="row"><span class="label">Sân</span><span class="value">${input.courtName}</span></div>
                <div class="row"><span class="label">Địa chỉ</span><span class="value">${input.courtAddress}</span></div>
                <div class="row"><span class="label">Trạng thái</span><span class="value">Có sẵn</span></div>
              </div>

              <p style="text-align:center; margin:20px 0;">
                <a href="${input.bookingUrl}" class="cta-button">Tham gia ngay</a>
              </p>
    
            </div>
            <div class="footer">Email tự động từ hệ thống Badminton Booking</div>
          </div>
        </div>
      </body>
      </html> 
    `;
  }
  private generateReportEmailTemplate(data: { 
    username?: string; 
    bookingId?: string; 
    reportType?: string;
    status?: string;
    note?: string | null;
  }): string {
    // Xác định nội dung dựa vào có status hay không
    const isStatusUpdate = !!data.status;
    
    const title = isStatusUpdate 
      ? 'Trạng thái báo cáo của bạn' 
      : 'Cảm ơn bạn đã gửi báo cáo';

    // Nội dung chính
    let mainContent = '';
    if (isStatusUpdate) {
      const statusText =
        data.status === 'APPROVED'
          ? 'được chấp nhận.'
          : data.status === 'REJECTED'
          ? 'bị từ chối.'
          : data.status === 'CLOSED'
          ? 'đã đóng.'
          : 'được cập nhật';
      
      mainContent = `
        <p class="lead">
          Báo cáo của bạn liên quan đến đặt sân <strong>${data.bookingId || 'N/A'}</strong> đã ${statusText}.
        </p>
        ${data.note ? `<p class="lead">Lý do: <em>${data.note}</em></p>` : ''}
      `;
    } else {
      const reportTypeText = data.reportType ? `về ${data.reportType}` : 'nội dung liên quan';
      mainContent = `
        <p class="lead">Chúng tôi đã nhận được báo cáo ${reportTypeText} của bạn.</p>
        <p class="lead">Đội ngũ hệ thống sẽ xem xét và xử lý sớm nhất có thể.</p>
        ${data.bookingId ? `<div class="muted">Mã đặt sân liên quan: <strong>${data.bookingId}</strong></div>` : ''}
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
        <style>
          body { margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; background:#f6f7fb; color:#111827; }
          .wrapper { max-width:640px; margin:0 auto; padding:24px 16px; }
          .card { background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(2,6,23,.06); border:1px solid #eef2f7; }
          .header { background:linear-gradient(135deg,#16a34a,#22c55e); padding:20px 24px; color:#fff; text-align:center; }
          .brand { display:flex; align-items:center; justify-content:center; gap:12px; }
          .brand img { border-radius:8px; }
          .title { margin:0; font-weight:700; }
          .content { padding:24px; }
          .lead { margin:0 0 10px; color:#374151; }
          .muted { margin-top:12px; font-size:13px; color:#6b7280; }
          .footer { padding:18px; text-align:center; font-size:12px; color:#6b7280; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="header">
              <div class="brand">
                <img src="cid:app_logo" width="28" height="28" alt="logo" />
                <h1 class="title">${ title}</h1>
              </div>
            </div>
            <div class="content">
              <p class="lead">Xin chào${data.username ? ` ${data.username}` : ''},</p>
              ${mainContent}
              <p class="muted">Cảm ơn bạn đã góp phần giúp cộng đồng trở nên tích cực và công bằng hơn 💪</p>
            </div>
            <div class="footer">
              Email tự động từ hệ thống Badminton Booking — vui lòng không phản hồi lại email này.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateBookingInsufficientSlotsTemplate(input: {
    recipientName: string;
    courtName: string;
    courtAddress: string;
    timeStart: Date;
    timeEnd: Date;
    maxSlots: number;
    currentSlots: number;
    remainingSlots: number;
    hoursUntilStart: number;
    linkUrl?: string;
    price?: any;
  }): string {
    const formatVietnamTime = (date: Date) => {
      const d = new Date(date);
      const hours = String(d.getUTCHours()).padStart(2, '0');
      const minutes = String(d.getUTCMinutes()).padStart(2, '0');
      const seconds = String(d.getUTCSeconds()).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const year = d.getUTCFullYear();
      return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
    };

    const start = formatVietnamTime(input.timeStart);
    const end = formatVietnamTime(input.timeEnd);
    const progressPercentage = Math.round(
      (input.currentSlots / input.maxSlots) * 100,
    );

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Nhắc nhở booking sắp diễn ra</title>
        <style>
          body { margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; background:#f6f7fb; color:#111827; line-height:1.5; }
          .wrapper { max-width:640px; margin:0 auto; padding:24px 16px; }
          .card { background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(2,6,23,.06); border:1px solid #eef2f7; }
          .header { background:linear-gradient(135deg,#f59e0b,#ef4444); padding:20px 24px; color:#fff; text-align:center; }
          .brand { display:flex; align-items:center; justify-content:space-around; gap:12px; }
          .brand img { border-radius:8px; }
          .title { margin:0; font-weight:700; font-size:18px; line-height:1.4; }
          .icon { display:inline-block; margin-right:6px; }
          .content { padding:24px; }
          .alert { background:#fef3c7; border:1px solid #fcd34d; border-left:4px solid #f59e0b; border-radius:12px; padding:16px; color:#92400e; margin-bottom:20px; }
          .alert-title { font-weight:700; margin:0 0 8px; color:#78350f; font-size:15px; }
          .alert-text { margin:0; line-height:1.6; }
          .grid { display:grid; grid-template-columns:1fr; gap:10px; }
          .row { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; background:#f9fafb; border:1px solid #eef2f7; border-radius:10px; gap:12px; }
          .label { color:#6b7280; font-size:13px; flex-shrink:0; margin-right:12px; }
          .value { color:#111827; font-weight:600; font-size:14px; text-align:right; word-break:break-word; }
          .warning { color:#dc2626; font-weight:700; }
          .progress { background:#e5e7eb; border-radius:8px; height:28px; overflow:hidden; margin:16px 0; }
          .progress-bar { background:linear-gradient(90deg,#f59e0b,#ef4444); height:100%; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:13px; transition:width 0.3s; }
          .progress-label { display:flex; justify-content:space-between; margin-bottom:8px; align-items:center; }
          .progress-text { color:#6b7280; font-size:13px; margin-right:12px; }
          .progress-value { color:#111827; font-weight:600; font-size:14px; margin-left:12px; }
          .link { color:#2563eb; text-decoration:none; word-break:break-all; }
          .suggestion { margin-top:20px; padding:14px 16px; background:#f0f9ff; border:1px solid #bae6fd; border-radius:10px; color:#075985; font-size:13px; line-height:1.6; }
          .suggestion-icon { display:inline-block; margin-right:6px; }
          .footer { padding:18px; text-align:center; font-size:12px; color:#6b7280; line-height:1.5; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="header">
              <div class="brand">
                <img src="cid:app_logo" width="28" height="28" alt="logo" />
                <h1 class="title" style="margin-left: 8px;">⚠️ Booking sắp diễn ra - Chưa đủ người</h1>
              </div>
            </div>
            <div class="content">
              <div class="alert">
                <div class="alert-title"><span class="icon">🔔</span> Nhắc nhở quan trọng</div>
                <p class="alert-text">Booking của bạn sẽ bắt đầu trong <strong>${input.hoursUntilStart} giờ nữa</strong> nhưng hiện tại vẫn còn <strong class="warning">${input.remainingSlots} slot trống</strong>.</p>
              </div>
              
              <div style="margin:20px 0;">
                <div class="progress-label">
                  <span class="progress-text">Tình trạng slot</span>
                  <span class="progress-value">${input.currentSlots}/${input.maxSlots} người</span>
                </div>
                <div class="progress">
                  <div class="progress-bar" style="width:${progressPercentage}%; padding-left:8px;">${progressPercentage}%</div>
                </div>
              </div>
              
              <div class="grid">
                <div class="row">
                  <span class="label">Thời gian bắt đầu</span>
                  <span class="value">${start}</span>
                </div>
                <div class="row">
                  <span class="label">Thời gian kết thúc</span>
                  <span class="value">${end}</span>
                </div>
                <div class="row">
                  <span class="label">Sân</span>
                  <span class="value">${input.courtName}</span>
                </div>
                <div class="row">
                  <span class="label">Địa chỉ</span>
                  <span class="value">${input.courtAddress}</span>
                </div>
                <div class="row">
                  <span class="label">Số người tối đa</span>
                  <span class="value">${input.maxSlots} người</span>
                </div>
                <div class="row">
                  <span class="label">Số người đã đăng ký</span>
                  <span class="value">${input.currentSlots} người</span>
                </div>
                <div class="row">
                  <span class="label">Còn thiếu</span>
                  <span class="value warning">${input.remainingSlots} người</span>
                </div>
                ${input.price ? `<div class="row">
                  <span class="label">Giá</span>
                  <span class="value">${input.price}</span>
                </div>` : ''}
                ${input.linkUrl ? `<div class="row">
                  <span class="label">Link booking</span>
                  <span class="value"><a class="link" href="${input.linkUrl}" target="_blank">Xem chi tiết</a></span>
                </div>` : ''}
              </div>
              
              <div class="suggestion">
                <span class="suggestion-icon">💡</span> <strong>Gợi ý:</strong> Hãy mời thêm bạn bè hoặc chia sẻ link booking để có đủ người chơi nhé!
              </div>
            </div>
            <div class="footer">Email tự động từ hệ thống Badminton Booking</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendBookingInsufficientSlotsEmail(data: {
    bookingId: string;
    hostEmail: string;
    hostName: string;
    courtName: string;
    courtAddress: string;
    timeStart: Date;
    timeEnd: Date;
    maxSlots: number;
    currentSlots: number;
    hoursUntilStart: number;
    linkUrl?: string;
    price?: any;
  }) {
    this.logger.log(
      `[Email] Sending insufficient slots notification to: ${data.hostEmail} for booking ${data.bookingId}`,
    );

    try {
      const remainingSlots = data.maxSlots - data.currentSlots;
      const subject = `⚠️ Nhắc nhở: Booking sắp diễn ra trong ${data.hoursUntilStart}h - Còn thiếu ${remainingSlots} người`;

      const html = this.generateBookingInsufficientSlotsTemplate({
        recipientName: data.hostName || 'bạn',
        courtName: data.courtName,
        courtAddress: data.courtAddress,
        timeStart: data.timeStart,
        timeEnd: data.timeEnd,
        maxSlots: data.maxSlots,
        currentSlots: data.currentSlots,
        remainingSlots: remainingSlots,
        hoursUntilStart: data.hoursUntilStart,
        linkUrl: data.linkUrl,
        price: data.price,
      });

      const logo = this.getLogoAttachment();
      const mailOptions = {
        from:
          this.configService.get<string>('SMTP_FROM') ||
          'noreply@badminton-booking.com',
        to: data.hostEmail,
        subject,
        html,
        attachments: logo ? [logo] : undefined,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `[Email] Insufficient slots email sent successfully to ${data.hostEmail}. MessageId: ${result.messageId}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `[Email] Failed to send insufficient slots email to ${data.hostEmail}:`,
        error,
      );
      throw error;
    }
  }
}
