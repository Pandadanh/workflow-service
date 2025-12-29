import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class QueryOptimizerService {
  private readonly logger = new Logger(QueryOptimizerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Optimize pagination queries with cursor-based pagination for better performance
   */
  async optimizedPagination<T>(
    model: string,
    where: any,
    orderBy: any,
    limit: number,
    cursor?: string
  ): Promise<{ data: T[]; nextCursor?: string; hasMore: boolean }> {
    try {
      const take = Math.min(limit, 100); // Max 100 items per page
      
      const queryOptions: any = {
        where,
        orderBy,
        take: take + 1, // Take one extra to check if there are more
      };

      if (cursor) {
        queryOptions.cursor = { id: cursor };
        queryOptions.skip = 1; // Skip the cursor item
      }

      const results = await (this.prisma as any)[model].findMany(queryOptions);
      
      const hasMore = results.length > take;
      const data = hasMore ? results.slice(0, take) : results;
      const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

      return {
        data,
        nextCursor,
        hasMore,
      };
    } catch (error) {
      this.logger.error(`Error in optimized pagination for ${model}:`, error);
      throw error;
    }
  }

  /**
   * Batch operations for better performance
   */
  async batchCreate<T>(model: string, data: T[]): Promise<T[]> {
    try {
      const batchSize = 1000; // Process in batches of 1000
      const results: T[] = [];

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const batchResults = await (this.prisma as any)[model].createMany({
          data: batch,
          skipDuplicates: true,
        });
        results.push(...batchResults as any);
      }

      return results;
    } catch (error) {
      this.logger.error(`Error in batch create for ${model}:`, error);
      throw error;
    }
  }

  /**
   * Optimize complex joins with raw SQL when needed
   */
  async optimizedJoin<T>(
    sql: string,
    params: any[] = []
  ): Promise<T[]> {
    try {
      const startTime = Date.now();
      const results = await this.prisma.finance.$queryRawUnsafe<T[]>(sql, ...params);
      const duration = Date.now() - startTime;
      
      if (duration > 1000) {
        this.logger.warn(`Slow query detected: ${duration}ms`);
      }

      return results;
    } catch (error) {
      this.logger.error('Error in optimized join:', error);
      throw error;
    }
  }

  /**
   * Add database indexes for frequently queried fields
   */
  async analyzeQueryPerformance(query: string, params: any[] = []): Promise<void> {
    try {
      const explainQuery = `EXPLAIN ANALYZE ${query}`;
      const result = await this.prisma.finance.$queryRawUnsafe(explainQuery, ...params);
      
      this.logger.log('Query performance analysis:', result);
    } catch (error) {
      this.logger.error('Error analyzing query performance:', error);
    }
  }
}
