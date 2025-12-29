import { Injectable, Logger } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  timestamp?: string;
  metadata?: any;
}

export interface ErrorReport {
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'validation' | 'authentication' | 'authorization' | 'database' | 'external' | 'system';
}

@Injectable()
export class ErrorHandlerService {
  private readonly logger = new Logger(ErrorHandlerService.name);
  private readonly errorStats = new Map<string, number>();

  /**
   * Handle and categorize errors
   */
  handleError(error: Error, context: ErrorContext = {}): HttpException {
    const errorReport = this.categorizeError(error, context);
    this.logError(errorReport);
    this.updateErrorStats(errorReport);
    
    return this.createHttpException(errorReport);
  }

  /**
   * Categorize error by type and severity
   */
  private categorizeError(error: Error, context: ErrorContext): ErrorReport {
    const errorName = error.constructor.name;
    const errorMessage = error.message.toLowerCase();

    let category: ErrorReport['category'] = 'system';
    let severity: ErrorReport['severity'] = 'medium';

    // Categorize by error type
    if (errorName.includes('Validation') || errorMessage.includes('validation')) {
      category = 'validation';
      severity = 'low';
    } else if (errorName.includes('Auth') || errorMessage.includes('unauthorized')) {
      category = 'authentication';
      severity = 'high';
    } else if (errorName.includes('Forbidden') || errorMessage.includes('forbidden')) {
      category = 'authorization';
      severity = 'high';
    } else if (errorName.includes('Prisma') || errorName.includes('Database')) {
      category = 'database';
      severity = 'high';
    } else if (errorName.includes('Axios') || errorName.includes('Network')) {
      category = 'external';
      severity = 'medium';
    }

    // Adjust severity based on context
    if (context.endpoint?.includes('withdrawal') || context.endpoint?.includes('payment')) {
      severity = severity === 'low' ? 'medium' : severity === 'medium' ? 'high' : 'critical';
    }

    return {
      error,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
      },
      severity,
      category,
    };
  }

  /**
   * Log error with appropriate level
   */
  private logError(errorReport: ErrorReport): void {
    const { error, context, severity, category } = errorReport;
    
    const logData = {
      error: {
        name: error.constructor.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      category,
      severity,
    };

    switch (severity) {
      case 'critical':
        this.logger.error(`CRITICAL ERROR [${category}]:`, logData);
        break;
      case 'high':
        this.logger.error(`HIGH SEVERITY ERROR [${category}]:`, logData);
        break;
      case 'medium':
        this.logger.warn(`MEDIUM SEVERITY ERROR [${category}]:`, logData);
        break;
      case 'low':
        this.logger.log(`LOW SEVERITY ERROR [${category}]:`, logData);
        break;
    }
  }

  /**
   * Update error statistics
   */
  private updateErrorStats(errorReport: ErrorReport): void {
    const key = `${errorReport.category}:${errorReport.error.constructor.name}`;
    const current = this.errorStats.get(key) || 0;
    this.errorStats.set(key, current + 1);
  }

  /**
   * Create appropriate HTTP exception
   */
  private createHttpException(errorReport: ErrorReport): HttpException {
    const { error, severity, category } = errorReport;
    
    let status: HttpStatus;
    let message: string;

    switch (category) {
      case 'validation':
        status = HttpStatus.BAD_REQUEST;
        message = this.sanitizeErrorMessage(error.message);
        break;
      case 'authentication':
        status = HttpStatus.UNAUTHORIZED;
        message = 'Xác thực thất bại';
        break;
      case 'authorization':
        status = HttpStatus.FORBIDDEN;
        message = 'Không có quyền truy cập';
        break;
      case 'database':
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Lỗi hệ thống cơ sở dữ liệu';
        break;
      case 'external':
        status = HttpStatus.BAD_GATEWAY;
        message = 'Lỗi dịch vụ bên ngoài';
        break;
      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Lỗi hệ thống';
    }

    // Don't expose sensitive information in production
    if (process.env.NODE_ENV === 'production' && severity === 'critical') {
      message = 'Lỗi hệ thống nghiêm trọng';
    }

    return new HttpException(
      {
        status: 'error',
        message,
        data: null,
        errors: [error.message],
        timestamp: new Date().toISOString(),
        requestId: errorReport.context.requestId,
      },
      status
    );
  }

  /**
   * Sanitize error message to prevent information leakage
   */
  private sanitizeErrorMessage(message: string): string {
    // Remove sensitive information
    return message
      .replace(/password/gi, '***')
      .replace(/token/gi, '***')
      .replace(/key/gi, '***')
      .replace(/secret/gi, '***');
  }

  /**
   * Get error statistics
   */
  getErrorStats(): any {
    const stats: any = {};
    
    for (const [key, count] of this.errorStats.entries()) {
      const [category, errorType] = key.split(':');
      if (!stats[category]) {
        stats[category] = {};
      }
      stats[category][errorType] = count;
    }
    
    return stats;
  }

  /**
   * Clear error statistics
   */
  clearErrorStats(): void {
    this.errorStats.clear();
  }

  /**
   * Handle async operations with error catching
   */
  async safeExecute<T>(
    operation: () => Promise<T>,
    context: ErrorContext = {},
    fallback?: T
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error as Error, context);
      return fallback;
    }
  }

  /**
   * Validate and sanitize input
   */
  validateInput(input: any, rules: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const [field, rule] of Object.entries(rules)) {
      const value = input[field];
      const ruleObj = rule as any;
      
      if (ruleObj.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} là bắt buộc`);
        continue;
      }
      
      if (value !== undefined && ruleObj.type) {
        if (ruleObj.type === 'string' && typeof value !== 'string') {
          errors.push(`${field} phải là chuỗi`);
        } else if (ruleObj.type === 'number' && typeof value !== 'number') {
          errors.push(`${field} phải là số`);
        } else if (ruleObj.type === 'email' && !this.isValidEmail(value)) {
          errors.push(`${field} phải là email hợp lệ`);
        }
      }
      
      if (value !== undefined && ruleObj.minLength && value.length < ruleObj.minLength) {
        errors.push(`${field} phải có ít nhất ${ruleObj.minLength} ký tự`);
      }
      
      if (value !== undefined && ruleObj.maxLength && value.length > ruleObj.maxLength) {
        errors.push(`${field} phải có tối đa ${ruleObj.maxLength} ký tự`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Simple email validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
