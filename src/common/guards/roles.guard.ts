import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = ctx.switchToHttp().getRequest();
    const user = request.user as { roles?: Role[] };

    if (!user?.roles) {
      throw new ForbiddenException('Missing roles');
    }

    const hasRole = requiredRoles.some((r) => user.roles?.includes(r));
    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient role: required [${requiredRoles.join(', ')}], got [${user.roles.join(', ')}]`,
      );
    }

    return true;
  }
}
