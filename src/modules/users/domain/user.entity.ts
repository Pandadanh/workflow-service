import { JsonValue } from '@prisma/client/runtime/library';
import { UserRole } from '../../../../generated/prisma/sc_identity/client';

export class User {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly email: string | null,
    public readonly password: string,
    public readonly roles: UserRole[],
    public readonly is_active: boolean,
    public readonly is_deleted: boolean,
    public readonly refreshToken?: string | null,
    public readonly properties?: JsonValue | null,
    public readonly created_by?: string,
    public readonly updated_by?: string,
  ) {}
}
