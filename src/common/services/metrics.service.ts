import { Injectable, Logger } from '@nestjs/common';

export interface MetricData {
  name: string;
  value: number;
  timestamp: string;
  tags?: Record<string, string>;
  metadata?: any;
}

export interface CounterMetric {
  name: string;
  value: number;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface GaugeMetric {
  name: string;
  value: number;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface HistogramMetric {
  name: string;
  values: number[];
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  timestamp: string;
  tags?: Record<string, string>;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly counters = new Map<string, CounterMetric>();
  private readonly gauges = new Map<string, GaugeMetric>();
  private readonly histograms = new Map<string, HistogramMetric>();
  private readonly maxHistogramValues = 1000;

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    const key = this.getMetricKey(name, tags);
    const existing = this.counters.get(key);
    
    if (existing) {
      existing.value += value;
      existing.timestamp = new Date().toISOString();
    } else {
      this.counters.set(key, {
        name,
        value,
        timestamp: new Date().toISOString(),
        tags,
      });
    }
  }

  /**
   * Set a gauge metric value
   */
  setGauge(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.getMetricKey(name, tags);
    
    this.gauges.set(key, {
      name,
      value,
      timestamp: new Date().toISOString(),
      tags,
    });
  }

  /**
   * Record a histogram value
   */
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.getMetricKey(name, tags);
    const existing = this.histograms.get(key);
    
    if (existing) {
      existing.values.push(value);
      existing.count++;
      existing.sum += value;
      existing.min = Math.min(existing.min, value);
      existing.max = Math.max(existing.max, value);
      existing.avg = existing.sum / existing.count;
      existing.timestamp = new Date().toISOString();
      
      // Keep only recent values
      if (existing.values.length > this.maxHistogramValues) {
        existing.values.shift();
      }
    } else {
      this.histograms.set(key, {
        name,
        values: [value],
        count: 1,
        sum: value,
        min: value,
        max: value,
        avg: value,
        timestamp: new Date().toISOString(),
        tags,
      });
    }
  }

  /**
   * Record API request metrics
   */
  recordApiRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    userId?: string
  ): void {
    const tags = {
      method,
      endpoint: this.sanitizeEndpoint(endpoint),
      status_code: statusCode.toString(),
      status_class: this.getStatusClass(statusCode),
    };

    // Counter for total requests
    this.incrementCounter('api_requests_total', 1, tags);
    
    // Counter for requests by user
    if (userId) {
      this.incrementCounter('api_requests_by_user_total', 1, { ...tags, user_id: userId });
    }
    
    // Histogram for response times
    this.recordHistogram('api_response_time_ms', duration, tags);
    
    // Counter for errors
    if (statusCode >= 400) {
      this.incrementCounter('api_errors_total', 1, tags);
    }
  }

  /**
   * Record database operation metrics
   */
  recordDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    success: boolean
  ): void {
    const tags = {
      operation,
      table,
      success: success.toString(),
    };

    // Counter for total operations
    this.incrementCounter('database_operations_total', 1, tags);
    
    // Histogram for operation duration
    this.recordHistogram('database_operation_duration_ms', duration, tags);
    
    // Counter for errors
    if (!success) {
      this.incrementCounter('database_errors_total', 1, tags);
    }
  }

  /**
   * Record cache operation metrics
   */
  recordCacheOperation(
    operation: string,
    hit: boolean,
    duration: number
  ): void {
    const tags = {
      operation,
      hit: hit.toString(),
    };

    // Counter for cache operations
    this.incrementCounter('cache_operations_total', 1, tags);
    
    // Histogram for cache operation duration
    this.recordHistogram('cache_operation_duration_ms', duration, tags);
  }

  /**
   * Record business event metrics
   */
  recordBusinessEvent(
    event: string,
    entity: string,
    success: boolean,
    userId?: string
  ): void {
    const tags = {
      event,
      entity,
      success: success.toString(),
    };

    // Counter for business events
    this.incrementCounter('business_events_total', 1, tags);
    
    // Counter for events by user
    if (userId) {
      this.incrementCounter('business_events_by_user_total', 1, { ...tags, user_id: userId });
    }
  }

  /**
   * Record security event metrics
   */
  recordSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    userId?: string,
    ip?: string
  ): void {
    const tags = {
      event,
      severity,
    };

    // Counter for security events
    this.incrementCounter('security_events_total', 1, tags);
    
    // Counter for events by user
    if (userId) {
      this.incrementCounter('security_events_by_user_total', 1, { ...tags, user_id: userId });
    }
    
    // Counter for events by IP
    if (ip) {
      this.incrementCounter('security_events_by_ip_total', 1, { ...tags, ip });
    }
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): {
    counters: CounterMetric[];
    gauges: GaugeMetric[];
    histograms: HistogramMetric[];
  } {
    return {
      counters: Array.from(this.counters.values()),
      gauges: Array.from(this.gauges.values()),
      histograms: Array.from(this.histograms.values()),
    };
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): {
    counters: CounterMetric[];
    gauges: GaugeMetric[];
    histograms: HistogramMetric[];
  } {
    return {
      counters: Array.from(this.counters.values()).filter(m => m.name === name),
      gauges: Array.from(this.gauges.values()).filter(m => m.name === name),
      histograms: Array.from(this.histograms.values()).filter(m => m.name === name),
    };
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(): any {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentCounters = Array.from(this.counters.values())
      .filter(m => new Date(m.timestamp) > oneHourAgo);
    
    const recentGauges = Array.from(this.gauges.values())
      .filter(m => new Date(m.timestamp) > oneHourAgo);
    
    const recentHistograms = Array.from(this.histograms.values())
      .filter(m => new Date(m.timestamp) > oneHourAgo);

    return {
      summary: {
        totalCounters: this.counters.size,
        totalGauges: this.gauges.size,
        totalHistograms: this.histograms.size,
        recentCounters: recentCounters.length,
        recentGauges: recentGauges.length,
        recentHistograms: recentHistograms.length,
      },
      topCounters: recentCounters
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
      topGauges: recentGauges
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
      topHistograms: recentHistograms
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 10),
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const cutoff = new Date(Date.now() - maxAgeMs);
    
    // Clear old counters
    for (const [key, counter] of this.counters.entries()) {
      if (new Date(counter.timestamp) < cutoff) {
        this.counters.delete(key);
      }
    }
    
    // Clear old gauges
    for (const [key, gauge] of this.gauges.entries()) {
      if (new Date(gauge.timestamp) < cutoff) {
        this.gauges.delete(key);
      }
    }
    
    // Clear old histograms
    for (const [key, histogram] of this.histograms.entries()) {
      if (new Date(histogram.timestamp) < cutoff) {
        this.histograms.delete(key);
      }
    }
  }

  /**
   * Get metric key for storage
   */
  private getMetricKey(name: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) {
      return name;
    }
    
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
    
    return `${name}{${tagString}}`;
  }

  /**
   * Sanitize endpoint for metrics
   */
  private sanitizeEndpoint(endpoint: string): string {
    return endpoint
      .replace(/\/[0-9a-f-]{36}/g, '/:id') // Replace UUIDs
      .replace(/\/[0-9]+/g, '/:id') // Replace numeric IDs
      .replace(/\?.*$/, ''); // Remove query parameters
  }

  /**
   * Get status class for HTTP status codes
   */
  private getStatusClass(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return '2xx';
    if (statusCode >= 300 && statusCode < 400) return '3xx';
    if (statusCode >= 400 && statusCode < 500) return '4xx';
    if (statusCode >= 500) return '5xx';
    return 'unknown';
  }
}
