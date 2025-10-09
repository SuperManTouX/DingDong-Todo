import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// 用于存储用户连接信息
interface UserConnection {
  userId: string;
  socketId: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', // 在生产环境中应该设置为具体的前端域名
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/todo',
})
export class TodoWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // 存储用户连接映射
  private userConnections: Map<string, string[]> = new Map(); // userId => [socketId1, socketId2]

  constructor(private jwtService: JwtService) {}

  // 处理新的连接
  async handleConnection(client: Socket) {
    try {
      // 从握手查询参数中获取token
      const token = client.handshake.query.token as string;
      if (!token) {
        client.disconnect(true);
        return;
      }

      // 验证token并获取用户信息
      const decoded = this.jwtService.verify(token);
      const userId = decoded.sub; // 从JWT的sub字段获取用户ID

      if (!userId) {
        client.disconnect(true);
        return;
      }

      // 存储用户连接信息
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, []);
      }
      this.userConnections.get(userId)!.push(client.id);

      console.log(`用户 ${userId} 已连接，Socket ID: ${client.id}`);
      console.log(`当前连接数: ${this.getUserConnectionsCount()}`);

      // 向客户端发送连接确认
      client.emit('connected', { userId, socketId: client.id });
    } catch (error) {
      console.error('WebSocket连接验证失败:', error);
      client.disconnect(true);
    }
  }

  // 处理断开连接
  handleDisconnect(client: Socket) {
    // 查找并移除对应的用户连接
    for (const [userId, socketIds] of this.userConnections.entries()) {
      const index = socketIds.indexOf(client.id);
      if (index !== -1) {
        socketIds.splice(index, 1);
        console.log(`用户 ${userId} 已断开连接，Socket ID: ${client.id}`);
        
        // 如果用户没有其他连接，则从映射中移除
        if (socketIds.length === 0) {
          this.userConnections.delete(userId);
        }
        break;
      }
    }
    console.log(`当前连接数: ${this.getUserConnectionsCount()}`);
  }

  // 接收任务更新消息并广播给用户的所有连接
  @SubscribeMessage('task:updated')
  handleTaskUpdated(@MessageBody() data: any) {
    const { userId, taskId, timestamp } = data;
    console.log(`接收到任务更新事件: 用户 ${userId}, 任务 ${taskId}, 时间 ${timestamp}`);
    
    // 广播给用户的所有连接
    this.broadcastToUser(userId, 'task:updated', data);
  }

  // 接收任务创建消息并广播给用户的所有连接
  @SubscribeMessage('task:created')
  handleTaskCreated(@MessageBody() data: any) {
    const { userId, taskId, timestamp } = data;
    console.log(`接收到任务创建事件: 用户 ${userId}, 任务 ${taskId}, 时间 ${timestamp}`);
    
    // 广播给用户的所有连接
    this.broadcastToUser(userId, 'task:created', data);
  }

  // 接收任务删除消息并广播给用户的所有连接
  @SubscribeMessage('task:deleted')
  handleTaskDeleted(@MessageBody() data: any) {
    const { userId, taskId, timestamp } = data;
    console.log(`接收到任务删除事件: 用户 ${userId}, 任务 ${taskId}, 时间 ${timestamp}`);
    
    // 广播给用户的所有连接
    this.broadcastToUser(userId, 'task:deleted', data);
  }

  // 向用户的所有连接广播消息
  private broadcastToUser(userId: string, event: string, data: any) {
    const socketIds = this.userConnections.get(userId);
    if (socketIds && socketIds.length > 0) {
      socketIds.forEach(socketId => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  // 获取总的连接数
  private getUserConnectionsCount(): number {
    let count = 0;
    for (const socketIds of this.userConnections.values()) {
      count += socketIds.length;
    }
    return count;
  }
}