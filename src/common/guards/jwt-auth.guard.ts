// src/common/guards/jwt-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { RolePrefixMap } from '../../config/role-prefix.config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) throw new UnauthorizedException('Token không hợp lệ hoặc chưa đăng nhập.');

    // ✅ Role prefix check
    const path = req.originalUrl.split('?')[0].replace(/^\/api(\/v\d+)?/, '');
    const matchedPrefix = Object.keys(RolePrefixMap).find((prefix) =>
      path.startsWith(prefix),
    );

    if (matchedPrefix) {
      const allowedRoles = RolePrefixMap[matchedPrefix].map((r) => r.toUpperCase());
      const userRoles = (user.roles as string[]).map((r) => r.toUpperCase());
      const hasAccess = allowedRoles.some((r) => userRoles.includes(r));

      if (!hasAccess) {
        throw new ForbiddenException(
          `Access denied: [${req.method}] ${req.originalUrl} | Required: ${allowedRoles.join(', ')} | User: ${userRoles.join(', ')}`,
        );
      }
    }

    return true;
  }
}
