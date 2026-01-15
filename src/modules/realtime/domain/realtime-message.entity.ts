export type RealtimeMessageType = 'system' | 'chat' | 'booking';

export class RealtimeMessage {
  constructor(
    public readonly room: string,
    public readonly content: string,
    public readonly type: RealtimeMessageType = 'chat',
    public readonly senderId?: string,
  ) {}
}
