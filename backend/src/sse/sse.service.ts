import { Injectable, Inject } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { map, filter, finalize } from 'rxjs/operators';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';

// 定义SSE事件接口
export interface SseEvent {
  entity: 'tag' | 'list' | 'todo' | 'system';
  type?: "create" | "update" | "delete" | "update_with_children" | "connected" | "heartbeat";
  action?: "update_tree_node_with_children";
  parent?: any;
  childrenChanges?: { add?: any[], update?: any[], delete?: any[] };
  [key: string]: any;
}

// 定义用户连接信息接口
interface UserConnection {
  userId: string;
  connectionId: string; // 添加连接ID，用于标识不同设备的连接
  subject: Subject<SseEvent>;
  cleanup: () => void;
  lastActivity: Date;
}

@Injectable()
export class SseService {
  // 修改为支持一个用户多个连接的映射表
  private userConnections: Map<string, UserConnection[]> = new Map();
  private heartbeatIntervalId: NodeJS.Timeout | null = null;
  
  constructor(
    @Inject(EventEmitter2)
    private eventEmitter: EventEmitter2,
    private jwtService: JwtService,
    private userService: UserService,
  ) {
    // 启动连接清理定时器
    this.startConnectionCleanup();
    // 启动心跳定时器
    this.startHeartbeatInterval();
  }

  /**
   * 为指定用户创建SSE连接
   * @param userId 用户ID
   * @returns Observable<SseEvent>
   */
  createSseStream(userId: string): Observable<SseEvent> {
    console.log(`尝试为用户 ${userId} 建立SSE连接`);
    
    // 生成唯一的连接ID
    const connectionId = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`为用户 ${userId} 生成连接ID: ${connectionId}`);

    const subject = new Subject<SseEvent>();
    
