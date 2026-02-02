import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { IUserRepository } from '../domain/user.repository';
import { User } from '../domain/user.entity';
// import { PrismaClient } from '@prisma/client';
import { PrismaClient } from '.prisma/sc_identity';
import { UserRole } from '.prisma/sc_identity';
import { JsonValue } from '@prisma/client/runtime/library';

type PrismaUser = Awaited<ReturnType<PrismaClient['user']['findUnique']>>;

interface CreateUserInput {
  username?: string;
  email?: string | null;
  password?: string;
  roles?: string[] | string | UserRole[];
  is_active?: boolean;
  is_deleted?: boolean;
  properties?: JsonValue;
  created_by?: string | null;
  updated_by?: string | null;
}

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(
    private prisma: PrismaService,
  ) {}

  async findById(id: string): Promise<User | null> {
    const u = await this.prisma.identity.user.findUnique({ where: { id } });
    return u ? this.toDomain(u) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const u = await this.prisma.identity.user.findUnique({ where: { username } });
    return u ? this.toDomain(u) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const u = await this.prisma.identity.user.findUnique({ where: { email } });
    console.log(u);
    console.log(email);
    return u ? this.toDomain(u) : null;
  }

  async create(data: CreateUserInput): Promise<User> {
    let rolesArray: UserRole[] = [];

    if (Array.isArray(data.roles)) {
      rolesArray = data.roles as UserRole[];
    } else if (typeof data.roles === 'string') {
      rolesArray = data.roles
        .split(',')
        .map((r) => r.trim())
        .filter((r) => r.length > 0)
        .map((r) => r as UserRole);
    } else {
      rolesArray = [UserRole.user];
    }
    const u = await this.prisma.identity.user.create({
      data: {
        username: data.username ?? '',
        email: data.email ?? null,
        password: data.password ?? '',
        roles: { set: rolesArray },
        is_active: data.is_active ?? true,
        is_deleted: data.is_deleted ?? false,
        properties: data.properties ?? undefined,
        created_by: data.created_by ?? null,
        updated_by: data.updated_by ?? null,
      },
    });
    return this.toDomain(u);
  }

  async updateRefreshToken(userId: string, tokenHash: string | null): Promise<void> {
    // No-op: refreshToken is removed from User model
  }

  async updateRoleUser(userId: string, newRole: UserRole): Promise<User> {
    const user = await this.prisma.identity.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new Error('User not found');

    const currentRoles = user.roles ?? [];

    // Nếu chưa có role thì thêm vào
    if (!currentRoles.includes(newRole)) {
      currentRoles.push(newRole);
    }

    const updated = await this.prisma.identity.user.update({
      where: { id: userId },
      data: { roles: { set: currentRoles } },
    });

    return this.toDomain(updated);
  }

  private toDomain(u: PrismaUser): User {
    if (!u) throw new Error('User not found');
    return new User(
      u.id,
      u.username,
      u.email,
      u.password,
      u.roles,
      u.is_active,
      u.is_deleted,
      undefined,
      u.created_by,
      u.updated_by || undefined,
    );
  }
}
