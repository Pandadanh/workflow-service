import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Injectable()
export class OtpThrottleGuard implements CanActivate {
  private readonly logger = new Logger(OtpThrottleGuard.name);
  private readonly requestMap = new Map<string, number[]>();
  private readonly maxAttempts = 3;
  private readonly timeWindow = 60000; // 1 minute

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Get request history for this IP
    const timestamps = this.requestMap.get(ip) || [];
    
    // Remove timestamps outside the time window
    const recentTimestamps = timestamps.filter(t => now - t < this.timeWindow);
    
    if (recentTimestamps.length >= this.maxAttempts) {
      this.logger.warn(`Rate limit exceeded for IP: ${ip}`);
      throw new HttpException(
        'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    
    // Add current timestamp
    recentTimestamps.push(now);
    this.requestMap.set(ip, recentTimestamps);
    
    // Clean up old entries periodically
    if (this.requestMap.size > 1000) {
      this.cleanup();
    }
    
    return true;
  }

  private cleanup() {
    const now = Date.now();
    for (const [ip, timestamps] of this.requestMap.entries()) {
      const recent = timestamps.filter(t => now - t < this.timeWindow);
      if (recent.length === 0) {
        this.requestMap.delete(ip);
      } else {
        this.requestMap.set(ip, recent);
      }
    }
  }
}

