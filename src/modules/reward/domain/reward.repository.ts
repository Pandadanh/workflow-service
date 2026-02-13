import type {
  RewardTransactionData,
  UserRewardBalanceData,
  RewardPointResult,
  RewardPointEventInput,
  RewardHistoryEntry,
  RewardLeaderboardEntry,
  CheckInStatus,
} from './reward.interface';

export interface IRewardRepository {

  checkIdempotencyKey(idempotencyKey: string): Promise<RewardTransactionData | null>;

  getUserRewardBalance(userId: string): Promise<UserRewardBalanceData | null>;

  processRewardEvent(input: RewardPointEventInput, idempotencyKey: string, points: number): Promise<RewardPointResult>;

  /**
   * Get user's reward transaction history
   */
  getUserRewardHistory(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{ data: RewardHistoryEntry[]; total: number }>;

  /**
   * Get reward leaderboard
   */
  getRewardLeaderboard(
    limit: number,
    offset: number,
  ): Promise<{ data: RewardLeaderboardEntry[]; total: number }>;

  /**
   * Get user's check-in status for today
   */
  getCheckInStatus(userId: string): Promise<CheckInStatus>;

  /**
   * Initialize user rank if not exists
   */
  ensureUserRankExists(userId: string): Promise<void>;
}
