import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user as { sub: string; username: string; role: string; email?: string };
  return data ? user?.[data as keyof typeof user] : user;
});
