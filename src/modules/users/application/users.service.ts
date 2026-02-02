import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../domain/user.repository';
import { User } from '../domain/user.entity';
import { UserRole } from '.prisma/sc_identity';

@Injectable()
export class UsersService {
  constructor(private readonly repo: IUserRepository) {}

  async getById(id: string): Promise<User | null> {
    return this.repo.findById(id);
  }

  async getByUsername(username: string): Promise<User | null> {
    return this.repo.findByUsername(username);
  }

  async updateRoleUser(id: string, role: UserRole): Promise<User | null> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.repo.updateRoleUser(id, role);
  }
}
