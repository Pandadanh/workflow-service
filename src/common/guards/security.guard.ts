import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SecurityService } from '../services/security.service';
import { ErrorHandlerService } from '../services/error-handler.service';

@Injectable()
export class SecurityGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private securityService: SecurityService,
    private errorHandler: ErrorHandlerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Get request information
    const ip = request.ip || request.connection.remoteAddress || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';
    const endpoint = request.url;
    const method = request.method;
    
    const contextInfo = {
      ip,
      userAgent,
      endpoint,
      method,
      timestamp: new Date().toISOString(),
    };

    try {
      // 1. Check for suspicious patterns in request
      await this.checkSuspiciousPatterns(request, contextInfo);
      
      // 2. Validate input for potential attacks
      await this.validateInputSecurity(request, contextInfo);
      
      // 3. Check rate limiting
      await this.checkRateLimit(ip, endpoint, contextInfo);
      
      // 4. Add security headers
      this.addSecurityHeaders(response);
      
      return true;
    } catch (error) {
      this.securityService.logSecurityEvent(
        'Security check failed',
        {
          ...contextInfo,
          error: error.message,
        },
        'high'
      );
      
      throw error;
    }
  }

  private async checkSuspiciousPatterns(request: any, context: any): Promise<void> {
    const { body, query, params } = request;
    const allInput = { ...body, ...query, ...params };
    
    for (const [key, value] of Object.entries(allInput)) {
      if (typeof value === 'string') {
        // Check for XSS patterns
        if (this.securityService.containsSuspiciousPattern(value)) {
          this.securityService.logSecurityEvent(
            'XSS attempt detected',
            { ...context, field: key, value },
            'high'
          );
          throw new ForbiddenException('Request contains suspicious content');
        }
        
        // Check for SQL injection
        if (this.securityService.containsSqlInjection(value)) {
          this.securityService.logSecurityEvent(
            'SQL injection attempt detected',
            { ...context, field: key, value },
            'critical'
          );
          throw new ForbiddenException('Request contains suspicious content');
        }
      }
    }
  }

  private async validateInputSecurity(request: any, context: any): Promise<void> {
    const { body } = request;
    
    if (body) {
      // Check for excessive payload size
      const payloadSize = JSON.stringify(body).length;
      if (payloadSize > 1024 * 1024) { // 1MB limit
        this.securityService.logSecurityEvent(
          'Oversized payload detected',
          { ...context, payloadSize },
          'medium'
        );
        throw new ForbiddenException('Payload too large');
      }
      
      // Check for nested object depth
      const depth = this.getObjectDepth(body);
      if (depth > 10) {
        this.securityService.logSecurityEvent(
          'Deeply nested object detected',
          { ...context, depth },
          'medium'
        );
        throw new ForbiddenException('Object nesting too deep');
      }
    }
  }

  private async checkRateLimit(ip: string, endpoint: string, context: any): Promise<void> {
    // This would integrate with your rate limiting service
    // For now, we'll do a simple check
    
    const rateLimitKey = `security:${ip}:${endpoint}`;
    // You would implement actual rate limiting here
    // For demonstration, we'll just log the check
    this.securityService.logSecurityEvent(
      'Rate limit check',
      { ...context, rateLimitKey },
      'low'
    );
  }

  private addSecurityHeaders(response: any): void {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('X-XSS-Protection', '1; mode=block');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Content-Security-Policy', "default-src 'self'");
  }

  private getObjectDepth(obj: any, depth: number = 0): number {
    if (typeof obj !== 'object' || obj === null) {
      return depth;
    }
    
    let maxDepth = depth;
    for (const value of Object.values(obj)) {
      if (typeof value === 'object' && value !== null) {
        maxDepth = Math.max(maxDepth, this.getObjectDepth(value, depth + 1));
      }
    }
    
    return maxDepth;
  }
}
