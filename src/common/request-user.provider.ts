import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class RequestUserProvider {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  get userId(): string | undefined {
    return (this.request as any)?.user?.userId;
  }

  get user(): any {
    return (this.request as any)?.user;
  }

  get role(): string | undefined {
    return (this.request as any)?.user.role;
  }
}
