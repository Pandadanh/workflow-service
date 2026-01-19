import {
  PlayerRatingData,
  PlayerRatingResult,
  RatingUpdateResult,
  LeaderboardEntry,
  PlayerRankDetails,
} from './rating.interface';
import { RatingHistory } from './rating.entity';

/**
 * Abstract repository interface for rating operations
 * Following the Dependency Inversion Principle (DIP) from Clean Architecture
 */
export interface IRatingRepository {
  /**
   * Fetch player ratings from database
   * Returns a map of userId -> PlayerRatingData
   */
  getPlayerRatings(playerIds: string[]): Promise<Map<string, PlayerRatingData>>;

  /**
   * Update player ratings in database and create history records
   */
  updatePlayerRatings(
    matchId: string,
    results: PlayerRatingResult[],
  ): Promise<RatingUpdateResult[]>;

  /**
   * Get rating history for a player
   */
  getPlayerRatingHistory(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<RatingHistory[]>;

  /**
   * Get leaderboard by rating
   */
  getLeaderboard(limit?: number, offset?: number): Promise<LeaderboardEntry[]>;

  /**
   * Get total count of active players for pagination
   */
  getActivePlayerCount(): Promise<number>;

  /**
   * Check if a match has already been processed (idempotency check)
   */
  isMatchProcessed(matchId: string): Promise<boolean>;

  /**
   * Get player rank with user details
   */
  getPlayerRank(userId: string): Promise<PlayerRankDetails | null>;

  /**
   * Get multiple players' ranks
   */
  getPlayersRanks(userIds: string[]): Promise<PlayerRankDetails[]>;
}
