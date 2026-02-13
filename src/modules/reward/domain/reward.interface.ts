/**
 * Reward Action Types
 */
export type RewardActionType =
  | 'CHECKIN'
  | 'BOOKING'
  | 'COMPLETE_ORDER'
  | 'INVITE_USER'
  | 'FIRST_LOGIN'
  | 'REDEEM'
  | 'ADMIN_ADJUST';


export type FixedRewardActionType = Exclude<RewardActionType, 'REDEEM' | 'ADMIN_ADJUST'>;

export type VariableRewardActionType = Extract<RewardActionType, 'REDEEM' | 'ADMIN_ADJUST'>;

/**
 * Points configuration for each fixed action
 * CHECKIN:        +5 points/day
 * BOOKING:        +10 points/order
 * COMPLETE_ORDER: +20 points
 * INVITE_USER:    +50 points
 * FIRST_LOGIN:    +10 points
 */
export const REWARD_POINTS_CONFIG: Record<FixedRewardActionType, number> = {
  CHECKIN: 5,
  BOOKING: 10,
  COMPLETE_ORDER: 20,
  INVITE_USER: 50,
  FIRST_LOGIN: 10,
};

export function isFixedRewardAction(action: RewardActionType): action is FixedRewardActionType {
  return action in REWARD_POINTS_CONFIG;
}

export function isVariableRewardAction(action: RewardActionType): action is VariableRewardActionType {
  return action === 'REDEEM' || action === 'ADMIN_ADJUST';
}

export function getRewardPoints(action: RewardActionType, customPoints?: number): number {
  if (isFixedRewardAction(action)) {
    return REWARD_POINTS_CONFIG[action];
  }

  return customPoints ?? 0;
}

export function getRewardActionDescription(action: RewardActionType): string {
  const descriptions: Record<RewardActionType, string> = {
    CHECKIN: 'Daily check-in',
    BOOKING: 'Booking reward',
    COMPLETE_ORDER: 'Order completion reward',
    INVITE_USER: 'Referral reward',
    FIRST_LOGIN: 'Welcome bonus',
    REDEEM: 'Points redemption',
    ADMIN_ADJUST: 'Admin adjustment',
  };
  return descriptions[action];
}

/**
 * Reward transaction data from database
 */
export interface RewardTransactionData {
  id: string;
  userId: string;
  action: RewardActionType;
  points: number;
  pointsBefore: number;
  pointsAfter: number;
  referenceId?: string | null;
  referenceType?: string | null;
  idempotencyKey: string;
  note?: string | null;
  properties?: Record<string, any> | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  createdBy?: string | null;
}

/**
 * User reward balance data
 */
export interface UserRewardBalanceData {
  userId: string;
  rewardPoints: number;
  username?: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}

/**
 * Reward point event input (from queue)
 */
export interface RewardPointEventInput {
  userId: string;
  action: RewardActionType;
  referenceId?: string;
  referenceType?: string;
  customPoints?: number; // For REDEEM or ADMIN_ADJUST
  note?: string;
  metadata?: Record<string, any>;
}

/**
 * Reward point processing result
 */
export interface RewardPointResult {
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
 * Reward history entry
 */
export interface RewardHistoryEntry {
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
 * Paginated reward history result
 */
export interface PaginatedRewardHistoryResult {
  data: RewardHistoryEntry[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Reward leaderboard entry
 */
export interface RewardLeaderboardEntry {
  userId: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  rewardPoints: number;
  rank: number;
}

/**
 * Paginated reward leaderboard result
 */
export interface PaginatedRewardLeaderboardResult {
  data: RewardLeaderboardEntry[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Check-in status for a user
 */
export interface CheckInStatus {
  userId: string;
  canCheckIn: boolean;
  lastCheckInAt?: Date;
  nextCheckInAt?: Date;
  consecutiveDays?: number;
}

/**
 * Generate idempotency key for reward actions
 */
export function generateIdempotencyKey(
  userId: string,
  action: RewardActionType,
  referenceId?: string,
  date?: Date,
): string {
  const dateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  
  if (action === 'CHECKIN') {
    return `${userId}:${action}:${dateStr}`;
  }
  
  // For FIRST_LOGIN, it's a one-time action
  if (action === 'FIRST_LOGIN') {
    return `${userId}:${action}:once`;
  }
  
  // For reference-based actions, include the reference
  if (referenceId) {
    return `${userId}:${action}:${referenceId}`;
  }
  
  // Fallback: include timestamp to allow multiple transactions
  return `${userId}:${action}:${Date.now()}`;
}
