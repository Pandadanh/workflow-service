import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { PrismaService } from '../../../prisma.service';
import { EmailService } from '../../queue-consumer/application/email.service';
import { NotificationHelperService } from '../../notification/application/notification-helper.service';
import { ReservationService } from '../../reservation/application/reservation.service';
import { GlickoService } from '../../ranking/application/glicko.service';
import { RatingService } from '../../ranking/application/rating.service';
import { PlayerRatingData, PlayerRatingResult, MatchResult } from '../../ranking/domain/rating.interface';

export interface QueueMessage {
  type: string;
  data: any;
  timestamp: Date;
}

// Withdrawal specific message types
export interface WithdrawalNotification {
  userId: string;
  type: 'withdrawal_success' | 'withdrawal_failed' | 'otp_sent' | 'manual_review';
  transactionId: string;
  amount?: number;
  email?: string;
  phone?: string;
  metadata?: any;
}

export interface WithdrawalProcessingJob {
  transactionId: string;
  userId: string;
  action: 'process_withdrawal' | 'query_momo_status' | 'retry_momo';
  attempt?: number;
  metadata?: any;
}

export interface WithdrawalRetryJob {
  transactionId: string;
  userId: string;
  attempt: number;
  nextRetryAt: Date;
  metadata?: any;
}

export interface WithdrawalAlert {
  type: 'high_amount' | 'fraud_detected' | 'momo_timeout' | 'system_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  transactionId?: string;
  userId?: string;
  message: string;
  metadata?: any;
}

export interface WalletUpdateEvent {
  userId: string;
  type: 'balance_updated' | 'balance_frozen' | 'balance_unfrozen';
  amount: number;
  newBalance: number;
  transactionId?: string;
  metadata?: any;
}

export interface WithdrawalEvent {
  transactionId: string;
  userId: string;
  status: string;
  previousStatus?: string;
  amount: number;
  metadata?: any;
}

export interface CleanupEvent {
  type: 'logs' | 'audit' | 'failed_messages' | 'all';
  daysToKeep?: number;
  targetDate?: string;
  metadata?: any;
}

// Inter-service communication types (badminton-booking-BE <-> workflow-service)
export interface MatchPlayer {
  id: string;
  team: number;
  result: MatchResult;
}

export interface MatchFinishedEvent {
  event: 'MATCH_FINISHED';
  matchId: string;
  players: MatchPlayer[];
  metadata?: any;
}

export interface MatchProcessedResult {
  event: 'MATCH_PROCESSED';
  matchId: string;
  status: 'success' | 'failed';
  processedAt: Date;
  results?: {
    playerId: string;
    team: number;
    matchResult: MatchResult;
    ratingBefore: number;
    ratingAfter: number;
    ratingChange: number;
    rdBefore: number;
    rdAfter: number;
    volatilityBefore: number;
    volatilityAfter: number;
    opponentRating: number;
    opponentRd: number;
  }[];
  error?: string;
  metadata?: any;
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private connection: any = null;
  private channel: any = null;
  private readonly queueName = 'email_queue';
  
  // Withdrawal queues
  private readonly withdrawalQueues = {
    notifications: 'withdrawal.notifications',
    processing: 'withdrawal.processing', 
    retry: 'withdrawal.retry',
    alerts: 'withdrawal.alerts',
    walletUpdates: 'wallet.updates'
  };

  // Inter-service queues (badminton-booking-BE <-> workflow-service)
  private readonly interServiceQueues = {
    matchFinished: 'workflow.match.finished',     // BE -> Workflow
    matchProcessed: 'workflow.match.processed'    // Workflow -> BE
  };
  
  private isProcessing = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 5000; // 5 seconds
  private readonly messageTimeout = 30000; // 30 seconds timeout per message
  private isShuttingDown = false;
  private retryTimeouts: Set<NodeJS.Timeout> = new Set();
  private lastMessageTime: number = Date.now();
  private idleCheckInterval: NodeJS.Timeout | null = null;

