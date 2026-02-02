import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IRewardRepository } from '../domain/reward.repository';
import {
  RewardActionType,
  RewardPointEventInput,
  RewardPointResult,
  getRewardPoints,
  isVariableRewardAction,
  generateIdempotencyKey,
  UserRewardBalanceData,
  PaginatedRewardHistoryResult,
  PaginatedRewardLeaderboardResult,
  CheckInStatus,
} from '../domain/reward.interface';

@Injectable()
export class RewardService {
  private readonly logger = new Logger(RewardService.name);

  constructor(
    @Inject('IRewardRepository')
    private readonly rewardRepository: IRewardRepository,
  ) {}


  async processRewardEvent(input: RewardPointEventInput): Promise<RewardPointResult> {
    this.logger.log(`[Reward] Processing ${input.action} event for user ${input.userId}`);

    const idempotencyKey = generateIdempotencyKey(
      input.userId,
      input.action,
      input.referenceId,
    );

    // Check for duplicate
    const existingTransaction = await this.rewardRepository.checkIdempotencyKey(idempotencyKey);
    if (existingTransaction) {
      this.logger.log(`[Reward] Duplicate detected for ${input.action}, returning existing result`);
      return {
        userId: input.userId,
        action: input.action,
        success: true,
        points: existingTransaction.points,
        pointsBefore: existingTransaction.pointsBefore,
        pointsAfter: existingTransaction.pointsAfter,
        transactionId: existingTransaction.id,
        isDuplicate: true,
      };
    }

    // Get points using the general function
    const points = getRewardPoints(input.action, input.customPoints);

    // Validate points - only allow zero for ADMIN_ADJUST
    if (points === 0 && input.action !== 'ADMIN_ADJUST') {
      this.logger.warn(`[Reward] Zero points for action ${input.action}, skipping`);
      return {
        userId: input.userId,
        action: input.action,
        success: false,
        error: isVariableRewardAction(input.action)
          ? 'Custom points required for this action'
          : 'Invalid points amount',
      };
    }

    // Process the reward event
    const result = await this.rewardRepository.processRewardEvent(input, idempotencyKey, points);

    if (result.success) {
      this.logger.log(
        `[Reward] Successfully processed ${input.action} for user ${input.userId}: ` +
        `${result.pointsBefore} -> ${result.pointsAfter} (${points >= 0 ? '+' : ''}${points})`,
      );
    } else {
      this.logger.error(`[Reward] Failed to process ${input.action} for user ${input.userId}: ${result.error}`);
    }

    return result;
  }

  async processCheckIn(userId: string): Promise<RewardPointResult> {
    // Check if user can check in
    const checkInStatus = await this.rewardRepository.getCheckInStatus(userId);
    
    if (!checkInStatus.canCheckIn) {
      this.logger.log(`[Reward] User ${userId} has already checked in today`);
      return {
        userId,
        action: 'CHECKIN',
        success: false,
        error: 'Already checked in today',
        isDuplicate: true,
      };
    }

    return this.processRewardEvent({
      userId,
      action: 'CHECKIN',
      note: 'Daily check-in',
    });
  }

  async processBookingReward(userId: string, bookingId: string): Promise<RewardPointResult> {
    return this.processRewardEvent({
      userId,
      action: 'BOOKING',
      referenceId: bookingId,
      referenceType: 'Booking',
      note: 'Reward for creating booking',
    });
  }

  async processOrderCompleteReward(userId: string, orderId: string): Promise<RewardPointResult> {
    return this.processRewardEvent({
      userId,
      action: 'COMPLETE_ORDER',
      referenceId: orderId,
      referenceType: 'Order',
      note: 'Reward for completing order',
    });
  }

  async processInviteReward(userId: string, invitedUserId: string): Promise<RewardPointResult> {
    return this.processRewardEvent({
      userId,
      action: 'INVITE_USER',
      referenceId: invitedUserId,
      referenceType: 'User',
      note: 'Reward for inviting new user',
    });
  }

  async processFirstLoginReward(userId: string): Promise<RewardPointResult> {
    return this.processRewardEvent({
      userId,
      action: 'FIRST_LOGIN',
      note: 'Welcome bonus for first login',
    });
  }

  async processRedemption(
    userId: string,
    points: number,
    referenceId?: string,
    referenceType?: string,
    note?: string,
  ): Promise<RewardPointResult> {
    if (points <= 0) {
      return {
        userId,
        action: 'REDEEM',
        success: false,
        error: 'Redemption points must be positive',
      };
    }

    // Check if user has sufficient points
    const balance = await this.rewardRepository.getUserRewardBalance(userId);
    if (!balance || balance.rewardPoints < points) {
      return {
        userId,
        action: 'REDEEM',
        success: false,
        error: 'Insufficient points for redemption',
        pointsBefore: balance?.rewardPoints || 0,
      };
    }

    return this.processRewardEvent({
      userId,
      action: 'REDEEM',
      customPoints: -points, // Negative for deduction
      referenceId,
      referenceType,
      note: note || 'Points redemption',
    });
  }

  async adminAdjustPoints(
    userId: string,
    points: number,
    note: string,
    adminId: string,
  ): Promise<RewardPointResult> {
    return this.processRewardEvent({
      userId,
      action: 'ADMIN_ADJUST',
      customPoints: points,
      note: `Admin adjustment by ${adminId}: ${note}`,
      metadata: { adjustedBy: adminId },
    });
  }

  async getUserBalance(userId: string): Promise<UserRewardBalanceData | null> {
    // Ensure user rank exists
    await this.rewardRepository.ensureUserRankExists(userId);
    return this.rewardRepository.getUserRewardBalance(userId);
  }

  async getUserHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<PaginatedRewardHistoryResult> {
    const { data, total } = await this.rewardRepository.getUserRewardHistory(userId, limit, offset);
    return { data, total, limit, offset };
  }

  async getLeaderboard(
    limit: number = 20,
    offset: number = 0,
  ): Promise<PaginatedRewardLeaderboardResult> {
    const { data, total } = await this.rewardRepository.getRewardLeaderboard(limit, offset);
    return { data, total, limit, offset };
  }
  
  async getCheckInStatus(userId: string): Promise<CheckInStatus> {
    return this.rewardRepository.getCheckInStatus(userId);
  }
}
