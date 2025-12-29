import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from './create-notification.dto';

export class NotificationDetailResponseDto {
  @ApiProperty({ description: 'ID của notification detail' })
  id: string;

  @ApiProperty({ description: 'Chi tiết nội dung notification' })
  content: string;

  @ApiProperty({ description: 'Loại nội dung' })
  contentType: string;

  @ApiPropertyOptional({ description: 'URL hình ảnh' })
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Label cho action button' })
  actionLabel?: string;

  @ApiPropertyOptional({ description: 'URL cho action' })
  actionUrl?: string;

  @ApiProperty({ description: 'Độ ưu tiên' })
  priority: number;

  @ApiPropertyOptional({ description: 'Metadata bổ sung' })
  metadata?: any;

  @ApiProperty({ description: 'Thời gian tạo' })
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật' })
  updatedAt: Date;
}

export class NotificationResponseDto {
  @ApiProperty({ description: 'ID của notification' })
  id: string;

  @ApiProperty({ description: 'ID của user' })
  userId: string;

  @ApiProperty({ description: 'Tiêu đề notification' })
  title: string;

  @ApiProperty({ description: 'Nội dung chính của notification' })
  message: string;

  @ApiProperty({ 
    description: 'Loại notification',
    enum: NotificationType
  })
  type: NotificationType;

  @ApiProperty({ description: 'Trạng thái đã đọc' })
  isRead: boolean;

  @ApiPropertyOptional({ description: 'Thời gian đọc' })
  readAt?: Date;

  @ApiPropertyOptional({ description: 'ID của resource liên quan' })
  resourceId?: string;

  @ApiPropertyOptional({ description: 'Loại resource' })
  resourceType?: string;

  @ApiPropertyOptional({ description: 'URL để navigate khi click' })
  actionUrl?: string;

  @ApiPropertyOptional({ description: 'Metadata bổ sung' })
  metadata?: any;

  @ApiProperty({ description: 'Thời gian tạo' })
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật' })
  updatedAt: Date;

  @ApiPropertyOptional({ 
    description: 'Chi tiết notification',
    type: [NotificationDetailResponseDto]
  })
  details?: NotificationDetailResponseDto[];
}

export class NotificationCountResponseDto {
  @ApiProperty({ description: 'Tổng số notification' })
  total: number;

  @ApiProperty({ description: 'Số notification chưa đọc' })
  unread: number;

  @ApiProperty({ description: 'Số notification đã đọc' })
  read: number;
}

export class NotificationListResponseDto {
  @ApiProperty({ 
    description: 'Danh sách notification',
    type: [NotificationResponseDto]
  })
  data: NotificationResponseDto[];

  @ApiProperty({ description: 'Thông tin phân trang' })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