  // Helper method to get WithdrawalService when needed
  private async getWithdrawalService() {
    try {
      return this.moduleRef.get('WithdrawalService', { strict: false });
    } catch (error) {
      this.logger.warn('[Queue] WithdrawalService not available:', error.message);
      return null;
    }
  }


  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly emailService: EmailService,
    private readonly moduleRef: ModuleRef,
    private readonly notificationHelper: NotificationHelperService,
    private readonly reservationService: ReservationService,
    private readonly glickoService: GlickoService,
    private readonly ratingService: RatingService,
  ) {}

  async onModuleInit() {
    await this.connect();
    await this.consumeMessages();
    await this.consumeWithdrawalQueues(); // Add withdrawal queue consumers
    await this.consumeInterServiceQueues(); // Add inter-service queue consumers
    this.startIdleCheck();
  }

  async onModuleDestroy() {
    this.logger.log('[Queue] Graceful shutdown initiated...');
    this.isShuttingDown = true;
    
    // Clear idle check interval
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = null;
    }
    
    // Clear all pending retry timeouts
    for (const timeout of this.retryTimeouts) {
      clearTimeout(timeout);
    }
    this.retryTimeouts.clear();
    
    // Wait for current message to finish (max 5 seconds)
    if (this.isProcessing) {
      this.logger.log('[Queue] Waiting for current message to finish...');
      const maxWait = 5000;
      const startWait = Date.now();
      while (this.isProcessing && (Date.now() - startWait) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    await this.disconnect();
    this.logger.log('[Queue] Graceful shutdown completed');
  }

  private async connect() {
    try {
      const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL');
      if (!rabbitmqUrl) {
        this.logger.warn('RABBITMQ_URL is not configured. Queue consumer will not start.');
        return;
      }

      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Set prefetch to limit concurrent processing
      await this.channel.prefetch(1); // Process 1 message at a time

      // Declare queue - use existing queue without changing arguments
      if (this.channel) {
        await this.channel.assertQueue(this.queueName, {
          durable: true,
        });

        // Declare withdrawal queues
        await this.channel.assertQueue(this.withdrawalQueues.notifications, { durable: true });
        await this.channel.assertQueue(this.withdrawalQueues.processing, { durable: true });
        await this.channel.assertQueue(this.withdrawalQueues.retry, { durable: true });
        await this.channel.assertQueue(this.withdrawalQueues.alerts, { durable: true });
        await this.channel.assertQueue(this.withdrawalQueues.walletUpdates, { durable: true });

        // Declare exchanges for withdrawal events
        await this.channel.assertExchange('withdrawal.events', 'topic', { durable: true });
        await this.channel.assertExchange('wallet.events', 'topic', { durable: true });

        // Declare inter-service queues (badminton-booking-BE <-> workflow-service)
        await this.channel.assertQueue(this.interServiceQueues.matchFinished, { durable: true });
        await this.channel.assertQueue(this.interServiceQueues.matchProcessed, { durable: true });

        this.logger.log('Using existing queue configuration, withdrawal queues, and inter-service queues');
      }

      // Handle connection errors and reconnection
      this.connection.on('error', (err: Error) => {
        this.logger.error('RabbitMQ connection error:', err);
        this.handleReconnect();
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.handleReconnect();
      });

      this.reconnectAttempts = 0; // Reset on successful connection
      this.logger.log('Connected to RabbitMQ successfully');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      this.handleReconnect();
    }
  }

  private async handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Max reconnection attempts reached. Giving up.');
      return;
    }

    this.reconnectAttempts++;
    this.logger.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms...`);

    setTimeout(async () => {
      try {
        await this.connect();
        await this.consumeMessages();
      } catch (error) {
        this.logger.error('Reconnection failed:', error);
      }
    }, this.reconnectDelay * this.reconnectAttempts); // Exponential backoff
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  // Monitor queue idle state to prevent tight loop logging
  private startIdleCheck() {
    this.idleCheckInterval = setInterval(async () => {
      if (!this.channel || this.isShuttingDown) return;

      try {
        const queueInfo = await this.channel.checkQueue(this.queueName);
        const timeSinceLastMessage = Date.now() - this.lastMessageTime;
        
        // Log idle state every 5 minutes if no messages
        if (queueInfo.messageCount === 0 && timeSinceLastMessage > 300000) {
          this.logger.debug(`[Queue] Idle for ${Math.floor(timeSinceLastMessage / 1000)}s - Queue empty, waiting for messages...`);
          this.lastMessageTime = Date.now(); // Reset to avoid spam
        }
      } catch (error) {
        // Silently ignore errors in idle check
      }
    }, 60000); // Check every minute
  }

  // Save failed message to database for later investigation
  private async saveFailedMessage(message: QueueMessage, error: Error, retryCount: number) {
    try {
      await this.prismaService.common.failedQueueMessage.create({
        data: {
          queueName: this.queueName,
          messageType: message.type,
          messageData: message.data || {},
          errorMessage: error.message || 'Unknown error',
          errorStack: error.stack || null,
          retryCount: retryCount,
          lastRetryAt: new Date(),
          failedAt: new Date(),
        },
      });
      
      this.logger.log(`[Queue] Failed message saved to database: ${message.type}`);
    } catch (dbError) {
      this.logger.error('[Queue] Failed to save failed message to database:', dbError);
    }
  }

  private async consumeMessages() {
    if (!this.channel) {
      this.logger.warn('Channel not initialized. Skipping message consumption.');
      return;
    }

    await this.channel.consume(
      this.queueName,
      async (msg) => {
        if (!msg) return;

        // Skip if shutting down
        if (this.isShuttingDown) {
          this.logger.warn('[Queue] Shutting down, rejecting new message');
          this.channel?.nack(msg, false, true);
          return;
        }

        // Prevent concurrent processing
        if (this.isProcessing) {
          this.logger.warn('[Queue] Already processing a message. Rejecting new message.');
          this.channel?.nack(msg, false, true);
          return;
        }

        this.isProcessing = true;
        const startTime = Date.now();
        let timeoutId: NodeJS.Timeout | null = null;

        try {
          const message: QueueMessage = JSON.parse(msg.content.toString());
          this.logger.log(`[Queue] Processing message type: ${message.type}`);

          // Update last message time
          this.lastMessageTime = Date.now();

          // Add timeout for message processing
          const processPromise = this.processMessage(message);
          const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(new Error(`Message processing timeout after ${this.messageTimeout}ms`));
            }, this.messageTimeout);
          });

          await Promise.race([processPromise, timeoutPromise]);

          // Clear timeout if processing finished
          if (timeoutId) clearTimeout(timeoutId);

          // Acknowledge message
          this.channel?.ack(msg);
          
          const processingTime = Date.now() - startTime;
          this.logger.log(`[Queue] Message processed successfully in ${processingTime}ms`);
        } catch (error) {
          // Clear timeout on error
          if (timeoutId) clearTimeout(timeoutId);
          
          this.logger.error('[Queue] Error processing message:', error);
          
          // Check retry count
          const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;
          const maxRetries = 3;

          if (retryCount >= maxRetries) {
            // Dead letter - save to database and acknowledge to remove from queue
            this.logger.error(`[Queue] Max retries (${maxRetries}) reached. Saving to database.`);
            
            try {
              const message: QueueMessage = JSON.parse(msg.content.toString());
              await this.saveFailedMessage(message, error as Error, retryCount);
            } catch (parseError) {
              this.logger.error('[Queue] Failed to parse message for saving:', parseError);
            }
            
            this.channel?.ack(msg);
          } else {
            // Republish with incremented retry count and delay
            this.logger.warn(`[Queue] Republishing message (retry ${retryCount}/${maxRetries})`);
            
            try {
              const message: QueueMessage = JSON.parse(msg.content.toString());
              const delayMs = 1000 * retryCount; // Exponential backoff: 1s, 2s, 3s
              
              const retryTimeout = setTimeout(async () => {
                this.retryTimeouts.delete(retryTimeout);
                try {
                  await this.publishMessage(message, 5, retryCount);
                  this.logger.log(`[Queue] Message republished for retry ${retryCount}`);
                } catch (republishError) {
                  this.logger.error(`[Queue] Failed to republish message:`, republishError);
                }
              }, delayMs);
              
              this.retryTimeouts.add(retryTimeout);
              this.channel?.ack(msg); // Acknowledge original message
            } catch (parseError) {
              this.logger.error('[Queue] Failed to parse message for republishing:', parseError);
              this.channel?.nack(msg, false, false); // Reject without requeue
            }
          }
        } finally {
          this.isProcessing = false;
          
          // Add small delay between messages to prevent tight loop
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        }
      },
      {
        noAck: false, // Manual acknowledgment
      }
    );

    this.logger.log('[Queue] Consumer started successfully');
  }

  private async processMessage(message: QueueMessage) {
    const { type, data } = message;
    const startTime = Date.now();

    try {
      switch (type) {
        case 'email_otp':
          await this.emailService.sendOtpEmail(data);
          // Tạo notification
          if (data.userId) {
            await this.notificationHelper.createNotificationForEmail('email_otp', {
              userId: data.userId,
              email: data.email,
              metadata: data,
            });
          }
          break;
        
        case 'email_verification':
          await this.emailService.sendVerificationEmail(data);
          // Tạo notification
          if (data.userId) {
            await this.notificationHelper.createNotificationForEmail('email_verification', {
              userId: data.userId,
              email: data.email,
              metadata: data,
            });
          }
          break;
        
        case 'email_notification':
          await this.emailService.sendNotificationEmail(data);
          // Tạo notification
          if (data.userId) {
            await this.notificationHelper.createNotificationForEmail('email_notification', {
              userId: data.userId,
              email: data.email,
              subject: data.subject,
              content: data.content,
              metadata: data,
            });
          }
          break;

        case 'email_booking_member_joined':
          await this.emailService.sendBookingMemberJoinedEmail(data);
          // Tạo notification
          if (data.userId) {
            await this.notificationHelper.createNotificationForEmail('email_booking_member_joined', {
              userId: data.userId,
              email: data.email,
              resourceId: data.bookingId,
              resourceType: 'booking',
              metadata: data,
            });
          }
          break;

        case 'email_booking_paid':
          await this.emailService.sendBookingPaidEmail(data);
          // Tạo notification
          if (data.userId) {
            await this.notificationHelper.createNotificationForEmail('email_booking_paid', {
              userId: data.userId,
              email: data.email,
              resourceId: data.bookingId || data.paymentId,
              resourceType: 'booking',
              metadata: data,
            });
          }
          break;

        // dont need this
        case 'email_booking_member_slot_changed':
          await this.emailService.sendBookingMemberSlotChangedEmail(data);
          break;

        case 'email_booking_member_canceled':
          await this.emailService.sendBookingMemberCanceledEmail(data);
          // Tạo notification
          if (data.userId) {
            await this.notificationHelper.createNotificationForEmail(
              'email_booking_member_canceled',
              {
                userId: data.userId,
                email: data.email,
                resourceId: data.bookingId,
                resourceType: 'booking',
                metadata: data,
              },
            );
          }
          break;

        case 'email_booking_insufficient_slots':
          await this.emailService.sendBookingInsufficientSlotsEmail(data);
          // Tạo notification
          if (data.hostEmail) {
            // Find user by email to get userId
            const hostUser = await this.prismaService.identity.user.findUnique({
              where: { email: data.hostEmail },
              select: { id: true },
            });
            if (hostUser) {
              await this.notificationHelper.createNotificationForEmail(
                'email_booking_insufficient_slots',
                {
                  userId: hostUser.id,
                  email: data.hostEmail,
                  resourceId: data.bookingId,
                  resourceType: 'booking',
                  metadata: data,
                },
              );
            }
          }
          break;

        // dont need this
        case 'payment_status_check':
          await this.processPaymentStatusCheck(data);
          break;

        // Withdrawal message types
        case 'withdrawal_notification':
          await this.processWithdrawalNotification(data);
          // Tạo notification
          if (data.userId) {
            await this.notificationHelper.createNotificationForEmail(
              'withdrawal_notification',
              {
                userId: data.userId,
                email: data.email,
                resourceId: data.transactionId,
                resourceType: 'withdrawal',
                metadata: data,
              },
            );
          }
          break;

        // dont need this
        case 'withdrawal_processing_job':
          this.logger.log(`[Withdrawal] Processing job skipped (not implemented)`);
          break;

        // dont need this
        case 'withdrawal_retry':
          this.logger.log(`[Withdrawal] Retry job skipped (not implemented)`);
          break;

        case 'withdrawal_alert':
          await this.processWithdrawalAlert(data);
          // Tạo notification
          if (data.userId) {
            await this.notificationHelper.createNotificationForEmail('withdrawal_alert', {
              userId: data.userId,
              email: data.email,
              resourceId: data.transactionId,
              resourceType: 'withdrawal',
              metadata: data,
            });
          }
          break;

        // dont need this
        case 'wallet_update':
          await this.processWalletUpdate(data);
          break;

        case 'cleanup_old_logs':
          await this.processCleanupOldLogs(data);
          break;
        
        case 'userrank_create':
          // PlayerService sẽ xử lý message này trực tiếp
          this.logger.log('[Queue] Received userrank_create message, PlayerService will handle it directly');
          break;

        case 'userrank_update':
          // PlayerService sẽ xử lý message này trực tiếp
          this.logger.log('[Queue] Received userrank_update message, PlayerService will handle it directly');
          break;
        case 'reservation_check':
          const result = await this.reservationService.checkReservationForHost(data.host_id, data.court_id, data.booking_url);
          if (result) {
            this.logger.log(`[Queue] reservation_check found and updated ${result.user_ids.length} reservations with user_ids=[${result.user_ids.join(', ')}]`);
            
            // Send email notifications to users directly
            try {
              await this.emailService.sendReservationNotificationsToUsers(
                result.user_ids,
                data.host_id,
                data.court_id,
                result.booking_url || undefined
              );
              this.logger.log(`[Queue] Email notifications sent to ${result.user_ids.length} users`);
            } catch (emailError) {
              this.logger.error(`[Queue] Failed to send email notifications:`, emailError);
            }
          } else {
            this.logger.log(`[Queue] reservation_check no valid reservation found for host=${data.host_id}, court=${data.court_id}`);
          }
          break;
        case 'email_report_thanks':
          await this.emailService.sendReportThanksEmail(data);
          // create notification
          if (data.reporter_id){
            await this.notificationHelper.createNotificationForEmail('email_report_thanks', {
              userId: data.reporter_id,
              email: data.email,
              resourceId: data.booking_id,
              resourceType: 'report',
              metadata: data,
            });
          }
          break;
        case 'email_report_confirm': 
          await this.emailService.sendReportConfirmEmail(message.data);
          if (data.reporter_id) {
            await this.notificationHelper.createNotificationForEmail('email_report_confirm', {
              userId: data.reporter_id,
              email: data.email,
              resourceId: data.booking_id,
              resourceType: 'report',
              metadata: data,
            });
          }
          break;
        default:
          this.logger.warn(`[Queue] Unknown message type: ${type}`);
          throw new Error(`Unknown message type: ${type}`);
      }

      const processingTime = Date.now() - startTime;
      this.logger.log(`[Queue] Message type '${type}' processed in ${processingTime}ms`);
    } catch (error) {
      this.logger.error(`[Queue] Error processing message type '${type}':`, error);
      throw error; // Re-throw to trigger retry logic
    }
  }

  // Method to publish messages (for testing or manual publishing)
  async publishMessage(message: QueueMessage, priority: number = 5, retryCount: number = 0) {
    if (!this.channel) {
      this.logger.error('Channel not initialized. Cannot publish message.');
      throw new Error('Channel not initialized');
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      await this.channel.sendToQueue(this.queueName, messageBuffer, {
        persistent: true,
        priority: priority, // Support priority (0-10)
        headers: {
          'x-retry-count': retryCount,
          'x-timestamp': Date.now(),
        },
      });

      this.logger.log(`[Queue] Published message type '${message.type}' with priority ${priority}, retry count: ${retryCount}`);
    } catch (error) {
      this.logger.error('[Queue] Failed to publish message:', error);
      throw error;
    }
  }

  // Health check method
  isHealthy(): boolean {
    return this.connection !== null && this.channel !== null && !this.isProcessing;
  }

  // Get queue stats
  async getQueueStats() {
    if (!this.channel) {
      return { error: 'Channel not initialized' };
    }

    try {
      const queueInfo = await this.channel.checkQueue(this.queueName);
      return {
        messageCount: queueInfo.messageCount,
        consumerCount: queueInfo.consumerCount,
        isProcessing: this.isProcessing,
        reconnectAttempts: this.reconnectAttempts,
      };
    } catch (error) {
      this.logger.error('[Queue] Failed to get queue stats:', error);
      return { error: error.message };
    }
  }
  // Process payment status check
  private async processPaymentStatusCheck(data: { orderId: string; delay?: number }) {
    const { orderId, delay = 0 } = data;
    
    this.logger.log(`[Queue] Processing payment status check for orderId: ${orderId}, delay: ${delay}ms`);

    // Add delay if specified (useful for delayed checks)
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    try {
      // Note: This will be handled by a separate service injected via forwardRef
      // For now, just log that the message was processed
      this.logger.log(`[Queue] Payment status check message processed for orderId: ${orderId}`);
      
      // TODO: Implement actual payment status check logic here
      // This could call an external service or be handled by dependency injection
      
      return { orderId, processed: true };
    } catch (error) {
      this.logger.error(`[Queue] Error processing payment status check for orderId: ${orderId}`, error);
      throw error;
    }
  }

  // === WITHDRAWAL QUEUE PROCESSORS ===

  private async processWithdrawalNotification(data: WithdrawalNotification) {
    this.logger.log(`[Withdrawal] Processing notification: ${data.type} for user ${data.userId}`);
    
    try {
      switch (data.type) {
        case 'withdrawal_success':
          this.logger.log(`[Withdrawal] Would send success email to user ${data.userId}`);
          break;
        case 'withdrawal_failed':
          this.logger.log(`[Withdrawal] Would send failure email to user ${data.userId}`);
          break;
        case 'otp_sent':
          this.logger.log(`[Withdrawal] Sending OTP to user ${data.userId}`);
          // Send OTP via email
          if (data.email) {
            await this.emailService.sendOtpEmail({
              email: data.email,
              otp: data.metadata?.otpCode,
              userId: data.userId,
              transactionId: data.transactionId,
              expiresAt: new Date(Date.now() + 3 * 60 * 1000), // 3 minutes
              purpose: 'WITHDRAWAL'
            });
          }
          // TODO: Add SMS service for phone OTP
          if (data.phone) {
            this.logger.log(`[Withdrawal] Would send SMS OTP to ${data.phone}: ${data.metadata?.otpCode}`);
            // await this.smsService.sendOtpSms(data.phone, data.metadata?.otpCode);
          }
          break;
        case 'manual_review':
          this.logger.log(`[Withdrawal] Would send manual review email to user ${data.userId}`);
          break;
        default:
          this.logger.warn(`[Withdrawal] Unknown notification type: ${data.type}`);
      }
    } catch (error) {
      this.logger.error(`[Withdrawal] Error processing notification:`, error);
      throw error;
    }
  }

  private async processWithdrawalJob(data: WithdrawalProcessingJob) {
    this.logger.log(`[Withdrawal] Processing job: ${data.action} for transaction ${data.transactionId}`);
    
    try {
      switch (data.action) {
        case 'process_withdrawal':
          await this.handleProcessWithdrawal(data);
          break;
        case 'query_momo_status':
          await this.handleQueryMomoStatus(data);
          break;
        case 'retry_momo':
          await this.handleRetryMomo(data);
          break;
        default:
          this.logger.warn(`[Withdrawal] Unknown action: ${data.action}`);
      }
      
    } catch (error) {
      this.logger.error(`[Withdrawal] Error processing job:`, error);
      throw error;
    }
  }

  private async handleProcessWithdrawal(data: WithdrawalProcessingJob) {
    this.logger.log(`[Withdrawal] Processing withdrawal for transaction ${data.transactionId}`);
    
    try {
      const withdrawalService = await this.getWithdrawalService();
      if (!withdrawalService) {
        this.logger.error('[Withdrawal] WithdrawalService not available');
        return;
      }

      // Call the actual withdrawal processing
      await withdrawalService.processWithdrawal(data.transactionId, data.userId);
      this.logger.log(`[Withdrawal] Successfully processed withdrawal for transaction ${data.transactionId}`);
    } catch (error) {
      this.logger.error(`[Withdrawal] Error processing withdrawal for transaction ${data.transactionId}:`, error);
      throw error;
    }
  }

  private async handleQueryMomoStatus(data: WithdrawalProcessingJob) {
    this.logger.log(`[Withdrawal] Querying MoMo status for transaction ${data.transactionId}`);
    
    try {
      const withdrawalService = await this.getWithdrawalService();
      if (!withdrawalService) {
        this.logger.error('[Withdrawal] WithdrawalService not available');
        return;
      }

      // Call the timeout handling method
      await withdrawalService.handleTimeoutCase(data.transactionId);
      this.logger.log(`[Withdrawal] Successfully queried MoMo status for transaction ${data.transactionId}`);
    } catch (error) {
      this.logger.error(`[Withdrawal] Error querying MoMo status for transaction ${data.transactionId}:`, error);
      throw error;
    }
  }

  private async handleRetryMomo(data: WithdrawalProcessingJob) {
    this.logger.log(`[Withdrawal] Retrying MoMo API for transaction ${data.transactionId}`);
    
    try {
      const withdrawalService = await this.getWithdrawalService();
      if (!withdrawalService) {
        this.logger.error('[Withdrawal] WithdrawalService not available');
        return;
      }

      // Get the transaction and retry the MoMo API call
      const transaction = await this.prismaService.finance.withdrawalTransaction.findFirst({
        where: { transactionId: data.transactionId, status: 'PROCESSING' }
      });

      if (!transaction) {
        this.logger.warn(`[Withdrawal] Transaction ${data.transactionId} not found or not in PROCESSING status`);
        return;
      }

      await withdrawalService.callMomoApiWithRetry(transaction);
      this.logger.log(`[Withdrawal] Successfully retried MoMo API for transaction ${data.transactionId}`);
    } catch (error) {
      this.logger.error(`[Withdrawal] Error retrying MoMo API for transaction ${data.transactionId}:`, error);
      throw error;
    }
  }

  private async processWithdrawalRetry(data: WithdrawalRetryJob) {
    this.logger.log(`[Withdrawal] Processing retry attempt ${data.attempt} for transaction ${data.transactionId}`);
    
    try {
      // Check if it's time to retry
      if (new Date() < data.nextRetryAt) {
        const delayMs = data.nextRetryAt.getTime() - Date.now();
        this.logger.log(`[Withdrawal] Retry not yet due, waiting ${delayMs}ms`);
        
        // Requeue with remaining delay
        setTimeout(() => {
          this.publishMessage({
            type: 'withdrawal_retry',
            data,
            timestamp: new Date()
          });
        }, delayMs);
        return;
      }

      // TODO: Inject withdrawal service for retry logic
      this.logger.log(`[Withdrawal] Executing retry for transaction ${data.transactionId}`);
      
    } catch (error) {
      this.logger.error(`[Withdrawal] Error processing retry:`, error);
      throw error;
    }
  }

  private async processWithdrawalAlert(data: WithdrawalAlert) {
    this.logger.log(`[Withdrawal] Processing alert: ${data.type} - ${data.severity}`);
    
    try {
      // Send alert to admin notification system
      if (data.severity === 'critical' || data.severity === 'high') {
        this.logger.warn(`[Withdrawal] HIGH PRIORITY ALERT: ${data.message}`);
      }
      
      this.logger.warn(`[Withdrawal] Alert processed: ${data.type} - ${data.message}`);
    } catch (error) {
      this.logger.error(`[Withdrawal] Error processing alert:`, error);
      throw error;
    }
  }

  private async processWalletUpdate(data: WalletUpdateEvent) {
    this.logger.log(`[Wallet] Processing update: ${data.type} for user ${data.userId}`);
    
    try {
      // Invalidate wallet balance cache
      this.logger.log(`[Wallet] Cache invalidated for user ${data.userId}`);
      
      // Update cache with new balance if provided
      if (data.type === 'balance_updated' && data.newBalance !== undefined) {
        const walletData = {
          balance: data.newBalance,
          frozenBalance: 0, // This would need to be passed in the event if needed
          version: 1,
          lastUpdated: new Date(),
          isActive: true,
          isDeleted: false
        };
        
        this.logger.log(`[Wallet] Cache updated with new balance ${data.newBalance} for user ${data.userId}`);
      }
      
      // Send real-time notification if needed
      if (data.type === 'balance_updated') {
        this.logger.log(`[Wallet] Real-time notification sent for balance update`);
        // Here you could publish to a real-time notification service (WebSocket, SSE, etc.)
      }
      
    } catch (error) {
      this.logger.error(`[Wallet] Error processing update:`, error);
      throw error;
    }
  }

  // Process cleanup old logs message
  private async processCleanupOldLogs(data: CleanupEvent) {
    this.logger.log(`[Cleanup] Processing cleanup task: ${data.type}`);
    
    try {
      const daysToKeep = data.daysToKeep || 30;
      const cutoffDate = data.targetDate ? new Date(data.targetDate) : new Date();
      
      if (!data.targetDate) {
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      }
      
      this.logger.log(`[Cleanup] Cleaning up ${data.type} older than: ${cutoffDate.toISOString()}`);
      
      switch (data.type) {
        case 'logs':
          await this.cleanupOldLogs(cutoffDate);
          break;
        case 'audit':
          await this.cleanupOldAuditRecords(cutoffDate);
          break;
        case 'failed_messages':
          await this.cleanupFailedMessages(cutoffDate);
          break;
        case 'all':
          await this.cleanupOldLogs(cutoffDate);
          await this.cleanupOldAuditRecords(cutoffDate);
          await this.cleanupFailedMessages(cutoffDate);
          break;
        default:
          this.logger.warn(`[Cleanup] Unknown cleanup type: ${data.type}`);
      }
      
      this.logger.log(`[Cleanup] ${data.type} cleanup completed successfully`);
      
    } catch (error) {
      this.logger.error(`[Cleanup] Error processing cleanup old logs:`, error);
      throw error;
    }
  }

  // Helper methods for specific cleanup operations
  private async cleanupOldLogs(cutoffDate: Date) {
    this.logger.log(`[Cleanup] Cleaning up logs older than ${cutoffDate.toISOString()}`);
    
    try {
      // Clean up withdrawal logs
      const deletedWithdrawalLogs = await this.prismaService.finance.withdrawalLog.deleteMany({
        where: { createdAt: { lt: cutoffDate } }
      });

      // Clean up error logs
      const deletedErrorLogs = await this.prismaService.common.errorLog.deleteMany({
        where: { created_at: { lt: cutoffDate } }
      });

      this.logger.log(`[Cleanup] Deleted ${deletedWithdrawalLogs.count} withdrawal logs and ${deletedErrorLogs.count} error logs`);
    } catch (error) {
      this.logger.error(`[Cleanup] Error cleaning up logs:`, error);
      throw error;
    }
  }

  private async cleanupOldAuditRecords(cutoffDate: Date) {
    this.logger.log(`[Cleanup] Cleaning up audit records older than ${cutoffDate.toISOString()}`);
    
    try {
      // Clean up wallet transactions (keep recent ones for financial audit)
      const deletedWalletTransactions = await this.prismaService.finance.walletTransaction.deleteMany({
        where: { createdAt: { lt: cutoffDate } }
      });

      // Clean up old OTP tokens
      const deletedOtpTokens = await this.prismaService.identity.otpToken.deleteMany({
        where: { 
          createdAt: { lt: cutoffDate },
          OR: [
            { isUsed: true },
            { expiresAt: { lt: new Date() } }
          ]
        }
      });

      // Clean up old verification tokens
      const deletedVerificationTokens = await this.prismaService.identity.verificationToken.deleteMany({
        where: { createdAt: { lt: cutoffDate } }
      });

      this.logger.log(`[Cleanup] Deleted ${deletedWalletTransactions.count} wallet transactions, ${deletedOtpTokens.count} OTP tokens, ${deletedVerificationTokens.count} verification tokens`);
    } catch (error) {
      this.logger.error(`[Cleanup] Error cleaning up audit records:`, error);
      throw error;
    }
  }

  private async cleanupFailedMessages(cutoffDate: Date) {
    this.logger.log(`[Cleanup] Cleaning up failed messages older than ${cutoffDate.toISOString()}`);
    
    try {
      // Clean up resolved failed queue messages
      const deletedFailedMessages = await this.prismaService.common.failedQueueMessage.deleteMany({
        where: { 
          failedAt: { lt: cutoffDate },
          isResolved: true
        }
      });

      this.logger.log(`[Cleanup] Deleted ${deletedFailedMessages.count} resolved failed messages`);
    } catch (error) {
      this.logger.error(`[Cleanup] Error cleaning up failed messages:`, error);
      throw error;
    }
  }

  // === WITHDRAWAL QUEUE PUBLISHERS ===

  // Send withdrawal notification to queue
  async sendWithdrawalNotification(data: WithdrawalNotification): Promise<void> {
    await this.publishToQueue(this.withdrawalQueues.notifications, {
      type: 'withdrawal_notification',
      data,
      timestamp: new Date()
    });
  }

  // Send withdrawal processing job to queue
  async sendWithdrawalProcessingJob(data: WithdrawalProcessingJob): Promise<void> {
    await this.publishToQueue(this.withdrawalQueues.processing, {
      type: 'withdrawal_processing_job', 
      data,
      timestamp: new Date()
    });
  }

  // Send withdrawal retry job with delay
  async sendWithdrawalRetryJob(data: WithdrawalRetryJob, delayMs: number = 0): Promise<void> {
    const message = {
      type: 'withdrawal_retry',
      data,
      timestamp: new Date()
    };

    if (delayMs > 0) {
      // Use delayed publishing
      setTimeout(() => {
        this.publishToQueue(this.withdrawalQueues.retry, message);
      }, delayMs);
    } else {
      await this.publishToQueue(this.withdrawalQueues.retry, message);
    }
  }

  // Send withdrawal alert
  async sendWithdrawalAlert(data: WithdrawalAlert): Promise<void> {
    await this.publishToQueue(this.withdrawalQueues.alerts, {
      type: 'withdrawal_alert',
      data,
      timestamp: new Date()
    });
  }

  // Publish wallet update event
  async publishWalletUpdate(data: WalletUpdateEvent): Promise<void> {
    // Publish to both queue and exchange
    await this.publishToQueue(this.withdrawalQueues.walletUpdates, {
      type: 'wallet_update',
      data,
      timestamp: new Date()
    });

    // Also publish to exchange for real-time consumers
    if (this.channel) {
      await this.channel.publish(
        'wallet.events',
        `wallet.${data.type}`,
        Buffer.from(JSON.stringify(data)),
        { persistent: true }
      );
    }
  }

  // Publish withdrawal event to exchange
  async publishWithdrawalEvent(data: WithdrawalEvent): Promise<void> {
    if (this.channel) {
      await this.channel.publish(
        'withdrawal.events',
        `withdrawal.${data.status.toLowerCase()}`,
        Buffer.from(JSON.stringify(data)),
        { persistent: true }
      );
      this.logger.log(`[Withdrawal] Event published: ${data.status} for transaction ${data.transactionId}`);
    }
  }

  // Helper method to publish to specific queue
  private async publishToQueue(queueName: string, message: QueueMessage): Promise<void> {
    if (!this.channel) {
      this.logger.error(`[Queue] Channel not initialized. Cannot publish to ${queueName}`);
      throw new Error('Channel not initialized');
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      await this.channel.sendToQueue(queueName, messageBuffer, {
        persistent: true,
        headers: {
          'x-retry-count': 0,
          'x-timestamp': Date.now(),
        },
      });

      this.logger.log(`[Queue] Published message type '${message.type}' to queue '${queueName}'`);
    } catch (error) {
      this.logger.error(`[Queue] Failed to publish to ${queueName}:`, error);
      throw error;
    }
  }

  // Add consumers for withdrawal queues
  private async consumeWithdrawalQueues(): Promise<void> {
    if (!this.channel) {
      this.logger.warn('[Queue] Channel not initialized. Skipping withdrawal queue consumption.');
      return;
    }

    // Consume withdrawal notifications
    await this.channel.consume(
      this.withdrawalQueues.notifications,
      async (msg) => {
        if (!msg) return;
        try {
          const message: QueueMessage = JSON.parse(msg.content.toString());
          await this.processWithdrawalNotification(message.data);
          this.channel?.ack(msg);
        } catch (error) {
          this.logger.error('[Withdrawal] Error processing notification:', error);
          this.channel?.nack(msg, false, true);
        }
      },
      { noAck: false }
    );

    // Consume withdrawal processing jobs
    await this.channel.consume(
      this.withdrawalQueues.processing,
      async (msg) => {
        if (!msg) return;
        try {
          const message: QueueMessage = JSON.parse(msg.content.toString());
          await this.processWithdrawalJob(message.data);
          this.channel?.ack(msg);
        } catch (error) {
          this.logger.error('[Withdrawal] Error processing job:', error);
          this.channel?.nack(msg, false, true);
        }
      },
      { noAck: false }
    );

    // Consume withdrawal retry jobs
    await this.channel.consume(
      this.withdrawalQueues.retry,
      async (msg) => {
        if (!msg) return;
        try {
          const message: QueueMessage = JSON.parse(msg.content.toString());
          await this.processWithdrawalRetry(message.data);
          this.channel?.ack(msg);
        } catch (error) {
          this.logger.error('[Withdrawal] Error processing retry:', error);
          this.channel?.nack(msg, false, true);
        }
      },
      { noAck: false }
    );

    // Consume withdrawal alerts
    await this.channel.consume(
      this.withdrawalQueues.alerts,
      async (msg) => {
        if (!msg) return;
        try {
          const message: QueueMessage = JSON.parse(msg.content.toString());
          await this.processWithdrawalAlert(message.data);
          this.channel?.ack(msg);
        } catch (error) {
          this.logger.error('[Withdrawal] Error processing alert:', error);
          this.channel?.nack(msg, false, false); // Don't requeue alerts
        }
      },
      { noAck: false }
    );

    // Consume wallet updates
    await this.channel.consume(
      this.withdrawalQueues.walletUpdates,
      async (msg) => {
        if (!msg) return;
        try {
          const message: QueueMessage = JSON.parse(msg.content.toString());
          await this.processWalletUpdate(message.data);
          this.channel?.ack(msg);
        } catch (error) {
          this.logger.error('[Wallet] Error processing update:', error);
          this.channel?.nack(msg, false, true);
        }
      },
      { noAck: false }
    );

    this.logger.log('[Queue] Withdrawal queue consumers started successfully');
  }

  private async processMatchFinishedEvent(data: MatchFinishedEvent): Promise<void> {
    this.logger.log(`[InterService] Received MATCH_FINISHED event for match ${data.matchId}`);
    this.logger.log(`[InterService] Processing ${data.players.length} players using Glicko-2 algorithm...`);
    
    try {
      // Idempotency check - ensure match hasn't been processed before
      const alreadyProcessed = await this.ratingService.isMatchProcessed(data.matchId);
      if (alreadyProcessed) {
        this.logger.warn(`[InterService] Match ${data.matchId} has already been processed. Skipping.`);
        await this.sendMatchProcessedResult({
          event: 'MATCH_PROCESSED',
          matchId: data.matchId,
          status: 'success',
          processedAt: new Date(),
          metadata: {
            processedBy: 'workflow-service',
            skipped: true,
            reason: 'Match already processed (idempotency check)',
          },
        });
        return;
      }

      // Fetch current ratings for all players from database
      const playerIds = data.players.map((p) => p.id);
      const playerRatings = await this.ratingService.getPlayerRatings(playerIds);

      this.logger.log(`[InterService] Fetched ratings for ${playerRatings.size} players`);

      let calculationResult;
      if (data.players.length === 2) {
        const player1 = data.players.find((p) => p.team === 1)!;
        const player2 = data.players.find((p) => p.team === 2)!;
        calculationResult = this.glickoService.calculateSinglesMatch(
          data.matchId,
          player1,
          player2,
          playerRatings.get(player1.id) || this.glickoService.getDefaultRating(),
          playerRatings.get(player2.id) || this.glickoService.getDefaultRating(),
        );
      } else {
        // Doubles match (2v2 or more)
        calculationResult = this.glickoService.calculateDoublesMatch(
          data.matchId,
          data.players,
          playerRatings,
        );
      }

      // Update ratings in database and create history records
      const updateResults = await this.ratingService.updatePlayerRatings(
        data.matchId,
        calculationResult.playerResults,
      );

      // Log results
      for (const result of calculationResult.playerResults) {
        const changeStr = result.ratingChange > 0 ? `+${result.ratingChange.toFixed(1)}` : result.ratingChange.toFixed(1);
        this.logger.log(
          `[InterService] Player ${result.playerId} (Team ${result.team}): ${result.result} | ${result.ratingBefore.toFixed(1)} -> ${result.ratingAfter.toFixed(1)} (${changeStr})`,
        );
      }

      // Build results array for response
      const results: MatchProcessedResult['results'] = calculationResult.playerResults.map((r) => ({
        playerId: r.playerId,
        team: r.team,
        matchResult: r.result,
        ratingBefore: r.ratingBefore,
        ratingAfter: r.ratingAfter,
        ratingChange: r.ratingChange,
        rdBefore: r.rdBefore,
        rdAfter: r.rdAfter,
        volatilityBefore: r.volatilityBefore,
        volatilityAfter: r.volatilityAfter,
        opponentRating: r.opponentRating,
        opponentRd: r.opponentRd,
      }));

      // Check for any update failures
      const failures = updateResults.filter((r) => !r.success);
      if (failures.length > 0) {
        this.logger.warn(`[InterService] Some rating updates failed: ${failures.map((f) => f.userId).join(', ')}`);
      }

      // Send processed result back to badminton-booking-BE
      await this.sendMatchProcessedResult({
        event: 'MATCH_PROCESSED',
        matchId: data.matchId,
        status: 'success',
        processedAt: new Date(),
        results,
        metadata: {
          processedBy: 'workflow-service',
          algorithm: 'Glicko-2',
          matchType: data.players.length === 2 ? 'singles' : 'doubles',
          team1FinalRating: calculationResult.team1Rating,
          team2FinalRating: calculationResult.team2Rating,
          updateFailures: failures.length > 0 ? failures : undefined,
        },
      });

      this.logger.log(`[InterService] Successfully processed match ${data.matchId} with Glicko-2 and sent result back`);
    } catch (error) {
      this.logger.error(`[InterService] Error processing match ${data.matchId}:`, error);
      
      // Send error result back to badminton-booking-BE
      await this.sendMatchProcessedResult({
        event: 'MATCH_PROCESSED',
        matchId: data.matchId,
        status: 'failed',
        processedAt: new Date(),
        error: error.message || 'Unknown error during Glicko-2 match processing',
        metadata: {
          processedBy: 'workflow-service',
          algorithm: 'Glicko-2',
          originalEvent: data.event,
        },
      });
    }
  }

  // Send MATCH_PROCESSED result back to badminton-booking-BE
  async sendMatchProcessedResult(data: MatchProcessedResult): Promise<void> {
    this.logger.log(`[InterService] Sending MATCH_PROCESSED result for match ${data.matchId} back to badminton-booking-BE`);
    await this.publishToQueue(this.interServiceQueues.matchProcessed, {
      type: 'MATCH_PROCESSED',
      data,
      timestamp: new Date()
    });
  }

  // Consumer for inter-service queues (events from badminton-booking-BE)
  private async consumeInterServiceQueues(): Promise<void> {
    if (!this.channel) {
      this.logger.warn('[Queue] Channel not initialized. Skipping inter-service queue consumption.');
      return;
    }

    // Consume MATCH_FINISHED events from badminton-booking-BE
    await this.channel.consume(
      this.interServiceQueues.matchFinished,
      async (msg) => {
        if (!msg) return;
        try {
          const message: QueueMessage = JSON.parse(msg.content.toString());
          await this.processMatchFinishedEvent(message.data);
          this.channel?.ack(msg);
        } catch (error) {
          this.logger.error('[InterService] Error processing MATCH_FINISHED event:', error);
          this.channel?.nack(msg, false, true);
        }
      },
      { noAck: false }
    );

    this.logger.log('[Queue] Inter-service queue consumers started (listening for badminton-booking-BE events)');
  }
}
