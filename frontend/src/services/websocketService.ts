import { io, Socket } from "socket.io-client";
import { useTodoStore } from "../store/todoStore";

class WebSocketService {
  private socket: Socket | null = null;
  private userId: string = "";
  private listeners: Map<string, Set<() => void>> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor() {
    this.setupEventHandlers();
  }

  // 连接到WebSocket服务器
  connect(userId: string): void {
    // 断开现有连接（如果存在）
    this.disconnect();

    // 从localStorage获取token
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("无法建立WebSocket连接：没有找到认证token");
      return;
    }

    this.userId = userId;

    // 构建WebSocket URL - 使用NestJS WebSocket网关的命名空间
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost = window.location.hostname;
    const wsPort =
      import.meta.env.MODE === "development" ? "3000" : window.location.port;
    const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}/todo`;

    console.log(`正在连接到WebSocket: ${wsUrl}`);

    this.socket = io(wsUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      query: {
        userId: userId,
        token: token,
      },
    });

    this.setupSocketListeners();
  }

  // 断开WebSocket连接
  disconnect(): void {
    if (this.socket) {
      console.log("断开WebSocket连接");
      this.socket.disconnect();
      this.socket = null;
      this.userId = "";
      this.reconnectAttempts = 0;
    }
  }

  // 发送事件到服务器
  emit(event: string, data: any): void {
    if (this.socket && this.socket.connected) {
      console.log(`发送WebSocket事件: ${event}`, data);
      this.socket.emit(event, data);
    } else {
      console.warn(`无法发送WebSocket事件: ${event}，连接未建立或已断开`);
    }
  }

  // 订阅事件
  subscribe(event: string, callback: () => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // 如果socket已经连接，直接监听
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // 取消订阅事件
  unsubscribe(event: string, callback: () => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }

    // 如果socket已经连接，移除监听
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // 设置事件处理器
  private setupEventHandlers(): void {
    // 这里可以设置全局事件处理器
  }

  // 设置Socket监听器
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // 连接成功
    this.socket.on("connect", () => {
      console.log("WebSocket连接成功");
      this.reconnectAttempts = 0;

      // 重新添加所有已注册的监听器
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach((callback) => {
          this.socket!.on(event, callback);
        });
      });
    });

    // 连接断开
    this.socket.on("disconnect", (reason) => {
      console.log(`WebSocket连接断开: ${reason}`);
    });

    // 连接错误
    this.socket.on("connect_error", (error) => {
      console.error("WebSocket连接错误:", error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("WebSocket重连失败，已达到最大重试次数");
        // 可以在这里触发用户通知
      }
    });

    // 重新连接
    this.socket.on("reconnect", (attemptNumber) => {
      console.log(`WebSocket重新连接成功，尝试次数: ${attemptNumber}`);
      this.reconnectAttempts = 0;
    });

    // 服务器确认连接
    this.socket.on("connected", (data) => {
      console.log("WebSocket连接已确认:", data);
    });

    // 监听任务更新事件
    this.socket.on("task:updated", (data) => {
      console.log("接收到任务更新事件:", data);
      // 调用存储在listeners中的所有回调
      const eventListeners = this.listeners.get("task:updated");
      if (eventListeners) {
        eventListeners.forEach((callback) => callback());
      }

      // 自动更新本地状态
      this.refreshTasks();
    });

    // 监听任务创建事件
    this.socket.on("task:created", (data) => {
      console.log("接收到任务创建事件:", data);
      // 调用存储在listeners中的所有回调
      const eventListeners = this.listeners.get("task:created");
      if (eventListeners) {
        eventListeners.forEach((callback) => callback());
      }

      // 自动更新本地状态
      this.refreshTasks();
    });

    // 监听任务删除事件
    this.socket.on("task:deleted", (data) => {
      console.log("接收到任务删除事件:", data);
      // 调用存储在listeners中的所有回调
      const eventListeners = this.listeners.get("task:deleted");
      if (eventListeners) {
        eventListeners.forEach((callback) => callback());
      }

      // 自动更新本地状态
      this.refreshTasks();
    });
  }

  // 刷新任务数据
  private async refreshTasks(): Promise<void> {
    try {
      const { loadDataAll } = useTodoStore.getState();
      await loadDataAll();
      console.log("任务数据已刷新");
    } catch (error) {
      console.error("刷新任务数据失败:", error);
    }
  }

  // 获取连接状态
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // 获取当前用户ID
  getCurrentUserId(): string {
    return this.userId;
  }
}

// 导出单例实例
export const websocketService = new WebSocketService();