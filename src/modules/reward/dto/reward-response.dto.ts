import type { RewardActionType } from '../domain/reward.interface';

/**
 * Response DTO for reward point result
 */
export class RewardPointResultDto {
  userId: string;
  action: RewardActionType;
  success: boolean;
  points?: number;
  pointsBefore?: number;
  pointsAfter?: number;
  transactionId?: string;
  error?: string;
  isDuplicate?: boolean;
}

/**
 * Response DTO for user reward balance
 */
export class UserRewardBalanceDto {
  userId: string;
  rewardPoints: number;
  username?: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}

/**
 * Response DTO for reward history entry
 */
export class RewardHistoryEntryDto {
  id: string;
  userId: string;
  action: RewardActionType;
  points: number;
  pointsBefore: number;
  pointsAfter: number;
  referenceId?: string | null;
  referenceType?: string | null;
  note?: string | null;
  createdAt: Date;
}

/**
 * Response DTO for paginated reward history
 */
export class PaginatedRewardHistoryDto {
  data: RewardHistoryEntryDto[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Response DTO for reward leaderboard entry
 */
export class RewardLeaderboardEntryDto {
  userId: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  rewardPoints: number;
  rank: number;
}

/**
 * Response DTO for paginated reward leaderboard
 */
export class PaginatedRewardLeaderboardDto {
  data: RewardLeaderboardEntryDto[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Response DTO for check-in status
 */
export class CheckInStatusDto {
  userId: string;
  canCheckIn: boolean;
  lastCheckInAt?: Date;
  nextCheckInAt?: Date;
  consecutiveDays?: number;
}
