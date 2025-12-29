import { Injectable, Logger } from '@nestjs/common';

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  context?: string;
  timestamp: string;
  metadata?: any;
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  duration?: number;
  statusCode?: number;
}

export interface AuditLogEntry extends LogEntry {
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  success: boolean;
}

@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);
  private readonly auditLogs: AuditLogEntry[] = [];
  private readonly maxAuditLogs = 10000;

  /**
   * Log application events
   */
  log(entry: LogEntry): void {
    const logMessage = this.formatLogMessage(entry);
    
    switch (entry.level) {
      case 'debug':
        this.logger.debug(logMessage, entry.metadata);
        break;
      case 'info':
        this.logger.log(logMessage, entry.metadata);
        break;
      case 'warn':
        this.logger.warn(logMessage, entry.metadata);
        break;
      case 'error':
        this.logger.error(logMessage, entry.metadata);
        break;
      case 'fatal':
        this.logger.error(`FATAL: ${logMessage}`, entry.metadata);
        break;
    }
  }

  /**
   * Log audit events
   */
  logAudit(entry: AuditLogEntry): void {
    this.auditLogs.push(entry);
    
    // Keep only recent audit logs
    if (this.auditLogs.length > this.maxAuditLogs) {
      this.auditLogs.shift();
    }
    
    // Log to console as well
    this.logger.log(`AUDIT: ${entry.action} on ${entry.resource}`, {
      userId: entry.userId,
      resourceId: entry.resourceId,
      success: entry.success,
      timestamp: entry.timestamp,
    });
  }

  /**
   * Log API requests
   */
  logApiRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    userId?: string,
    requestId?: string,
    ip?: string,
    userAgent?: string
  ): void {
    const level = statusCode >= 400 ? 'warn' : 'info';
    
    this.log({
      level,
      message: `API Request: ${method} ${endpoint}`,
      context: 'API',
      timestamp: new Date().toISOString(),
      method,
      endpoint,
      statusCode,
      duration,
      userId,
      requestId,
      ip,
      userAgent,
    });
  }

  /**
   * Log database operations
   */
  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    userId?: string,
    metadata?: any
  ): void {
    const level = success ? 'info' : 'error';
    
    this.log({
      level,
      message: `Database ${operation} on ${table}`,
      context: 'DATABASE',
      timestamp: new Date().toISOString(),
      duration,
      userId,
      metadata: {
        operation,
        table,
        success,
        ...metadata,
      },
    });
  }

  /**
   * Log security events
   */
  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    userId?: string,
    ip?: string,
    userAgent?: string,
    metadata?: any
  ): void {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    
    this.log({
      level,
      message: `SECURITY: ${event}`,
      context: 'SECURITY',
      timestamp: new Date().toISOString(),
      userId,
      ip,
      userAgent,
      metadata: {
        event,
        severity,
        ...metadata,
      },
    });
  }

  /**
   * Log business events
   */
  logBusinessEvent(
    event: string,
    entity: string,
    entityId: string,
    userId?: string,
    metadata?: any
  ): void {
    this.log({
      level: 'info',
      message: `BUSINESS: ${event}`,
      context: 'BUSINESS',
      timestamp: new Date().toISOString(),
      userId,
      metadata: {
        event,
        entity,
        entityId,
        ...metadata,
      },
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(
    operation: string,
    duration: number,
    metadata?: any
  ): void {
    const level = duration > 1000 ? 'warn' : 'info';
    
    this.log({
      level,
      message: `PERFORMANCE: ${operation}`,
      context: 'PERFORMANCE',
      timestamp: new Date().toISOString(),
      duration,
      metadata,
    });
  }

  /**
   * Get audit logs
   */
  getAuditLogs(limit: number = 100, offset: number = 0): AuditLogEntry[] {
    return this.auditLogs
      .slice(offset, offset + limit)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get audit logs by user
   */
  getAuditLogsByUser(userId: string, limit: number = 100): AuditLogEntry[] {
    return this.auditLogs
      .filter(log => log.userId === userId)
      .slice(0, limit)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get audit logs by resource
   */
  getAuditLogsByResource(resource: string, resourceId?: string, limit: number = 100): AuditLogEntry[] {
    return this.auditLogs
      .filter(log => 
        log.resource === resource && 
        (!resourceId || log.resourceId === resourceId)
      )
      .slice(0, limit)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Clear audit logs
   */
  clearAuditLogs(): void {
    this.auditLogs.length = 0;
  }

  /**
   * Format log message
   */
  private formatLogMessage(entry: LogEntry): string {
    const parts = [
      `[${entry.level.toUpperCase()}]`,
      entry.context ? `[${entry.context}]` : '',
      entry.message,
    ];
    
    if (entry.userId) {
      parts.push(`[User: ${entry.userId}]`);
    }
    
    if (entry.requestId) {
      parts.push(`[Request: ${entry.requestId}]`);
    }
    
    if (entry.duration !== undefined) {
      parts.push(`[Duration: ${entry.duration}ms]`);
    }
    
    if (entry.statusCode) {
      parts.push(`[Status: ${entry.statusCode}]`);
    }
    
    return parts.filter(Boolean).join(' ');
  }

  /**
   * Create structured log entry
   */
  createLogEntry(
    level: LogEntry['level'],
    message: string,
    context?: string,
    metadata?: any
  ): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      metadata,
    };
  }

  /**
   * Create audit log entry
   */
  createAuditLogEntry(
    action: string,
    resource: string,
    success: boolean,
    userId?: string,
    resourceId?: string,
    oldValue?: any,
    newValue?: any,
    metadata?: any
  ): AuditLogEntry {
    return {
      level: success ? 'info' : 'warn',
      message: `AUDIT: ${action} on ${resource}`,
      context: 'AUDIT',
      timestamp: new Date().toISOString(),
      action,
      resource,
      resourceId,
      oldValue,
      newValue,
      success,
      userId,
      metadata,
    };
  }
}
