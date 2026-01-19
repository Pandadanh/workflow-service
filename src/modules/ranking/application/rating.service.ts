import { Injectable, Logger, Inject } from '@nestjs/common';
import type { IRatingRepository } from '../domain/rating.repository';
import {
  PlayerRatingData,
  PlayerRatingResult,
  RatingUpdateResult,
  LeaderboardEntry,
  PlayerRankDetails,
} from '../domain/rating.interface';
import { RatingHistory } from '../domain/rating.entity';

@Injectable()
export class RatingService {
  private readonly logger = new Logger(RatingService.name);

  constructor(
    @Inject('IRatingRepository')
    private readonly ratingRepository: IRatingRepository,
  ) {}

  async getPlayerRatings(playerIds: string[]): Promise<Map<string, PlayerRatingData>> {
    return this.ratingRepository.getPlayerRatings(playerIds);
  }

  async updatePlayerRatings(
    matchId: string,
    results: PlayerRatingResult[],
  ): Promise<RatingUpdateResult[]> {
    return this.ratingRepository.updatePlayerRatings(matchId, results);
  }

  /**
   * Get rating history for a player
   */
  async getPlayerRatingHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<RatingHistory[]> {
    return this.ratingRepository.getPlayerRatingHistory(userId, limit, offset);
  }

  /**
   * Get leaderboard by rating
   */
  async getLeaderboard(limit: number = 100, offset: number = 0): Promise<LeaderboardEntry[]> {
    return this.ratingRepository.getLeaderboard(limit, offset);
  }

  /**
   * Get total count of active players for pagination
   */
  async getActivePlayerCount(): Promise<number> {
    return this.ratingRepository.getActivePlayerCount();
  }

  /**
   * Check if a match has already been processed (idempotency check)
   */
  async isMatchProcessed(matchId: string): Promise<boolean> {
    return this.ratingRepository.isMatchProcessed(matchId);
  }

  /**
   * Get player rank with user details
   */
  async getPlayerRank(userId: string): Promise<PlayerRankDetails | null> {
    return this.ratingRepository.getPlayerRank(userId);
  }

  /**
   * Get multiple players' ranks
   */
  async getPlayersRanks(userIds: string[]): Promise<PlayerRankDetails[]> {
    return this.ratingRepository.getPlayersRanks(userIds);
  }

  /**
   * Calculate the global rank position for a player
   */
  async getPlayerGlobalRankPosition(userId: string): Promise<number | null> {
    const playerRank = await this.getPlayerRank(userId);
    if (!playerRank) return null;

    // This is a simplified approach - for large datasets, 
    // you might want to use a more efficient query
    const leaderboard = await this.getLeaderboard(1000, 0);
    const position = leaderboard.findIndex(entry => entry.userId === userId);
    return position >= 0 ? position + 1 : null;
  }
}
