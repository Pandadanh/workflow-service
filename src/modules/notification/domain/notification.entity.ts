export interface NotificationDetail {
  id: string;
  notificationId: string;
  content: string;
  contentType: string;
  imageUrl?: string;
  actionLabel?: string;
  actionUrl?: string;
  priority: number;
  metadata?: any;
  note?: string;
  properties?: any;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  readAt?: Date;
  resourceId?: string;
  resourceType?: string;
  actionUrl?: string;
  metadata?: any;
  note?: string;
  properties?: any;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  details?: NotificationDetail[];
}
