import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EmailService } from './email.service';
import { OtpService } from './otp.service';
import { LoginService } from './login.service';
import { QueueService } from '../../shared/services/queue.service';
import { SendOtpDto } from '../dto/send-otp.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { LoginStep1Dto } from '../dto/login-step1.dto';
import { LoginStep2Dto } from '../dto/login-step2.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { PrismaService } from '../../../prisma.service';

@Controller('queue-consumer')
export class QueueConsumerController {
  constructor(
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
    private readonly loginService: LoginService,
    private readonly queueConsumerService: QueueService,
    private readonly prismaService: PrismaService,
  ) {}

  // Login Step 1: Send OTP to email
  @Public()
  @Post('login/step1')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  async loginStep1(@Body() loginStep1Dto: LoginStep1Dto) {
    return await this.otpService.sendLoginOtp(loginStep1Dto.email);
  }

  // Login Step 1.5: Verify OTP and get userId
  @Public()
  @Post('login/verify-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  async verifyLoginOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    const result = await this.emailService.verifyLoginOtp(verifyOtpDto.transactionId, verifyOtpDto.otp);
    return { 
      valid: result.valid,
      userId: result.userId,
      email: result.email,
      message: result.valid ? 'OTP verified successfully' : 'Invalid or expired OTP'
    };
  }

  // Login Step 2: Login with userId and password
  @Public()
  @Post('login/step2')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  async loginStep2(@Body() loginStep2Dto: LoginStep2Dto) {
    return await this.loginService.loginStep2(loginStep2Dto);
  }

  // OTP endpoints for signup flow
  @Public()
  @Post('otp/send')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return await this.otpService.sendOtp(sendOtpDto);
  }

  @Public()
  @Post('otp/verify')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    const result = await this.emailService.verifyOtp(verifyOtpDto.transactionId, verifyOtpDto.otp);
    return { 
      valid: result.valid,
      email: result.email,
      otpTokenId: result.otpTokenId, // ✅ Add otpTokenId to response
      message: result.valid ? 'OTP verified successfully' : 'Invalid or expired OTP'
    };
  }

  // Get failed messages (Admin only - add auth guard in production)
  @Get('failed-messages')
  async getFailedMessages(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('resolved') resolved: string = 'false',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const isResolved = resolved === 'true';

    const [messages, total] = await Promise.all([
      this.prismaService.common.failedQueueMessage.findMany({
        where: { isResolved },
        orderBy: { failedAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      this.prismaService.common.failedQueueMessage.count({
        where: { isResolved },
      }),
    ]);

    return {
      data: messages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  // Get single failed message details
  @Get('failed-messages/:id')
  async getFailedMessage(@Param('id') id: string) {
    const message = await this.prismaService.common.failedQueueMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return { error: 'Message not found' };
    }

    return { data: message };
  }

  // Retry a failed message
  @Post('failed-messages/:id/retry')
  async retryFailedMessage(@Param('id') id: string) {
    const failedMessage = await this.prismaService.common.failedQueueMessage.findUnique({
      where: { id },
    });

    if (!failedMessage) {
      return { error: 'Message not found' };
    }

    if (failedMessage.isResolved) {
      return { error: 'Message already resolved' };
    }

    try {
      // Republish message to queue
      await this.queueConsumerService.publishMessage({
        type: failedMessage.messageType,
        data: failedMessage.messageData,
        timestamp: new Date(),
      });

      // Mark as resolved
      await this.prismaService.common.failedQueueMessage.update({
        where: { id },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
          notes: 'Manually retried',
        },
      });

      return { 
        success: true,
        message: 'Message republished to queue successfully' 
      };
    } catch (error) {
      return { 
        error: 'Failed to retry message',
        details: error.message 
      };
    }
  }

  // Mark message as resolved without retry
  @Post('failed-messages/:id/resolve')
  async resolveFailedMessage(
    @Param('id') id: string,
    @Body('notes') notes?: string,
  ) {
    const failedMessage = await this.prismaService.common.failedQueueMessage.findUnique({
      where: { id },
    });

    if (!failedMessage) {
      return { error: 'Message not found' };
    }

    await this.prismaService.common.failedQueueMessage.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        notes: notes || 'Manually resolved',
      },
    });

    return { 
      success: true,
      message: 'Message marked as resolved' 
    };
  }

  // Get queue statistics
  @Get('stats')
  async getQueueStats() {
    const [totalFailed, unresolvedFailed, queueStats] = await Promise.all([
      this.prismaService.common.failedQueueMessage.count(),
      this.prismaService.common.failedQueueMessage.count({
        where: { isResolved: false },
      }),
      this.queueConsumerService.getQueueStats(),
    ]);

    return {
      queue: queueStats,
      failedMessages: {
        total: totalFailed,
        unresolved: unresolvedFailed,
        resolved: totalFailed - unresolvedFailed,
      },
    };
  }
}
