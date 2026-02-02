import { UserRole } from '.prisma/sc_identity';
import { User } from './user.entity';

export abstract class IUserRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract findByUsername(username: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract create(data: Partial<User>): Promise<User>;
  abstract updateRefreshToken(
    userId: string,
    tokenHash: string | null,
  ): Promise<void>;
  abstract updateRoleUser(userId: string, role: UserRole): Promise<User>;
}
