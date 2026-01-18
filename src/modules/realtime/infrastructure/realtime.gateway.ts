import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

import { RealtimeService } from '../applications/realtime.service';
import { JoinRoomDto } from '../dto/join-room.dto';
import { SendMessageDto } from '../dto/send-message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@UsePipes(new ValidationPipe({ transform: true }))
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(private readonly realtimeService: RealtimeService) {}

  handleConnection(client: Socket) {}

  handleDisconnect(client: Socket) {}

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinRoomDto,
  ) {
    await client.join(dto.room);
    const history = await this.realtimeService.getRecentMessages(dto.room);

    client.emit('joined_room', {
      room: dto.room,
      history,
    });
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const payload = await this.realtimeService.createMessage(dto);
    this.server.to(dto.room).emit('message', payload);
  }
}
