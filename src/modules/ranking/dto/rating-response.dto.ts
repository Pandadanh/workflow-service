import type { MatchResult } from '../domain/rating.interface';

/**
 * Player rating result after match calculation
 */
export class PlayerRatingResultDto {
  playerId: string;
  team: number;
  result: MatchResult;
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
  rdBefore: number;
  rdAfter: number;
  volatilityBefore: number;
  volatilityAfter: number;
  opponentRating: number;
  opponentRd: number;
}

/**
 * Match calculation response
 */
export class MatchCalculationResponseDto {
  matchId: string;
  status: 'SUCCESS' | 'ALREADY_PROCESSED' | 'FAILED';
  processedAt: Date;
  playerResults: PlayerRatingResultDto[];
  metadata?: {
    algorithm: string;
    matchType: string;
    team1FinalRating: number;
    team2FinalRating: number;
  };
}

/**
 * Leaderboard entry response
 */
export class LeaderboardEntryDto {
  userId: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  rating: number;
  ratingDeviation: number;
  volatility: number;
  rank: number;
}

/**
 * Paginated leaderboard response
 */
export class LeaderboardResponseDto {
  data: LeaderboardEntryDto[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Rating history entry response
 */
export class RatingHistoryEntryDto {
  id: string;
  userId: string;
  matchId: string;
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
  rdBefore: number;
  rdAfter: number;
  volatilityBefore: number;
  volatilityAfter: number;
  opponentRating: number;
  opponentRd: number;
  matchResult: MatchResult;
  teamNumber: number;
  createdAt: Date;
}

/**
 * Player rank details response
 */
export class PlayerRankDetailsDto {
  userId: string;
  rating: number;
  ratingDeviation: number;
  volatility: number;
  currentPoint: number;
  lastMatchAt: Date | null;
  user: {
    id: string;
    username: string;
    profile?: {
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
    };
  };
  rankLevel?: {
    id: string;
    name: string;
    minPoint: number;
    maxPoint: number;
  };
}
