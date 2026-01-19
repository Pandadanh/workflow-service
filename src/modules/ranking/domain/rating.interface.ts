/**
 * Player rating data from database (simplified for calculations)
 */
export interface PlayerRatingData {
  id: string;
  rating: number;
  ratingDeviation: number;
  volatility: number;
}

/**
 * Match player input with result
 */
export interface MatchPlayerInput {
  id: string;
  team: number;
  result: 'WIN' | 'LOSE' | 'DRAW';
}

/**
 * Result for a single player after rating calculation
 */
export interface PlayerRatingResult {
  playerId: string;
  team: number;
  result: 'WIN' | 'LOSE' | 'DRAW';
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
 * Team rating (combined from team members)
 */
export interface TeamRating {
  teamNumber: number;
  players: PlayerRatingData[];
  combinedRating: number;
  combinedRd: number;
  combinedVolatility: number;
}

/**
 * Match calculation result
 */
export interface MatchCalculationResult {
  matchId: string;
  playerResults: PlayerRatingResult[];
  team1Rating: number;
  team2Rating: number;
  processedAt: Date;
}

/**
 * Result of updating a single player's rating in DB
 */
export interface RatingUpdateResult {
  userId: string;
  success: boolean;
  error?: string;
}

/**
 * Leaderboard entry with user details
 */
export interface LeaderboardEntry {
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
 * Paginated result for leaderboard
 */
export interface PaginatedLeaderboardResult {
  data: LeaderboardEntry[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Player rank with user details
 */
export interface PlayerRankDetails {
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