    // 如果用户还没有连接列表，创建一个空数组
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, []);
    }

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
        
        // 获取用户的所有活跃连接
        const userConnectionList = this.userConnections.get(userId);
        if (userConnectionList) {
          console.log(`向用户 ${userId} 的 ${userConnectionList.length} 个连接广播标签更新事件`);
          
          // 广播事件到用户的所有连接
          userConnectionList.forEach(conn => {
            if (!conn.subject.closed) {
              conn.subject.next(eventData);
              this.updateUserActivity(userId, conn.connectionId);
            }
          });
        }
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
        
        // 获取用户的所有活跃连接
        const userConnectionList = this.userConnections.get(userId);
        if (userConnectionList) {
          console.log(`向用户 ${userId} 的 ${userConnectionList.length} 个连接广播清单更新事件`);
          
          // 广播事件到用户的所有连接
          userConnectionList.forEach(conn => {
            if (!conn.subject.closed) {
              conn.subject.next(eventData);
              this.updateUserActivity(userId, conn.connectionId);
            }
          });
        }
      }
    };

    // 监听todo.updated事件（如果需要）
    const todoListener = (event: any) => {
      // 只发送给任务所属的用户
      if (event.userId === userId) {
        const eventData: SseEvent = {
          entity: 'todo' as const,
          action: event.action,
          parent: event.parent,
          childrenChanges: event.childrenChanges
        };
        
        // 获取用户的所有活跃连接
        const userConnectionList = this.userConnections.get(userId);
        if (userConnectionList) {
          console.log(`向用户 ${userId} 的 ${userConnectionList.length} 个连接广播任务更新事件`);
          
          // 广播事件到用户的所有连接
          userConnectionList.forEach(conn => {
            if (!conn.subject.closed) {
              conn.subject.next(eventData);
              this.updateUserActivity(userId, conn.connectionId);
            }
          });
        }
      }
    };

    // 清理函数，在连接关闭时移除监听器
    const cleanup = () => {
      console.log(`清理用户 ${userId} 的连接 ${connectionId}`);
      this.eventEmitter.off('tag.updated', tagListener);
      this.eventEmitter.off('list.updated', listListener);
      this.eventEmitter.off('todo.updated', todoListener);
      this.closeConnection(userId, connectionId);
    };

    // 注册事件监听器
    this.eventEmitter.on('tag.updated', tagListener);
    this.eventEmitter.on('list.updated', listListener);
    this.eventEmitter.on('todo.updated', todoListener);
    console.log(`已为用户 ${userId} 注册SSE事件监听器`);

    // 存储用户连接信息
    const connection: UserConnection = {
      userId,
      connectionId,
      subject,
      cleanup,
      lastActivity: new Date(),
    };
    
    // 将新连接添加到用户的连接列表中
    const userConnectionList = this.userConnections.get(userId)!;
    userConnectionList.push(connection);
    
    // 计算所有用户的总连接数
    let totalConnections = 0;
    this.userConnections.forEach(connections => {
      totalConnections += connections.length;
    });
    
    console.log(`用户 ${userId} 的连接 ${connectionId} 已创建，用户当前连接数: ${userConnectionList.length}，总活跃连接数: ${totalConnections}`);

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
   * 关闭特定的用户连接
   */
  private closeConnection(userId: string, connectionId: string): void {
    const userConnectionList = this.userConnections.get(userId);
    if (userConnectionList) {
      const connectionIndex = userConnectionList.findIndex(conn => conn.connectionId === connectionId);
      
      if (connectionIndex !== -1) {
        const connection = userConnectionList[connectionIndex];
        
        // 完成Subject
        if (!connection.subject.closed) {
          connection.subject.complete();
        }
        
        // 从连接列表中移除
        userConnectionList.splice(connectionIndex, 1);
        
        // 如果用户没有连接了，从映射表中删除该用户
        if (userConnectionList.length === 0) {
          this.userConnections.delete(userId);
          console.log(`用户 ${userId} 所有连接已清理，已从映射表中删除`);
        } else {
          console.log(`用户 ${userId} 的连接 ${connectionId} 已清理，剩余连接数: ${userConnectionList.length}`);
        }
        
        // 计算所有用户的总连接数
        let totalConnections = 0;
        this.userConnections.forEach(connections => {
          totalConnections += connections.length;
        });
        
        console.log(`剩余总活跃连接数: ${totalConnections}`);
      }
    }
  }
  
  /**
   * 关闭用户的所有连接（可选，用于特殊情况）
   */
  private closeAllUserConnections(userId: string): void {
    const userConnectionList = this.userConnections.get(userId);
    if (userConnectionList) {
      // 关闭所有连接
      userConnectionList.forEach(connection => {
        if (!connection.subject.closed) {
          connection.subject.complete();
        }
      });
      
      // 从映射表中删除
      this.userConnections.delete(userId);
      console.log(`用户 ${userId} 的所有 ${userConnectionList.length} 个连接已关闭`);
      
      // 计算所有用户的总连接数
      let totalConnections = 0;
      this.userConnections.forEach(connections => {
        totalConnections += connections.length;
      });
      
      console.log(`剩余总活跃连接数: ${totalConnections}`);
    }
  }

  /**
   * 更新特定连接的最后活动时间
   */
  private updateUserActivity(userId: string, connectionId: string): void {
    const userConnectionList = this.userConnections.get(userId);
    if (userConnectionList) {
      const connection = userConnectionList.find(conn => conn.connectionId === connectionId);
      if (connection) {
        connection.lastActivity = new Date();
      }
    }
  }

  /**
   * 启动定期清理过期连接的定时器
   */
  private startConnectionCleanup(): void {
    // 每15分钟清理一次过期连接
    setInterval(() => {
      this.cleanupExpiredConnections();
    }, 15 * 60 * 1000);
  }

  /**
   * 启动定期发送心跳事件的定时器
   */
  private startHeartbeatInterval(): void {
    // 每30秒发送一次心跳事件
    this.heartbeatIntervalId = setInterval(() => {
      this.sendHeartbeatToAllConnections();
    }, 30 * 1000);
    console.log('SSE心跳机制已启动，每30秒发送一次心跳事件');
  }

  /**
   * 向所有活跃连接发送心跳事件
   */
  private sendHeartbeatToAllConnections(): void {
    const heartbeatEvent: SseEvent = {
      entity: 'system',
      type: 'heartbeat',
      timestamp: new Date(),
      message: 'SSE心跳事件'
    };

    let sentCount = 0;
    
    // 向所有用户的所有连接发送心跳事件
    this.userConnections.forEach((userConnectionList, userId) => {
      userConnectionList.forEach(connection => {
        if (!connection.subject.closed) {
          connection.subject.next(heartbeatEvent);
          this.updateUserActivity(userId, connection.connectionId);
          sentCount++;
        }
      });
    });

    if (sentCount > 0) {
      console.log(`已向 ${sentCount} 个活跃连接发送心跳事件`);
    }
  }

  /**
   * 清理过期连接（超过15分钟无活动的连接）
   */
  private cleanupExpiredConnections(): void {
    const now = new Date();
    const expirationTime = new Date(now.getTime() - 15 * 60 * 1000); // 15分钟前
    
    // 计算所有用户的总连接数
    let totalConnections = 0;
    this.userConnections.forEach(connections => {
      totalConnections += connections.length;
    });
    
    console.log(`开始清理过期连接，当前总连接数: ${totalConnections}`);
    
    let cleanedCount = 0;
    
    // 遍历所有用户
    this.userConnections.forEach((userConnectionList, userId) => {
      // 创建一个副本进行遍历，避免在遍历过程中修改数组
      [...userConnectionList].forEach(connection => {
        if (connection.lastActivity < expirationTime) {
          console.log(`清理过期连接，用户: ${userId}，连接ID: ${connection.connectionId}，最后活动时间: ${connection.lastActivity}`);
          
          // 完成Subject
          if (!connection.subject.closed) {
            connection.subject.complete();
          }
          
          // 从连接列表中移除
          const connectionIndex = userConnectionList.findIndex(conn => conn.connectionId === connection.connectionId);
          if (connectionIndex !== -1) {
            userConnectionList.splice(connectionIndex, 1);
            cleanedCount++;
          }
        }
      });
      
      // 如果用户没有连接了，从映射表中删除该用户
      if (userConnectionList.length === 0) {
        this.userConnections.delete(userId);
      }
    });
    
    // 重新计算剩余连接数
    totalConnections = 0;
    this.userConnections.forEach(connections => {
      totalConnections += connections.length;
    });
    
    console.log(`连接清理完成，清理了 ${cleanedCount} 个过期连接，剩余 ${totalConnections} 个连接`);
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
    let totalConnections = 0;
    this.userConnections.forEach(connections => {
      totalConnections += connections.length;
    });
    return totalConnections;
  }
  
  /**
   * 获取指定用户的连接数
   */
  getUserConnectionCount(userId: string): number {
    const userConnectionList = this.userConnections.get(userId);
    return userConnectionList ? userConnectionList.length : 0;
  }
}