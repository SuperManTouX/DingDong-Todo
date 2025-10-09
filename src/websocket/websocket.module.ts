import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TodoWebSocketGateway } from './websocket.gateway';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: {
        expiresIn: '24h',
      },
    }),
  ],
  providers: [TodoWebSocketGateway],
  exports: [TodoWebSocketGateway],
})
export class WebSocketModule {}