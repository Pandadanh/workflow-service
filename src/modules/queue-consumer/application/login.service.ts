import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { LoginStep2Dto } from '../dto/login-step2.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async loginStep2(loginStep2Dto: LoginStep2Dto): Promise<{ success: boolean; message: string; user?: any }> {
    const { userId, password } = loginStep2Dto;

    try {
      // Find user by userId
      const user = await this.prismaService.identity.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          password: true,
          roles: true,
          is_active: true,
        },
      });

      if (!user) {
        this.logger.warn(`User not found for userId: ${userId}`);
        throw new UnauthorizedException('User not found');
      }

      if (!user.is_active) {
        this.logger.warn(`User account is inactive: ${userId}`);
        throw new UnauthorizedException('Account is inactive');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Invalid password for user: ${userId}`);
        throw new UnauthorizedException('Invalid password');
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      this.logger.log(`Login successful for user: ${user.email} (${userId})`);

      return {
        success: true,
        message: 'Login successful',
        user: userWithoutPassword,
      };
    } catch (error) {
      this.logger.error(`Login failed for userId ${userId}:`, error);
      throw error;
    }
  }
}
