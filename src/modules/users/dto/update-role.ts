import { IsEnum } from 'class-validator';
import { UserRole } from '../../../../generated/prisma/sc_identity/client';

export class UpdateRoleDto {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  @IsEnum(UserRole, { message: 'Invalid role value' })
  role!: UserRole;
}
