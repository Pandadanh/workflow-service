import type { RewardActionType } from './reward.interface';

/**
 * Reward Transaction Entity
 * Represents a single reward point transaction
 */
export class RewardTransaction {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly action: RewardActionType,
    public readonly points: number,
    public readonly pointsBefore: number,
    public readonly pointsAfter: number,
    public readonly idempotencyKey: string,
    public readonly referenceId?: string | null,
    public readonly referenceType?: string | null,
    public readonly note?: string | null,
    public readonly properties?: Record<string, any> | null,
    public readonly isActive: boolean = true,
    public readonly isDeleted: boolean = false,
    public readonly createdAt?: Date,
    public readonly createdBy?: string | null,
  ) {}

  /**
   * Check if transaction is a credit (positive points)
   */
  isCredit(): boolean {
    return this.points > 0;
  }

  /**
   * Check if transaction is a debit (negative points)
   */
  isDebit(): boolean {
    return this.points < 0;
  }

  /**
   * Get absolute points value
   */
  getAbsolutePoints(): number {
    return Math.abs(this.points);
  }
}

/**
 * User Reward Balance Entity
 * Represents a user's current reward point balance
 */
export class UserRewardBalance {
  constructor(
    public readonly userId: string,
    public readonly rewardPoints: number,
    public readonly username?: string,
    public readonly firstName?: string | null,
    public readonly lastName?: string | null,
    public readonly avatarUrl?: string | null,
  ) {}

  /**
   * Check if user has sufficient points for redemption
   */
  hasSufficientPoints(requiredPoints: number): boolean {
    return this.rewardPoints >= requiredPoints;
  }

  /**
   * Get display name
   */
  getDisplayName(): string {
    if (this.firstName || this.lastName) {
      return `${this.firstName || ''} ${this.lastName || ''}`.trim();
    }
    return this.username || 'Unknown User';
  }
}
