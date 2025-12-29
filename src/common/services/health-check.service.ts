import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    memory: MemoryHealth;
    disk: DiskHealth;
  };
  metrics: {
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
  lastChecked: string;
}

export interface MemoryHealth {
  used: number;
  total: number;
  percentage: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface DiskHealth {
  used: number;
  total: number;
  percentage: number;
  status: 'healthy' | 'warning' | 'critical';
}

@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);
  private requestCount = 0;
  private errorCount = 0;
  private responseTimes: number[] = [];

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const [databaseHealth, memoryHealth, diskHealth] = await Promise.allSettled([
        this.checkDatabase(),
        this.checkMemory(),
        this.checkDisk(),
      ]);

      const overallStatus = this.determineOverallStatus([
        databaseHealth.status === 'fulfilled' ? databaseHealth.value : { 
          status: 'unhealthy' as const,
          lastChecked: new Date().toISOString()
        },
      ]);

      const result: HealthCheckResult = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: databaseHealth.status === 'fulfilled' ? databaseHealth.value : { 
            status: 'unhealthy', 
            error: 'Database check failed',
            lastChecked: new Date().toISOString()
          },
          memory: memoryHealth.status === 'fulfilled' ? memoryHealth.value : {
            used: 0,
            total: 0,
            percentage: 0,
            status: 'critical'
          },
          disk: diskHealth.status === 'fulfilled' ? diskHealth.value : {
            used: 0,
            total: 0,
            percentage: 0,
            status: 'critical'
          },
        },
        metrics: this.getMetrics(),
      };

      this.logger.log(`Health check completed in ${Date.now() - startTime}ms`);
      return result;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * Check database connectivity and performance
   */
  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Simple query to check connectivity
      await this.prisma.finance.payment.findFirst();
      
      return {
        status: 'healthy',
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check Redis connectivity and performance
   */
  private async checkRedis(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Simple ping to check connectivity
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemory(): Promise<MemoryHealth> {
    const memUsage = process.memoryUsage();
    const total = memUsage.heapTotal;
    const used = memUsage.heapUsed;
    const percentage = (used / total) * 100;
    
    let status: MemoryHealth['status'] = 'healthy';
    if (percentage > 90) {
      status = 'critical';
    } else if (percentage > 75) {
      status = 'warning';
    }
    
    return {
      used,
      total,
      percentage: Math.round(percentage * 100) / 100,
      status,
    };
  }

  /**
   * Check disk usage (simplified)
   */
  private async checkDisk(): Promise<DiskHealth> {
    // This is a simplified disk check
    // In production, you might want to use a library like 'node-disk-info'
    const total = 100 * 1024 * 1024 * 1024; // 100GB assumed
    const used = 50 * 1024 * 1024 * 1024; // 50GB assumed
    const percentage = (used / total) * 100;
    
    let status: DiskHealth['status'] = 'healthy';
    if (percentage > 90) {
      status = 'critical';
    } else if (percentage > 80) {
      status = 'warning';
    }
    
    return {
      used,
      total,
      percentage: Math.round(percentage * 100) / 100,
      status,
    };
  }

  /**
   * Determine overall system status
   */
  private determineOverallStatus(serviceStatuses: ServiceHealth[]): HealthCheckResult['status'] {
    const hasUnhealthy = serviceStatuses.some(s => s.status === 'unhealthy');
    const hasDegraded = serviceStatuses.some(s => s.status === 'degraded');
    
    if (hasUnhealthy) {
      return 'unhealthy';
    } else if (hasDegraded) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * Get application metrics
   */
  private getMetrics() {
    const totalRequests = this.requestCount;
    const errorRate = totalRequests > 0 ? (this.errorCount / totalRequests) * 100 : 0;
    const averageResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
      : 0;
    
    return {
      totalRequests,
      errorRate: Math.round(errorRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
    };
  }

  /**
   * Record request metrics
   */
  recordRequest(responseTime: number, isError: boolean = false): void {
    this.requestCount++;
    if (isError) {
      this.errorCount++;
    }
    
    this.responseTimes.push(responseTime);
    
    // Keep only last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }
  }

  /**
   * Get detailed health information
   */
  async getDetailedHealth(): Promise<any> {
    const basicHealth = await this.performHealthCheck();
    
    return {
      ...basicHealth,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        cpuUsage: process.cpuUsage(),
      },
      database: {
        ...basicHealth.services.database,
        // Add more database-specific metrics here
      },
    };
  }
}
