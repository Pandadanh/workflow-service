import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { NotificationRepository, NotificationFilters, CreateNotificationData } from '../domain/notification.repository';
import { Notification } from '../domain/notification.entity';
import { 
  CreateNotificationDto,
  GetNotificationsDto,
  NotificationResponseDto,
  NotificationListResponseDto,
  NotificationCountResponseDto
} from '../dto/index';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<NotificationResponseDto> {
    const createData: CreateNotificationData = {
      userId: createNotificationDto.userId,
      title: createNotificationDto.title,
      message: createNotificationDto.message,
      type: createNotificationDto.type,
      resourceId: createNotificationDto.resourceId,
      resourceType: createNotificationDto.resourceType,
      actionUrl: createNotificationDto.actionUrl,
      metadata: createNotificationDto.metadata,
      details: createNotificationDto.details?.map(detail => ({
        content: detail.content,
        contentType: detail.contentType,
        imageUrl: detail.imageUrl,
        actionLabel: detail.actionLabel,
        actionUrl: detail.actionUrl,
        priority: detail.priority,
        metadata: detail.metadata,
      })),
    };

    const notification = await this.notificationRepository.create(createData);
    return this.mapToResponseDto(notification);
  }

  async getCount(userId: string): Promise<NotificationCountResponseDto> {
    const count = await this.notificationRepository.getCount(userId);
    return count;
  }

  async getNotifications(
    userId: string, 
    query: GetNotificationsDto
  ): Promise<NotificationListResponseDto> {
    const filters: NotificationFilters = {
      userId,
      type: query.type,
      isRead: query.isRead,
      resourceType: query.resourceType,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };

    const { data, total } = await this.notificationRepository.findByUserId(filters);
    
    const totalPages = Math.ceil(total / (query.limit || 20));

    return {
      data: data.map(notification => this.mapToResponseDto(notification)),
      pagination: {
        page: query.page || 1,
        limit: query.limit || 20,
        total,
        totalPages,
      },
    };
  }

  async getNotificationDetail(id: string, userId: string): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepository.findById(id);
    
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Auto mark as read when viewing detail
    if (!notification.isRead) {
      await this.notificationRepository.markAsRead([id], userId);
      notification.isRead = true;
      notification.readAt = new Date();
    }

    return this.mapToResponseDto(notification);
  }

  async markAsRead(notificationIds: string[], userId: string): Promise<void> {
    // Verify all notifications belong to the user
    for (const id of notificationIds) {
      const notification = await this.notificationRepository.findById(id);
      if (!notification || notification.userId !== userId) {
        throw new ForbiddenException(`Access denied for notification ${id}`);
      }
    }

    await this.notificationRepository.markAsRead(notificationIds, userId);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId);
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findById(id);
    
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.notificationRepository.delete(id);
  }

  private mapToResponseDto(notification: Notification): NotificationResponseDto {
    return {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type as any,
      isRead: notification.isRead,
      readAt: notification.readAt,
      resourceId: notification.resourceId,
      resourceType: notification.resourceType,
      actionUrl: notification.actionUrl,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      details: notification.details?.map(detail => ({
        id: detail.id,
        content: detail.content,
        contentType: detail.contentType,
        imageUrl: detail.imageUrl,
        actionLabel: detail.actionLabel,
        actionUrl: detail.actionUrl,
        priority: detail.priority,
        metadata: detail.metadata,
        createdAt: detail.createdAt,
        updatedAt: detail.updatedAt,
      })),
    };
  }
}
