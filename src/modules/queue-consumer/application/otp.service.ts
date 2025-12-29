import { Injectable, Logger } from '@nestjs/common';
import { QueueService } from '../../shared/services/queue.service';
import { SendOtpDto } from '../dto/send-otp.dto';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly queueConsumerService: QueueService) {}

  async generateOtp(): Promise<string> {
    // Generate cryptographically secure 6-digit OTP
    const buffer = crypto.randomBytes(4);
    const number = buffer.readUInt32BE(0);
    const otp = (number % 900000) + 100000; // Ensure 6 digits
    return otp.toString();
  }

  async sendOtp(sendOtpDto: SendOtpDto): Promise<{ message: string; expiresIn: number; transactionId: string }> {
    const { email, userId } = sendOtpDto;
    
    // Generate OTP
    const otp = await this.generateOtp();
    
    // Generate unique transactionId
    const transactionId = this.generateTransactionId();
    
    // Set expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Publish message to queue (Consumer sẽ xử lý gửi email và lưu DB)
    await this.queueConsumerService.publishMessage({
      type: 'email_otp',
      data: {
        email,
        otp,
        userId: userId || null, // Allow null for new users
        transactionId,
        expiresAt,
        purpose: 'SIGNUP', // Default purpose for signup
      },
      timestamp: new Date(),
    });

    this.logger.log(`OTP queued for ${email} with transactionId: ${transactionId}`);

    return {
      message: 'OTP has been sent to your email',
      expiresIn: 600, // 10 minutes in seconds
      transactionId, // Return transactionId to FE
    };
  }

  private generateTransactionId(): string {
    // Generate UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async sendVerificationEmail(email: string, userId: string): Promise<{ message: string }> {
    // Generate verification token
    const verificationToken = this.generateVerificationToken();
    
    // Publish message to queue
    await this.queueConsumerService.publishMessage({
      type: 'email_verification',
      data: {
        email,
        verificationToken,
        userId,
      },
      timestamp: new Date(),
    });

    this.logger.log(`Verification email queued for ${email}`);

    return {
      message: 'Verification email has been sent',
    };
  }

  private generateVerificationToken(): string {
    // Generate a secure random token
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Login flow methods
  async sendLoginOtp(email: string): Promise<{ message: string; expiresIn: number; transactionId: string }> {
    // Generate OTP
    const otp = await this.generateOtp();
    
    // Generate unique transactionId
    const transactionId = this.generateTransactionId();
    
    // Set expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Publish message to queue
    await this.queueConsumerService.publishMessage({
      type: 'email_otp',
      data: {
        email,
        otp,
        transactionId,
        expiresAt,
        purpose: 'LOGIN', // Đánh dấu đây là OTP cho login
      },
      timestamp: new Date(),
    });

    this.logger.log(`Login OTP queued for ${email} with transactionId: ${transactionId}`);

    return {
      message: 'OTP has been sent to your email',
      expiresIn: 600, // 10 minutes in seconds
      transactionId, // Return transactionId to FE
    };
  }
}
