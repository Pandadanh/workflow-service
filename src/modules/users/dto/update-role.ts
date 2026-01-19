import { IsEnum } from 'class-validator';
import { UserRole } from '.prisma/sc_identity';

export class UpdateRoleDto {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  @IsEnum(UserRole, { message: 'Invalid role value' })
  role!: UserRole;
}
