/**
 * Player Rating Entity
 * Represents a player's current Glicko-2 rating
 */
export class PlayerRating {
  constructor(
    public readonly userId: string,
    public rating: number = 1500,
    public ratingDeviation: number = 350,
    public volatility: number = 0.06,
    public currentPoint: number = 1500,
    public lastMatchAt: Date | null = null,
    public isActive: boolean = true,
    public isDeleted: boolean = false,
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {}

  /**
   * Check if the player is considered "new" (high uncertainty)
   */
  isNewPlayer(): boolean {
    return this.ratingDeviation >= 300;
  }

  /**
   * Check if the player is inactive based on last match date
   */
  isInactive(inactiveDaysThreshold: number = 30): boolean {
    if (!this.lastMatchAt) return true;
    const daysSinceLastMatch = Math.floor(
      (Date.now() - this.lastMatchAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysSinceLastMatch >= inactiveDaysThreshold;
  }
}

/**
 * Rating History Entity
 * Represents a single rating change record after a match
 */
export class RatingHistory {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly matchId: string,
    public readonly ratingBefore: number,
    public readonly ratingAfter: number,
    public readonly ratingChange: number,
    public readonly rdBefore: number,
    public readonly rdAfter: number,
    public readonly volatilityBefore: number,
    public readonly volatilityAfter: number,
    public readonly opponentRating: number,
    public readonly opponentRd: number,
    public readonly matchResult: 'WIN' | 'LOSE' | 'DRAW',
    public readonly teamNumber: number,
    public readonly isActive: boolean = true,
    public readonly isDeleted: boolean = false,
    public readonly createdAt?: Date,
  ) {}
}
