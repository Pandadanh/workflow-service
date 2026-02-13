import { RatingHistory, PlayerRating } from '../domain/rating.entity';
import { RatingHistoryEntryDto, PlayerRankDetailsDto, LeaderboardEntryDto } from '../dto/rating-response.dto';
import { PlayerRankDetails, LeaderboardEntry } from '../domain/rating.interface';

/**
 * Mapper for converting between domain entities and DTOs
 */
export class RatingMapper {
  /**
   * Convert RatingHistory entity to DTO
   */
  static toRatingHistoryDto(entity: RatingHistory): RatingHistoryEntryDto {
    return {
      id: entity.id,
      userId: entity.userId,
      matchId: entity.matchId,
      ratingBefore: entity.ratingBefore,
      ratingAfter: entity.ratingAfter,
      ratingChange: entity.ratingChange,
      rdBefore: entity.rdBefore,
      rdAfter: entity.rdAfter,
      volatilityBefore: entity.volatilityBefore,
      volatilityAfter: entity.volatilityAfter,
      opponentRating: entity.opponentRating,
      opponentRd: entity.opponentRd,
      matchResult: entity.matchResult,
      teamNumber: entity.teamNumber,
      createdAt: entity.createdAt ?? new Date(),
    };
  }

  /**
   * Convert array of RatingHistory entities to DTOs
   */
  static toRatingHistoryDtoArray(entities: RatingHistory[]): RatingHistoryEntryDto[] {
    return entities.map((entity) => this.toRatingHistoryDto(entity));
  }

  /**
   * Convert PlayerRankDetails interface to DTO
   */
  static toPlayerRankDetailsDto(data: PlayerRankDetails): PlayerRankDetailsDto {
    return {
      userId: data.userId,
      rating: data.rating,
      ratingDeviation: data.ratingDeviation,
      volatility: data.volatility,
      currentPoint: data.currentPoint,
      lastMatchAt: data.lastMatchAt,
      user: {
        id: data.user.id,
        username: data.user.username,
        profile: data.user.profile
          ? {
              firstName: data.user.profile.firstName,
              lastName: data.user.profile.lastName,
              avatarUrl: data.user.profile.avatarUrl,
            }
          : undefined,
      },
      rankLevel: data.rankLevel
        ? {
            id: data.rankLevel.id,
            name: data.rankLevel.name,
            minPoint: data.rankLevel.minPoint,
            maxPoint: data.rankLevel.maxPoint,
          }
        : undefined,
    };
  }

  /**
   * Convert LeaderboardEntry interface to DTO
   */
  static toLeaderboardEntryDto(entry: LeaderboardEntry): LeaderboardEntryDto {
    return {
      userId: entry.userId,
      username: entry.username,
      firstName: entry.firstName,
      lastName: entry.lastName,
      avatarUrl: entry.avatarUrl,
      rating: entry.rating,
      ratingDeviation: entry.ratingDeviation,
      volatility: entry.volatility,
      rank: entry.rank,
    };
  }

  /**
   * Convert array of LeaderboardEntry to DTOs
   */
  static toLeaderboardEntryDtoArray(entries: LeaderboardEntry[]): LeaderboardEntryDto[] {
    return entries.map((entry) => this.toLeaderboardEntryDto(entry));
  }

  /**
   * Convert PlayerRating entity to a simple data format
   */
  static toPlayerRatingData(entity: PlayerRating) {
    return {
      id: entity.userId,
      rating: entity.rating,
      ratingDeviation: entity.ratingDeviation,
      volatility: entity.volatility,
    };
  }
}
