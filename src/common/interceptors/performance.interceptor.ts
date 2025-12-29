import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PerformanceMonitorService } from '../services/performance-monitor.service';
import { MetricsService } from '../services/metrics.service';
import { LoggingService } from '../services/logging.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(
    private readonly performanceMonitor: PerformanceMonitorService,
    private readonly metricsService: MetricsService,
    private readonly loggingService: LoggingService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    const startTime = Date.now();
    const method = request.method;
    const url = request.url;
    const userId = request.user?.userId;
    const requestId = request.headers['x-request-id'] || 'unknown';

    // Start performance monitoring
    const endTimer = this.performanceMonitor.startTimer(`api:${method}:${url}`);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          // End performance monitoring
          endTimer();

          // Record metrics
          this.metricsService.recordApiRequest(
            method,
            url,
            statusCode,
            duration,
            userId
          );

          // Log API request
          this.loggingService.logApiRequest(
            method,
            url,
            statusCode,
            duration,
            userId,
            requestId,
            request.ip,
            request.headers['user-agent']
          );

          // Log performance if slow
          if (duration > 1000) {
            this.loggingService.logPerformance(
              `${method} ${url}`,
              duration,
              {
                userId,
                requestId,
                statusCode,
              }
            );
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          // End performance monitoring
          endTimer();

          // Record metrics for error
          this.metricsService.recordApiRequest(
            method,
            url,
            statusCode,
            duration,
            userId
          );

          // Log API request with error
          this.loggingService.logApiRequest(
            method,
            url,
            statusCode,
            duration,
            userId,
            requestId,
            request.ip,
            request.headers['user-agent']
          );

          // Log performance for error
          this.loggingService.logPerformance(
            `${method} ${url} (ERROR)`,
            duration,
            {
              userId,
              requestId,
              statusCode,
              error: error.message,
            }
          );
        },
      })
    );
  }
}
