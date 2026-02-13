import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import type { RewardActionType } from '../domain/reward.interface';

/**
 * Reward action enum values for validation
 */
export const RewardActionValues = [
  'CHECKIN',
  'BOOKING',
  'COMPLETE_ORDER',
  'INVITE_USER',
  'FIRST_LOGIN',
  'REDEEM',
  'ADMIN_ADJUST',
] as const;

/**
 * Request DTO for processing reward event
 */
export class ProcessRewardEventDto {
  @IsString()
  userId: string;

  @IsEnum(RewardActionValues, { message: 'Invalid reward action' })
  action: RewardActionType;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @IsNumber()
  customPoints?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

/**
 * Request DTO for check-in
 */
export class CheckInRequestDto {
  @IsString()
  userId: string;
}

/**
 * Request DTO for booking reward
 */
export class BookingRewardDto {
  @IsString()
  userId: string;

  @IsString()
  bookingId: string;
}

/**
 * Request DTO for order completion reward
 */
export class OrderCompleteRewardDto {
  @IsString()
  userId: string;

  @IsString()
  orderId: string;
}

/**
 * Request DTO for invite reward
 */
export class InviteRewardDto {
  @IsString()
  userId: string;

  @IsString()
  invitedUserId: string;
}

/**
 * Request DTO for first login reward
 */
export class FirstLoginRewardDto {
  @IsString()
  userId: string;
}

/**
 * Request DTO for points redemption
 */
export class RedeemPointsDto {
  @IsString()
  userId: string;

  @IsNumber()
  @Min(1)
  points: number;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

/**
 * Request DTO for admin points adjustment
 */
export class AdminAdjustPointsDto {
  @IsString()
  userId: string;

  @IsNumber()
  points: number;

  @IsString()
  note: string;

  @IsString()
  adminId: string;
}

/**
 * Request DTO for getting user history
 */
export class GetUserHistoryDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}

/**
 * Request DTO for getting leaderboard
 */
export class GetLeaderboardDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}
