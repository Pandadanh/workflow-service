import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import type { IRewardRepository } from '../domain/reward.repository';
import type {
  RewardTransactionData,
  UserRewardBalanceData,
  RewardPointResult,
  RewardPointEventInput,
  RewardHistoryEntry,
  RewardLeaderboardEntry,
  CheckInStatus,
  RewardActionType,
} from '../domain/reward.interface';

@Injectable()
export class PrismaRewardRepository implements IRewardRepository {
  private readonly logger = new Logger(PrismaRewardRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if a transaction with the given idempotency key already exists
   */
  async checkIdempotencyKey(idempotencyKey: string): Promise<RewardTransactionData | null> {
    const existing = await this.prisma.identity.rewardTransaction.findUnique({
      where: { idempotency_key: idempotencyKey },
    });

    if (!existing) return null;

    return {
      id: existing.id,
      userId: existing.user_id,
      action: existing.action as RewardActionType,
      points: existing.points,
      pointsBefore: existing.points_before,
      pointsAfter: existing.points_after,
      referenceId: existing.reference_id,
      referenceType: existing.reference_type,
      idempotencyKey: existing.idempotency_key,
      note: existing.note,
      properties: existing.properties as Record<string, any> | null,
      isActive: existing.is_active,
      isDeleted: existing.is_deleted,
      createdAt: existing.created_at,
      createdBy: existing.created_by,
    };
  }

  async getUserRewardBalance(userId: string): Promise<UserRewardBalanceData | null> {
    const userRank = await this.prisma.identity.userRank.findUnique({
      where: { user_id: userId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!userRank) return null;

    return {
      userId: userRank.user_id,
      rewardPoints: userRank.reward_points,
      username: userRank.user.username,
      firstName: userRank.user.profile?.first_name || null,
      lastName: userRank.user.profile?.last_name || null,
      avatarUrl: userRank.user.profile?.avatar_url || null,
    };
  }

  async processRewardEvent(
    input: RewardPointEventInput,
    idempotencyKey: string,
    points: number,
  ): Promise<RewardPointResult> {
    try {
      const result = await this.prisma.identity.$transaction(async (tx) => {
        // Check idempotency first within transaction
        const existing = await tx.rewardTransaction.findUnique({
          where: { idempotency_key: idempotencyKey },
        });

        if (existing) {
          return {
            userId: input.userId,
            action: input.action,
            success: true,
            points: existing.points,
            pointsBefore: existing.points_before,
            pointsAfter: existing.points_after,
            transactionId: existing.id,
            isDuplicate: true,
          };
        }

        // Get or create user rank
        let userRank = await tx.userRank.findUnique({
          where: { user_id: input.userId },
        });

        if (!userRank) {
          userRank = await tx.userRank.create({
            data: {
              user_id: input.userId,
              reward_points: 0,
              current_point: 0,
              rating: 1500,
              rating_deviation: 350,
              volatility: 0.06,
            },
          });
        }

        const pointsBefore = userRank.reward_points;
        const pointsAfter = pointsBefore + points;

        // Ensure points don't go negative for non-admin actions
        if (pointsAfter < 0 && input.action !== 'ADMIN_ADJUST') {
          return {
            userId: input.userId,
            action: input.action,
            success: false,
            error: 'Insufficient points for redemption',
            pointsBefore,
          };
        }

        // Update user reward points
        await tx.userRank.update({
          where: { user_id: input.userId },
          data: {
            reward_points: pointsAfter,
            updated_at: new Date(),
          },
        });

        // Create reward transaction record
        const transaction = await tx.rewardTransaction.create({
          data: {
            user_id: input.userId,
            action: input.action,
            points: points,
            points_before: pointsBefore,
            points_after: pointsAfter,
            reference_id: input.referenceId || null,
            reference_type: input.referenceType || null,
            idempotency_key: idempotencyKey,
            note: input.note || null,
            properties: input.metadata || undefined,
          },
        });

        this.logger.log(
          `[Reward] Processed ${input.action} for user ${input.userId}: ${pointsBefore} -> ${pointsAfter} (+${points})`,
        );

        return {
          userId: input.userId,
          action: input.action,
          success: true,
          points,
          pointsBefore,
          pointsAfter,
          transactionId: transaction.id,
          isDuplicate: false,
        };
      });

      return result;
    } catch (error) {
      this.logger.error(`[Reward] Failed to process ${input.action} for user ${input.userId}:`, error);
      return {
        userId: input.userId,
        action: input.action,
        success: false,
        error: error.message,
      };
    }
  }

  async getUserRewardHistory(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{ data: RewardHistoryEntry[]; total: number }> {
    const [transactions, total] = await Promise.all([
      this.prisma.identity.rewardTransaction.findMany({
        where: {
          user_id: userId,
          is_active: true,
          is_deleted: false,
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.identity.rewardTransaction.count({
        where: {
          user_id: userId,
          is_active: true,
          is_deleted: false,
        },
      }),
    ]);

    return {
      data: transactions.map((t) => ({
        id: t.id,
        userId: t.user_id,
        action: t.action as RewardActionType,
        points: t.points,
        pointsBefore: t.points_before,
        pointsAfter: t.points_after,
        referenceId: t.reference_id,
        referenceType: t.reference_type,
        note: t.note,
        createdAt: t.created_at,
      })),
      total,
    };
  }

  /**
   * Get reward leaderboard
   */
  async getRewardLeaderboard(
    limit: number,
    offset: number,
  ): Promise<{ data: RewardLeaderboardEntry[]; total: number }> {
    const [userRanks, total] = await Promise.all([
      this.prisma.identity.userRank.findMany({
        where: {
          is_active: true,
          is_deleted: false,
          reward_points: { gt: 0 },
        },
        orderBy: { reward_points: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      }),
      this.prisma.identity.userRank.count({
        where: {
          is_active: true,
          is_deleted: false,
          reward_points: { gt: 0 },
        },
      }),
    ]);

    return {
      data: userRanks.map((ur, index) => ({
        userId: ur.user_id,
        username: ur.user.username,
        firstName: ur.user.profile?.first_name || null,
        lastName: ur.user.profile?.last_name || null,
        avatarUrl: ur.user.profile?.avatar_url || null,
        rewardPoints: ur.reward_points,
        rank: offset + index + 1,
      })),
      total,
    };
  }

  async getCheckInStatus(userId: string): Promise<CheckInStatus> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find today's check-in
    const todayCheckIn = await this.prisma.identity.rewardTransaction.findFirst({
      where: {
        user_id: userId,
        action: 'CHECKIN',
        created_at: {
          gte: today,
          lt: tomorrow,
        },
        is_active: true,
        is_deleted: false,
      },
    });

    // Find last check-in
    const lastCheckIn = await this.prisma.identity.rewardTransaction.findFirst({
      where: {
        user_id: userId,
        action: 'CHECKIN',
        is_active: true,
        is_deleted: false,
      },
      orderBy: { created_at: 'desc' },
    });

    // Calculate consecutive days (simplified - just check if last check-in was yesterday)
    let consecutiveDays = 0;
    if (lastCheckIn) {
      const lastCheckInDate = new Date(lastCheckIn.created_at);
      lastCheckInDate.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastCheckInDate.getTime() === yesterday.getTime() || lastCheckInDate.getTime() === today.getTime()) {
        // Count consecutive days (simplified - would need more complex query for accurate count)
        consecutiveDays = 1;
      }
    }

    return {
      userId,
      canCheckIn: !todayCheckIn,
      lastCheckInAt: lastCheckIn?.created_at,
      nextCheckInAt: todayCheckIn ? tomorrow : undefined,
      consecutiveDays,
    };
  }

  async ensureUserRankExists(userId: string): Promise<void> {
    const existing = await this.prisma.identity.userRank.findUnique({
      where: { user_id: userId },
    });

    if (!existing) {
      await this.prisma.identity.userRank.create({
        data: {
          user_id: userId,
          reward_points: 0,
          current_point: 0,
          rating: 1500,
          rating_deviation: 350,
          volatility: 0.06,
        },
      });
      this.logger.log(`[Reward] Created UserRank for user ${userId}`);
    }
  }
}
