import { Logger, Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { IUserRepository } from './domain/user.repository';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { UsersService } from './application/users.service';
import { RequestUserProvider } from '../../common/request-user.provider';

@Module({
  providers: [
    PrismaService,
    UsersService,
    RequestUserProvider,
    Logger,
    { provide: IUserRepository, useClass: PrismaUserRepository },
  ],
  exports: [UsersService, IUserRepository],
})
export class UsersModule {}
