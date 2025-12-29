import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);
  private readonly saltRounds = 12;

  /**
   * Generate secure random string
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate secure UUID
   */
  generateSecureUuid(): string {
    return crypto.randomUUID();
  }

  /**
   * Hash password with bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify password
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generate secure OTP
   */
  generateSecureOtp(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    
    return otp;
  }

  /**
   * Hash sensitive data
   */
  hashData(data: string, salt?: string): string {
    const actualSalt = salt || this.generateSecureToken(16);
    return crypto.createHash('sha256').update(data + actualSalt).digest('hex');
  }

  /**
   * Verify hashed data
   */
  verifyHashedData(data: string, hash: string, salt: string): boolean {
    const computedHash = this.hashData(data, salt);
    return computedHash === hash;
  }

  /**
   * Sanitize input to prevent injection attacks
   */
  sanitizeInput(input: string): string {
    if (!input) return '';
    
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .replace(/[;]/g, '') // Remove semicolons
      .replace(/[()]/g, '') // Remove parentheses
      .trim();
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format (Vietnamese)
   */
  isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8,9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Check if string contains suspicious patterns
   */
  containsSuspiciousPattern(input: string): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /expression\s*\(/i,
      /vbscript:/i,
      /data:/i,
      /vbscript:/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Rate limiting check with sliding window
   */
  async checkRateLimit(
    identifier: string,
    limit: number,
    windowMs: number,
    redisService: any
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const window = Math.floor(now / windowMs);

    try {
      const current = await redisService.get(`${key}:${window}`);
      const count = current ? parseInt(current) : 0;

      if (count >= limit) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: (window + 1) * windowMs,
        };
      }

      // Increment counter
      await redisService.set(`${key}:${window}`, (count + 1).toString(), 60); // 1 minute TTL

      return {
        allowed: true,
        remaining: limit - count - 1,
        resetTime: (window + 1) * windowMs,
      };
    } catch (error) {
      this.logger.error('Rate limit check failed:', error);
      // Fail open - allow request if rate limiting fails
      return {
        allowed: true,
        remaining: limit,
        resetTime: now + windowMs,
      };
    }
  }

  /**
   * Generate CSRF token
   */
  generateCsrfToken(): string {
    return this.generateSecureToken(32);
  }

  /**
   * Validate CSRF token
   */
  validateCsrfToken(token: string, sessionToken: string): boolean {
    return token === sessionToken && token.length === 64;
  }

  /**
   * Check for SQL injection patterns
   */
  containsSqlInjection(input: string): boolean {
    const sqlPatterns = [
      /('|(\\')|(;)|(\-\-)|(\s+or\s+)|(\s+and\s+))/i,
      /(union\s+select)/i,
      /(drop\s+table)/i,
      /(delete\s+from)/i,
      /(insert\s+into)/i,
      /(update\s+set)/i,
      /(exec\s*\()/i,
      /(execute\s*\()/i,
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Log security events
   */
  logSecurityEvent(
    event: string,
    details: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    const logData = {
      event,
      details,
      severity,
      timestamp: new Date().toISOString(),
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown',
    };

    switch (severity) {
      case 'critical':
        this.logger.error(`SECURITY CRITICAL: ${event}`, logData);
        break;
      case 'high':
        this.logger.warn(`SECURITY HIGH: ${event}`, logData);
        break;
      case 'medium':
        this.logger.warn(`SECURITY MEDIUM: ${event}`, logData);
        break;
      case 'low':
        this.logger.log(`SECURITY LOW: ${event}`, logData);
        break;
    }
  }
}
