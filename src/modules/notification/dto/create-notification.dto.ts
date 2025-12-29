import { IsString, IsOptional, IsEnum, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationType {
  GENERAL = 'GENERAL',
  BOOKING = 'BOOKING',
  PAYMENT = 'PAYMENT',
  SYSTEM = 'SYSTEM',
  PROMOTION = 'PROMOTION',
  REMINDER = 'REMINDER',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

export class CreateNotificationDetailDto {
  @ApiProperty({ description: 'Chi tiết nội dung notification' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Loại nội dung', default: 'text' })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({ description: 'URL hình ảnh' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Label cho action button' })
  @IsOptional()
  @IsString()
  actionLabel?: string;

  @ApiPropertyOptional({ description: 'URL cho action' })
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @ApiPropertyOptional({ description: 'Độ ưu tiên (1-4)', default: 1 })
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ description: 'Metadata bổ sung' })
  @IsOptional()
  metadata?: any;
}

export class CreateNotificationDto {
  @ApiProperty({ description: 'ID của user nhận notification' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Tiêu đề notification' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Nội dung chính của notification' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ 
    description: 'Loại notification',
    enum: NotificationType,
    default: NotificationType.GENERAL
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ description: 'ID của resource liên quan' })
  @IsOptional()
  @IsUUID()
  resourceId?: string;

  @ApiPropertyOptional({ description: 'Loại resource' })
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional({ description: 'URL để navigate khi click' })
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @ApiPropertyOptional({ description: 'Metadata bổ sung' })
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional({ 
    description: 'Chi tiết notification',
    type: [CreateNotificationDetailDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateNotificationDetailDto)
  details?: CreateNotificationDetailDto[];
}
