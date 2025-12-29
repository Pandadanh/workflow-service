import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Logger } from '@nestjs/common';

/**
 * Service to optimize cross-schema queries and mapping for frontend responses
 * Provides utilities for batch fetching and efficient data mapping across schemas
 */
@Injectable()
export class MultiSchemaMapperService {
  private readonly logger = new Logger(MultiSchemaMapperService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Batch fetch users with profiles from sc_identity
   * Optimized for frontend responses with minimal data selection
   */
  async batchFetchUsersWithProfiles(
    userIds: string[],
    selectFields?: {
      user?: string[];
      profile?: string[];
    }
  ): Promise<Map<string, { user: any; profile: any | null }>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
    if (uniqueUserIds.length === 0) {
      return new Map();
    }

    try {
      // Default select for user (minimal fields for FE)
      const userSelect = selectFields?.user || {
        id: true,
        email: true,
        phone: true,
        username: true,
        is_active: true,
        is_deleted: true,
      };

      // Default select for profile (minimal fields for FE)
      const profileSelect = selectFields?.profile || {
        id: true,
        user_id: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        email: true,
        avatar_url: true,
        bio: true,
      };

      // Batch fetch users and profiles in parallel
      const [users, profiles] = await Promise.all([
        this.prisma.identity.user.findMany({
          where: { id: { in: uniqueUserIds } },
          select: userSelect as any,
        }),
        this.prisma.identity.userProfile.findMany({
          where: { user_id: { in: uniqueUserIds } },
          select: profileSelect as any,
        }),
      ]);

      // Create profile map by user_id
      const profileMap = new Map<string, any>();
      profiles.forEach((p) => {
        const userId = String(p.user_id);
        profileMap.set(userId, p);
      });

      // Combine user and profile
      const result = new Map<string, { user: any; profile: any | null }>();
      users.forEach((user) => {
        const userId = String(user.id);
        result.set(userId, {
          user,
          profile: profileMap.get(userId) || null,
        });
      });

      return result;
    } catch (error) {
      this.logger.error('Error batch fetching users with profiles:', error);
      return new Map();
    }
  }

  /**
   * Batch fetch districts from sc_common
   * Optimized for frontend responses
   */
  async batchFetchDistricts(
    districtIds: string[],
    selectFields?: string[]
  ): Promise<Map<string, any>> {
    if (districtIds.length === 0) {
      return new Map();
    }

    const uniqueDistrictIds = [...new Set(districtIds.filter(Boolean))];
    if (uniqueDistrictIds.length === 0) {
      return new Map();
    }

    try {
      const select = selectFields
        ? Object.fromEntries(selectFields.map((f) => [f, true]))
        : {
            id: true,
            name: true,
            name_normalized: true,
            geography_id: true,
          };

      const districts = await this.prisma.common.district.findMany({
        where: { id: { in: uniqueDistrictIds } },
        select,
      });

      return new Map(districts.map((d) => [d.id, d]));
    } catch (error) {
      this.logger.error('Error batch fetching districts:', error);
      return new Map();
    }
  }

  /**
   * Batch fetch media files from sc_media
   * Optimized for frontend responses
   */
  async batchFetchMediaFiles(
    mediaIds: string[],
    selectFields?: string[]
  ): Promise<Map<string, any>> {
    if (mediaIds.length === 0) {
      return new Map();
    }

    const uniqueMediaIds = [...new Set(mediaIds.filter(Boolean))];
    if (uniqueMediaIds.length === 0) {
      return new Map();
    }

    try {
      const select = selectFields
        ? Object.fromEntries(selectFields.map((f) => [f, true]))
        : {
            id: true,
            file_name: true,
            original_name: true,
            url: true,
            mime_type: true,
            size_in_bytes: true,
            category: true,
          };

      const mediaFiles = await this.prisma.media.mediaFile.findMany({
        where: { id: { in: uniqueMediaIds } },
        select,
      });

      return new Map(mediaFiles.map((m) => [m.id, m]));
    } catch (error) {
      this.logger.error('Error batch fetching media files:', error);
      return new Map();
    }
  }

  /**
   * Parse media_ids string and fetch media files
   * Used for GroupPost and other models with string-based media references
   */
  async fetchMediaFromString(
    mediaIdsString: string | null | undefined,
    selectFields?: string[]
  ): Promise<any[]> {
    if (!mediaIdsString) {
      return [];
    }

    try {
      const mediaIds = mediaIdsString
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      if (mediaIds.length === 0) {
        return [];
      }

      const mediaMap = await this.batchFetchMediaFiles(mediaIds, selectFields);
      return Array.from(mediaMap.values());
    } catch (error) {
      this.logger.error('Error fetching media from string:', error);
      return [];
    }
  }

  /**
   * Batch fetch orders from sc_finance
   * Optimized for frontend responses
   */
  async batchFetchOrders(
    orderIds: string[],
    selectFields?: string[]
  ): Promise<Map<string, any>> {
    if (orderIds.length === 0) {
      return new Map();
    }

    const uniqueOrderIds = [...new Set(orderIds.filter(Boolean))];
    if (uniqueOrderIds.length === 0) {
      return new Map();
    }

    try {
      const select = selectFields
        ? Object.fromEntries(selectFields.map((f) => [f, true]))
        : {
            id: true,
            userId: true,
            resourceId: true,
            amount: true,
            status: true,
            paymentConfirmed: true,
            createdAt: true,
            updatedAt: true,
          };

      const orders = await this.prisma.finance.order.findMany({
        where: { id: { in: uniqueOrderIds } },
        select,
      });

      return new Map(orders.map((o) => [o.id, o]));
    } catch (error) {
      this.logger.error('Error batch fetching orders:', error);
      return new Map();
    }
  }

  /**
   * Batch fetch banks from sc_common
   * Optimized for frontend responses
   * Note: Bank.id is Int, not String
   */
  async batchFetchBanks(
    bankIds: number[],
    selectFields?: string[]
  ): Promise<Map<number, any>> {
    if (bankIds.length === 0) {
      return new Map();
    }

    const uniqueBankIds = [...new Set(bankIds.filter((id) => id != null))];
    if (uniqueBankIds.length === 0) {
      return new Map();
    }

    try {
      const select = selectFields
        ? Object.fromEntries(selectFields.map((f) => [f, true]))
        : {
            id: true,
            name: true,
            code: true,
            logo: true,
          };

      const banks = await this.prisma.common.bank.findMany({
        where: { id: { in: uniqueBankIds } },
        select,
      });

      return new Map(banks.map((b) => [b.id, b]));
    } catch (error) {
      this.logger.error('Error batch fetching banks:', error);
      return new Map();
    }
  }

  /**
   * Helper to enrich entity with cross-schema data
   * Generic method to add related data from other schemas
   */
  enrichEntity<T extends Record<string, any>>(
    entity: T,
    enrichments: {
      user?: { user: any; profile: any | null };
      district?: any;
      media?: any[];
      order?: any;
      bank?: any;
      [key: string]: any;
    }
  ): T & typeof enrichments {
    return {
      ...entity,
      ...enrichments,
    };
  }

  /**
   * Helper to enrich array of entities with cross-schema data
   */
  enrichEntities<T extends Record<string, any>>(
    entities: T[],
    enrichmentsMap: Map<string, any>
  ): (T & { enrichments?: any })[] {
    return entities.map((entity) => {
      const enrichments = enrichmentsMap.get(entity.id);
      return enrichments
        ? { ...entity, enrichments }
        : entity;
    });
  }
}

