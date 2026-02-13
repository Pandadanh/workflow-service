import { IsString, IsNumber, IsEnum, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export enum MatchResultEnum {
  WIN = 'WIN',
  LOSE = 'LOSE',
  DRAW = 'DRAW',
}

export class MatchPlayerDto {
  @IsString()
  id: string;

  @IsNumber()
  team: number;

  @IsEnum(MatchResultEnum)
  result: MatchResultEnum;
}

export class CalculateMatchDto {
  @IsString()
  matchId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MatchPlayerDto)
  players: MatchPlayerDto[];

  @IsOptional()
  @IsString()
  matchType?: 'SINGLES' | 'DOUBLES';
}

export class GetLeaderboardDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 100;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  offset?: number = 0;
}

export class GetRatingHistoryDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  offset?: number = 0;
}
