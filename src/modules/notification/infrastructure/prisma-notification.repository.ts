import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { 
  NotificationRepository, 
  NotificationFilters, 
  NotificationCount,
  CreateNotificationData 
} from '../domain/notification.repository';
import { Notification } from '../domain/notification.entity';

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateNotificationData): Promise<Notification> {
    const { details, ...notificationData } = data;
    
    const notification = await this.prisma.processing.notification.create({
      data: {
        ...notificationData,
        type: (data.type as any) || 'GENERAL',
        details: details ? {
          create: details.map(detail => ({
            ...detail,
            contentType: detail.contentType || 'text',
            priority: detail.priority || 1,
          }))
        } : undefined,
      },
      include: {
        details: {
          where: { isActive: true, isDeleted: false },
          orderBy: { priority: 'desc' }
        }
      }
    });

    return notification as Notification;
  }

  async findById(id: string): Promise<Notification | null> {
    const notification = await this.prisma.processing.notification.findFirst({
      where: { 
        id,
        isActive: true,
        isDeleted: false
      },
      include: {
        details: {
          where: { isActive: true, isDeleted: false },
          orderBy: { priority: 'desc' }
        }
      }
    });

    return notification as Notification | null;
  }

  async findByUserId(filters: NotificationFilters): Promise<{
    data: Notification[];
    total: number;
  }> {
    const {
      userId,
      type,
      isRead,
      resourceType,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      isActive: true,
      isDeleted: false,
      ...(type && { type }),
      ...(typeof isRead === 'boolean' && { isRead }),
      ...(resourceType && { resourceType }),
    };

    const orderBy = {
      [sortBy]: sortOrder
    };

    const [notifications, total] = await Promise.all([
      this.prisma.processing.notification.findMany({
        where,
        include: {
          details: {
            where: { isActive: true, isDeleted: false },
            orderBy: { priority: 'desc' }
          }
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.processing.notification.count({ where })
    ]);

    return {
      data: notifications as Notification[],
      total
    };
  }

  async getCount(userId: string): Promise<NotificationCount> {
    const where = {
      userId,
      isActive: true,
      isDeleted: false
    };

    const [total, unread] = await Promise.all([
      this.prisma.processing.notification.count({ where }),
      this.prisma.processing.notification.count({ 
        where: { ...where, isRead: false } 
      })
    ]);

    return {
      total,
      unread,
      read: total - unread
    };
  }

  async markAsRead(notificationIds: string[], userId: string): Promise<void> {
    await this.prisma.processing.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
        isActive: true,
        isDeleted: false
      },
      data: {
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.processing.notification.updateMany({
      where: {
        userId,
        isRead: false,
        isActive: true,
        isDeleted: false
      },
      data: {
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.processing.notification.update({
      where: { id },
      data: {
        isDeleted: true,
        updatedAt: new Date()
      }
    });
  }
}
