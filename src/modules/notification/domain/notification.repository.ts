import { Notification, NotificationDetail } from './notification.entity';

export interface NotificationFilters {
  userId: string;
  type?: string;
  isRead?: boolean;
  resourceType?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface NotificationCount {
  total: number;
  unread: number;
  read: number;
}

export interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type?: string;
  resourceId?: string;
  resourceType?: string;
  actionUrl?: string;
  metadata?: any;
  createdBy?: string;
  details?: CreateNotificationDetailData[];
}

export interface CreateNotificationDetailData {
  content: string;
  contentType?: string;
  imageUrl?: string;
  actionLabel?: string;
  actionUrl?: string;
  priority?: number;
  metadata?: any;
  createdBy?: string;
}

export abstract class NotificationRepository {
  abstract create(data: CreateNotificationData): Promise<Notification>;
  abstract findById(id: string): Promise<Notification | null>;
  abstract findByUserId(filters: NotificationFilters): Promise<{
    data: Notification[];
    total: number;
  }>;
  abstract getCount(userId: string): Promise<NotificationCount>;
  abstract markAsRead(notificationIds: string[], userId: string): Promise<void>;
  abstract markAllAsRead(userId: string): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
