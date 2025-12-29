import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RequestUserProvider } from '../request-user.provider';

@Injectable()
export class UserThrottleGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use user ID for tracking instead of IP
    const userId = req.user?.sub || req.user?.userId;
    if (userId) {
      return `user:${userId}`;
    }
    
    // Fallback to IP if no user ID
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    // Skip throttling for MoMo IPN callback
    const request = context.switchToHttp().getRequest();
    if (request.url?.includes('/payment/momo/ipn')) {
      return true;
    }
    
    return super.shouldSkip(context);
  }
}
