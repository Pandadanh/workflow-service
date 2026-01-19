import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { IRatingRepository } from '../domain/rating.repository';
import {
  PlayerRatingData,
  PlayerRatingResult,
  RatingUpdateResult,
  LeaderboardEntry,
  PlayerRankDetails,
} from '../domain/rating.interface';
import { RatingHistory } from '../domain/rating.entity';

@Injectable()
export class PrismaRatingRepository implements IRatingRepository {
  private readonly logger = new Logger(PrismaRatingRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPlayerRatings(playerIds: string[]): Promise<Map<string, PlayerRatingData>> {
    const ratingsMap = new Map<string, PlayerRatingData>();

    if (playerIds.length === 0) {
      return ratingsMap;
    }

    try {
      const userRanks = await this.prisma.identity.userRank.findMany({
        where: {
          user_id: { in: playerIds },
          is_deleted: false,
          is_active: true,
        },
        select: {
          user_id: true,
          rating: true,
          rating_deviation: true,
          volatility: true,
          last_match_at: true,
        },
      });

      for (const rank of userRanks) {
        ratingsMap.set(rank.user_id, {
          id: rank.user_id,
          rating: rank.rating,
          ratingDeviation: this.calculateRdWithDecay(rank.rating_deviation, rank.last_match_at),
          volatility: rank.volatility,
        });
      }

      for (const playerId of playerIds) {
        if (!ratingsMap.has(playerId)) {
          this.logger.log(`[Rating] Creating default rating for new player ${playerId}`);
          ratingsMap.set(playerId, {
            id: playerId,
            rating: 1500,
            ratingDeviation: 350,
            volatility: 0.06,
          });
        }
      }

      return ratingsMap;
    } catch (error) {
      this.logger.error(`[Rating] Error fetching player ratings:`, error);
      throw error;
    }
  }

  /**
   * Update player ratings in database and create history records
   */
  async updatePlayerRatings(
    matchId: string,
    results: PlayerRatingResult[],
  ): Promise<RatingUpdateResult[]> {
    const updateResults: RatingUpdateResult[] = [];

    for (const result of results) {
      try {
        await this.prisma.identity.$transaction(async (tx) => {
          // Upsert UserRank record
          await tx.userRank.upsert({
            where: { user_id: result.playerId },
            create: {
              user_id: result.playerId,
              rating: result.ratingAfter,
              rating_deviation: result.rdAfter,
              volatility: result.volatilityAfter,
              current_point: Math.round(result.ratingAfter),
              last_match_at: new Date(),
              is_active: true,
              is_deleted: false,
            },
            update: {
              rating: result.ratingAfter,
              rating_deviation: result.rdAfter,
              volatility: result.volatilityAfter,
              current_point: Math.round(result.ratingAfter),
              last_match_at: new Date(),
              updated_at: new Date(),
            },
          });

          // Create RatingHistory record
          await tx.ratingHistory.create({
            data: {
              user_id: result.playerId,
              match_id: matchId,
              rating_before: result.ratingBefore,
              rating_after: result.ratingAfter,
              rating_change: result.ratingChange,
              rd_before: result.rdBefore,
              rd_after: result.rdAfter,
              volatility_before: result.volatilityBefore,
              volatility_after: result.volatilityAfter,
              opponent_rating: result.opponentRating,
              opponent_rd: result.opponentRd,
              match_result: result.result,
              team_number: result.team,
              is_active: true,
              is_deleted: false,
            },
          });
        });

        updateResults.push({ userId: result.playerId, success: true });
        this.logger.log(
          `[Rating] Updated player ${result.playerId}: ${result.ratingBefore.toFixed(1)} -> ${result.ratingAfter.toFixed(1)} (${result.ratingChange > 0 ? '+' : ''}${result.ratingChange.toFixed(1)})`,
        );
      } catch (error) {
        this.logger.error(`[Rating] Error updating player ${result.playerId}:`, error);
        updateResults.push({
          userId: result.playerId,
          success: false,
          error: error.message,
        });
      }
    }

    return updateResults;
  }

  /**
   * Get rating history for a player
   */
  async getPlayerRatingHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<RatingHistory[]> {
    const records = await this.prisma.identity.ratingHistory.findMany({
      where: {
        user_id: userId,
        is_deleted: false,
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    });

    return records.map(
      (record) =>
        new RatingHistory(
          record.id,
          record.user_id,
          record.match_id,
          record.rating_before,
          record.rating_after,
          record.rating_change,
          record.rd_before,
          record.rd_after,
          record.volatility_before ?? 0.06,
          record.volatility_after ?? 0.06,
          record.opponent_rating,
          record.opponent_rd,
          record.match_result as 'WIN' | 'LOSE' | 'DRAW',
          record.team_number,
          record.is_active,
          record.is_deleted,
          record.created_at,
        ),
    );
  }

  /**
   * Get leaderboard by rating
   */
  async getLeaderboard(limit: number = 100, offset: number = 0): Promise<LeaderboardEntry[]> {
    const userRanks = await this.prisma.identity.userRank.findMany({
      where: {
        is_deleted: false,
        is_active: true,
      },
      orderBy: { rating: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                first_name: true,
                last_name: true,
                avatar_url: true,
              },
            },
          },
        },
      },
    });

    return userRanks.map((rank, index) => ({
      userId: rank.user_id,
      username: rank.user?.username ?? 'Unknown',
      firstName: rank.user?.profile?.first_name ?? null,
      lastName: rank.user?.profile?.last_name ?? null,
      avatarUrl: rank.user?.profile?.avatar_url ?? null,
      rating: rank.rating,
      ratingDeviation: rank.rating_deviation,
      volatility: rank.volatility,
      rank: offset + index + 1,
    }));
  }

  /**
   * Get total count of active players for pagination
   */
  async getActivePlayerCount(): Promise<number> {
    return this.prisma.identity.userRank.count({
      where: {
        is_deleted: false,
        is_active: true,
      },
    });
  }

  /**
   * Check if a match has already been processed (idempotency check)
   */
  async isMatchProcessed(matchId: string): Promise<boolean> {
    const existingRecord = await this.prisma.identity.ratingHistory.findFirst({
      where: {
        match_id: matchId,
        is_deleted: false,
      },
    });
    return existingRecord !== null;
  }

  /**
   * Get player rank with user details
   */
  async getPlayerRank(userId: string): Promise<PlayerRankDetails | null> {
    const rank = await this.prisma.identity.userRank.findUnique({
      where: { user_id: userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                first_name: true,
                last_name: true,
                avatar_url: true,
              },
            },
          },
        },
        rank_level: true,
      },
    });

    if (!rank) return null;

    return {
      userId: rank.user_id,
      rating: rank.rating,
      ratingDeviation: rank.rating_deviation,
      volatility: rank.volatility,
      currentPoint: rank.current_point,
      lastMatchAt: rank.last_match_at,
      user: {
        id: rank.user?.id ?? '',
        username: rank.user?.username ?? 'Unknown',
        profile: rank.user?.profile
          ? {
              firstName: rank.user.profile.first_name,
              lastName: rank.user.profile.last_name,
              avatarUrl: rank.user.profile.avatar_url,
            }
          : undefined,
      },
      rankLevel: rank.rank_level
        ? {
            id: rank.rank_level.id,
            name: rank.rank_level.rank_name,
            minPoint: 0,
            maxPoint: 0,
          }
        : undefined,
    };
  }

  /**
   * Get multiple players' ranks
   */
  async getPlayersRanks(userIds: string[]): Promise<PlayerRankDetails[]> {
    const ranks = await this.prisma.identity.userRank.findMany({
      where: {
        user_id: { in: userIds },
        is_deleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                first_name: true,
                last_name: true,
                avatar_url: true,
              },
            },
          },
        },
        rank_level: true,
      },
    });

    return ranks.map((rank) => ({
      userId: rank.user_id,
      rating: rank.rating,
      ratingDeviation: rank.rating_deviation,
      volatility: rank.volatility,
      currentPoint: rank.current_point,
      lastMatchAt: rank.last_match_at,
      user: {
        id: rank.user?.id ?? '',
        username: rank.user?.username ?? 'Unknown',
        profile: rank.user?.profile
          ? {
              firstName: rank.user.profile.first_name,
              lastName: rank.user.profile.last_name,
              avatarUrl: rank.user.profile.avatar_url,
            }
          : undefined,
      },
      rankLevel: rank.rank_level
        ? {
            id: rank.rank_level.id,
            name: rank.rank_level.rank_name,
            minPoint: 0,
            maxPoint: 0,
          }
        : undefined,
    }));
  }

  private calculateRdWithDecay(currentRd: number, lastMatchAt: Date | null): number {
    if (!lastMatchAt) {
      return currentRd;
    }

    const daysSinceLastMatch = Math.floor(
      (Date.now() - lastMatchAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    const rdIncrease = daysSinceLastMatch * 1.0;
    return Math.min(350, currentRd + rdIncrease);
  }
}
