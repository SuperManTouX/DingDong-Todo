import { Injectable, Inject } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { map, filter, finalize } from 'rxjs/operators';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';

// 定义SSE事件接口
export interface SseEvent {
  entity: 'tag' | 'list' | 'todo' | 'system';
  type: "create" | "update" | "delete" | "update_with_children" | "connected";
  [key: string]: any;
}

// 定义用户连接信息接口
interface UserConnection {
  userId: string;
  subject: Subject<SseEvent>;
  cleanup: () => void;
  lastActivity: Date;
}

@Injectable()
export class SseService {
  // 用户连接映射表
  private userConnections: Map<string, UserConnection> = new Map();
  
  constructor(
    @Inject(EventEmitter2)
    private eventEmitter: EventEmitter2,
    private jwtService: JwtService,
    private userService: UserService,
  ) {
    // 启动连接清理定时器
    this.startConnectionCleanup();
  }

  /**
   * 为指定用户创建SSE连接
   * @param userId 用户ID
   * @returns Observable<SseEvent>
   */
  createSseStream(userId: string): Observable<SseEvent> {
    console.log(`尝试为用户 ${userId} 建立SSE连接`);
    
    // 检查用户是否已有活跃连接
    if (this.userConnections.has(userId)) {
      console.log(`用户 ${userId} 已有活跃连接，关闭旧连接`);
      // 关闭旧连接
      this.closeUserConnection(userId);
    }

    const subject = new Subject<SseEvent>();

    // 监听tag.updated事件
    const tagListener = (event: any) => {
      // 只发送给标签所属的用户
      if (event.userId === userId) {
        const eventData: SseEvent = {
          entity: 'tag' as const,
          type: event.type,
          tag: event.tag,
          tagId: event.tagId,
          timestamp: event.timestamp,
        };
        console.log(`向用户 ${userId} 发送标签更新事件:`, eventData);
        subject.next(eventData);
        this.updateUserActivity(userId);
      }
    };

    // 监听list.updated事件
    const listListener = (event: any) => {
      // 只发送给清单所属的用户
      if (event.userId === userId) {
        const eventData: SseEvent = {
          entity: 'list' as const,
          type: event.type,
          list: event.list,
          listId: event.listId,
          targetListId: event.targetListId,
          mode: event.mode,
          timestamp: event.timestamp,
        };
        console.log(`向用户 ${userId} 发送清单更新事件:`, eventData);
        subject.next(eventData);
        this.updateUserActivity(userId);
      }
    };

    // 监听todo.updated事件（如果需要）
    const todoListener = (event: any) => {
      // 只发送给任务所属的用户
      if (event.userId === userId) {
        const eventData: SseEvent = {
          entity: 'todo' as const,
          type: event.type,
          todo: event.todo,
          todoId: event.todoId,
          todoIds: event.todoIds,
          updateData: event.updateData,
          timestamp: event.timestamp,
        };
        console.log(`向用户 ${userId} 发送任务更新事件:`, eventData);
        subject.next(eventData);
        this.updateUserActivity(userId);
      }
    };

    // 清理函数，在连接关闭时移除监听器
    const cleanup = () => {
      console.log(`清理用户 ${userId} 的SSE连接`);
      this.eventEmitter.off('tag.updated', tagListener);
      this.eventEmitter.off('list.updated', listListener);
      this.eventEmitter.off('todo.updated', todoListener);
      this.closeUserConnection(userId);
    };

    // 注册事件监听器
    this.eventEmitter.on('tag.updated', tagListener);
    this.eventEmitter.on('list.updated', listListener);
    this.eventEmitter.on('todo.updated', todoListener);
    console.log(`已为用户 ${userId} 注册SSE事件监听器`);

    // 存储用户连接信息
    const connection: UserConnection = {
      userId,
      subject,
      cleanup,
      lastActivity: new Date(),
    };
    
    this.userConnections.set(userId, connection);
    console.log(`用户 ${userId} SSE连接已创建，当前活跃连接数: ${this.userConnections.size}`);

    // 发送一个连接确认事件
    subject.next({
      entity: 'system',
      type: 'connected',
      message: 'SSE连接已成功建立',
      timestamp: new Date(),
    });

    // 返回subject作为Observable，并在完成时清理
    return subject.asObservable().pipe(
      finalize(() => cleanup())
    );
  }

  /**
   * 关闭用户连接
   */
  private closeUserConnection(userId: string): void {
    const connection = this.userConnections.get(userId);
    if (connection) {
      // 完成Subject
      if (!connection.subject.closed) {
        connection.subject.complete();
      }
      
      // 从映射表中删除
      this.userConnections.delete(userId);
      console.log(`用户 ${userId} 连接已完全清理，剩余活跃连接数: ${this.userConnections.size}`);
    }
  }

  /**
   * 更新用户的最后活动时间
   */
  private updateUserActivity(userId: string): void {
    const connection = this.userConnections.get(userId);
    if (connection) {
      connection.lastActivity = new Date();
    }
  }

  /**
   * 启动定期清理过期连接的定时器
   */
  private startConnectionCleanup(): void {
    // 每小时清理一次过期连接
    setInterval(() => {
      this.cleanupExpiredConnections();
    }, 60 * 60 * 1000);
  }

  /**
   * 清理过期连接（超过24小时无活动的连接）
   */
  private cleanupExpiredConnections(): void {
    const now = new Date();
    const expirationTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24小时前
    
    console.log(`开始清理过期连接，当前连接数: ${this.userConnections.size}`);
    
    let cleanedCount = 0;
    this.userConnections.forEach((connection, userId) => {
      if (connection.lastActivity < expirationTime) {
        console.log(`清理过期连接，用户: ${userId}，最后活动时间: ${connection.lastActivity}`);
        this.closeUserConnection(userId);
        cleanedCount++;
      }
    });
    
    console.log(`连接清理完成，清理了 ${cleanedCount} 个过期连接，剩余 ${this.userConnections.size} 个连接`);
  }

  /**
   * 验证用户token并获取用户ID
   * @param token JWT token
   * @returns Promise<string> 用户ID
   */
  async validateToken(token: string): Promise<string> {
    try {
      console.log('尝试验证token，token长度:', token.length);
      // 为了调试，先不实际验证token，直接返回一个测试用户ID
      // 后续可以恢复正常验证
      // const decoded = this.jwtService.verify(token);
      // console.log('Token验证成功，decoded:', decoded);
      // return decoded.sub;
      console.log('跳过实际token验证，返回测试用户ID: user-001');
      return 'user-001';
    } catch (error) {
      console.error('Token验证失败:', error.message || error);
      throw new Error('无效的认证token');
    }
  }

  /**
   * 根据用户ID获取用户信息
   * @param userId 用户ID
   * @returns Promise<any>
   */
  async getUserInfo(userId: string): Promise<any> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new Error('找不到用户信息');
    }
    return user;
  }
  
  /**
   * 获取当前活跃连接数
   */
  getActiveConnectionCount(): number {
    return this.userConnections.size;
  }
}