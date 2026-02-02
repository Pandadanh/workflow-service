import type {
  RewardPointResult,
  UserRewardBalanceData,
  RewardHistoryEntry,
  RewardLeaderboardEntry,
  CheckInStatus,
  PaginatedRewardHistoryResult,
  PaginatedRewardLeaderboardResult,
} from '../domain/reward.interface';
import {
  RewardPointResultDto,
  UserRewardBalanceDto,
  RewardHistoryEntryDto,
  RewardLeaderboardEntryDto,
  CheckInStatusDto,
  PaginatedRewardHistoryDto,
  PaginatedRewardLeaderboardDto,
} from '../dto/reward-response.dto';

/**
 * Mapper for reward entities and DTOs
 */
export class RewardMapper {
  /**
   * Map RewardPointResult to DTO
   */
  static toRewardPointResultDto(result: RewardPointResult): RewardPointResultDto {
    return {
      userId: result.userId,
      action: result.action,
      success: result.success,
      points: result.points,
      pointsBefore: result.pointsBefore,
      pointsAfter: result.pointsAfter,
      transactionId: result.transactionId,
      error: result.error,
      isDuplicate: result.isDuplicate,
    };
  }

  /**
   * Map UserRewardBalanceData to DTO
   */
  static toUserRewardBalanceDto(data: UserRewardBalanceData): UserRewardBalanceDto {
    return {
      userId: data.userId,
      rewardPoints: data.rewardPoints,
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      avatarUrl: data.avatarUrl,
    };
  }

  /**
   * Map RewardHistoryEntry to DTO
   */
  static toRewardHistoryEntryDto(entry: RewardHistoryEntry): RewardHistoryEntryDto {
    return {
      id: entry.id,
      userId: entry.userId,
      action: entry.action,
      points: entry.points,
      pointsBefore: entry.pointsBefore,
      pointsAfter: entry.pointsAfter,
      referenceId: entry.referenceId,
      referenceType: entry.referenceType,
      note: entry.note,
      createdAt: entry.createdAt,
    };
  }

  /**
   * Map RewardLeaderboardEntry to DTO
   */
  static toRewardLeaderboardEntryDto(entry: RewardLeaderboardEntry): RewardLeaderboardEntryDto {
    return {
      userId: entry.userId,
      username: entry.username,
      firstName: entry.firstName,
      lastName: entry.lastName,
      avatarUrl: entry.avatarUrl,
      rewardPoints: entry.rewardPoints,
      rank: entry.rank,
    };
  }

  /**
   * Map CheckInStatus to DTO
   */
  static toCheckInStatusDto(status: CheckInStatus): CheckInStatusDto {
    return {
      userId: status.userId,
      canCheckIn: status.canCheckIn,
      lastCheckInAt: status.lastCheckInAt,
      nextCheckInAt: status.nextCheckInAt,
      consecutiveDays: status.consecutiveDays,
    };
  }

  /**
   * Map PaginatedRewardHistoryResult to DTO
   */
  static toPaginatedRewardHistoryDto(result: PaginatedRewardHistoryResult): PaginatedRewardHistoryDto {
    return {
      data: result.data.map((entry) => this.toRewardHistoryEntryDto(entry)),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  }

  /**
   * Map PaginatedRewardLeaderboardResult to DTO
   */
  static toPaginatedRewardLeaderboardDto(result: PaginatedRewardLeaderboardResult): PaginatedRewardLeaderboardDto {
    return {
      data: result.data.map((entry) => this.toRewardLeaderboardEntryDto(entry)),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  }
}
