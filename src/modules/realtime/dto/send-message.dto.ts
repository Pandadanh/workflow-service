import { IsOptional, IsString } from 'class-validator';
import type { RealtimeMessageType } from '../domain/realtime-message.entity';

export class SendMessageDto {
  @IsString()
  room: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  senderId: string;

  @IsOptional()
  @IsString()
  type?: RealtimeMessageType;
}
