import { IsString, IsNotEmpty, IsUUID, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginStep2Dto {
  @IsUUID('4', { message: 'Invalid user ID format' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password is too short' })
  @MaxLength(128, { message: 'Password is too long' })
  @Transform(({ value }) => value?.trim())
  password: string;
}
