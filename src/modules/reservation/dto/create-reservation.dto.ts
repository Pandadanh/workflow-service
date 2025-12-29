import { IsOptional, IsUUID } from 'class-validator';

export class CreateReservationDto {
  @IsUUID()
  court_id: string;

  @IsUUID()
  host_id: string;

  @IsUUID()
  @IsOptional()
  created_by: string;

  @IsUUID()
  @IsOptional()
  updated_by: string;
}


