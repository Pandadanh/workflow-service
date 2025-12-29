import { IsString, IsUUID, IsNotEmpty, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class VerifyOtpDto {
  @IsUUID('4', { message: 'Invalid transaction ID format' })
  @IsNotEmpty({ message: 'Transaction ID is required' })
  transactionId: string;

  @IsString({ message: 'OTP must be a string' })
  @IsNotEmpty({ message: 'OTP is required' })
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only digits' })
  @Transform(({ value }) => value?.trim())
  otp: string;
}
