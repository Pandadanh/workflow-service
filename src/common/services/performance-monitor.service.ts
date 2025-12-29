import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PerformanceMonitorService {
  private readonly logger = new Logger(PerformanceMonitorService.name);
  private readonly metrics = new Map<string, any>();

  /**
   * Start performance monitoring for a method
   */
  startTimer(operation: string): () => void {
    const startTime = process.hrtime.bigint();
    const startMemory = process.memoryUsage();

    return () => {
      const endTime = process.hrtime.bigint();
      const endMemory = process.memoryUsage();
      
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;

      this.recordMetric(operation, {
        duration,
        memoryDelta,
        timestamp: new Date().toISOString(),
      });

      if (duration > 1000) {
        this.logger.warn(`Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
      }
    };
  }

  /**
   * Record a metric
   */
  recordMetric(operation: string, data: any): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const operationMetrics = this.metrics.get(operation);
    operationMetrics.push(data);
    
    // Keep only last 100 records per operation
    if (operationMetrics.length > 100) {
      operationMetrics.shift();
    }
  }

  /**
   * Get performance statistics for an operation
   */
  getStats(operation: string): any {
    const metrics = this.metrics.get(operation) || [];
    
    if (metrics.length === 0) {
      return null;
    }

    const durations = metrics.map(m => m.duration);
    const memoryDeltas = metrics.map(m => m.memoryDelta);

    return {
      operation,
      count: metrics.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      avgMemoryDelta: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length,
      lastExecuted: metrics[metrics.length - 1].timestamp,
    };
  }

  /**
   * Get all performance statistics
   */
  getAllStats(): any[] {
    const stats: any[] = [];
    
    for (const operation of this.metrics.keys()) {
      const stat = this.getStats(operation);
      if (stat) {
        stats.push(stat);
      }
    }
    
    return stats.sort((a, b) => b.avgDuration - a.avgDuration);
  }

  /**
   * Clear metrics for an operation
   */
  clearMetrics(operation?: string): void {
    if (operation) {
      this.metrics.delete(operation);
    } else {
      this.metrics.clear();
    }
  }

  /**
   * Monitor database query performance
   */
  monitorQuery<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
    const endTimer = this.startTimer(`db:${queryName}`);
    
    return queryFn()
      .then(result => {
        endTimer();
        return result;
      })
      .catch(error => {
        endTimer();
        this.recordMetric(`db:${queryName}:error`, {
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        throw error;
      });
  }

  /**
   * Monitor API endpoint performance
   */
  monitorEndpoint<T>(endpoint: string, handler: () => Promise<T>): Promise<T> {
    const endTimer = this.startTimer(`api:${endpoint}`);
    
    return handler()
      .then(result => {
        endTimer();
        return result;
      })
      .catch(error => {
        endTimer();
        this.recordMetric(`api:${endpoint}:error`, {
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        throw error;
      });
  }

  /**
   * Get system performance metrics
   */
  getSystemMetrics(): any {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
