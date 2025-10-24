import { type SSEUpdateData, Tag } from "@/types";
import { Todo } from "@/types";

interface TagUpdateEvent {
  type: "create" | "update" | "delete";
  tag: Tag | null;
  tagId?: string;
  timestamp: Date;
}

// 定义清单更新事件接口
interface ListUpdateEvent {
  type: "create" | "update" | "delete";
  list?: any;
  listId?: string;
  targetListId?: string;
  mode?: "move" | "delete";
  timestamp: Date;
}

// 定义任务更新事件接口
interface TodoUpdateEvent {
  type: "create" | "update" | "delete" | "update_with_children";
  todo?: Todo;
  todoId?: string;
  todoIds?: string[];
  updateData?: Partial<Todo>;
  timestamp: Date;
}

// 定义SSE错误事件接口
interface SseErrorEvent {
  type:
    | "connection_error"
    | "auth_error"
    | "network_error"
    | "server_error"
    | "heartbeat_timeout";
  message: string;
  code?: string;
  timestamp: Date;
}

// 定义习惯更新事件接口
interface HabitUpdateEvent {
  entity: "habit";
  action: "created" | "updated" | "deleted";
  habitId: string;
  data: any;
  stats?: {
    currentStreak: number;
    longestStreak: number;
    totalDays: number;
    lastCheckInDate?: string;
    updatedAt?: string;
    isCompletedToday?: boolean;
    // 计算字段
    completionRate?: number;
    daysSinceStart?: number;
  };
  timestamp: Date;
}

// 通用事件接口，包含实体类型标识
interface EntityUpdateEvent {
  entity: "tag" | "list" | "todo" | "habit" | "system";
  type?:
    | "create"
    | "update"
    | "delete"
    | "update_with_children"
    | "heartbeat"
    | "connected";
  action?: string;
  [key: string]: any;
}

class SseService {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectTimeoutId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000; // 初始重连延迟(ms)
  private statusCheckIntervalId: number | null = null; // 连接状态检查定时器ID
  private lastHeartbeatTime: number | null = null; // 最后收到心跳的时间戳
  private readonly HEARTBEAT_TIMEOUT = 60000; // 心跳超时时间（60秒）

  // 单例模式管理主要的订阅回调
  private mainCallbacks: Map<string, Function> = new Map();

  // 唯一订阅ID计数器
  private subscriptionIdCounter = 0;

  // 保存所有订阅的映射关系
  private subscriptionMap: Map<number, { type: string; callback: Function }> =
    new Map();

  constructor() {
    // 直接使用后端URL
  }

  /**
   * 连接到SSE端点
   */
  connect(): void {
    // 如果已经连接，则断开旧连接
    if (this.eventSource) {
      this.disconnect();
    }

    // 创建新的EventSource连接
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("无法连接SSE: 未找到认证token");
      return;
    }

    try {
      // 构建完整的URL，使用相对路径
      // 注意：EventSource不支持自定义请求头，所以必须通过URL参数传递token
      // 使用相对路径，依赖前端的代理配置将请求转发到后端
      const url = `/events?token=${encodeURIComponent(token)}`;

      // 创建带认证token的EventSource
      this.eventSource = new EventSource(url);

      // 处理消息事件
      this.eventSource.onmessage = (event) => {
        console.log("收到SSE消息:", event.data);
        try {
          const data = JSON.parse(event.data) as { data: EntityUpdateEvent };
          // 注意：后端返回的是 { data: actualData } 格式 //并非，data就已经是数据
          this.handleEvent(data);
        } catch (error) {
          console.error("解析SSE事件数据失败:", error, "原始数据:", event.data);
        }
      };

      // 处理错误事件
      this.eventSource.onerror = (error) => {
        console.error("SSE连接错误事件:", error);
        console.log("EventSource状态:", this.eventSource?.readyState);

        // 解析错误类型并触发错误事件
        let errorType:
          | "connection_error"
          | "auth_error"
          | "network_error"
          | "server_error" = "connection_error";
        let errorMessage = "SSE连接发生错误";

        // 尝试根据连接状态判断错误类型
        if (!navigator.onLine) {
          errorType = "network_error";
          errorMessage = "网络连接已断开，请检查网络设置";
        } else if (
          this.eventSource &&
          this.eventSource.readyState === EventSource.CLOSED
        ) {
          // 尝试检测认证错误 - 通过状态检查
          const token = localStorage.getItem("token");
          if (!token || token === "undefined") {
            errorType = "auth_error";
            errorMessage = "认证信息无效或已过期，请重新登录";
          }
        }

        // 创建并触发错误事件
        this.triggerErrorEvent(errorType, errorMessage);

        if (
          this.eventSource &&
          this.eventSource.readyState === EventSource.CLOSED
        ) {
          console.error("SSE连接已关闭");
          // 检查是否是认证错误（401）
          // EventSource不提供HTTP状态码，所以需要依赖后端发送适当的错误事件
        }
        this.handleReconnect();
      };

      // 处理打开事件
      this.eventSource.onopen = () => {
        console.log("SSE连接已成功建立");
        this.reconnectAttempts = 0; // 重置重连计数
        this.lastHeartbeatTime = Date.now(); // 初始化心跳时间戳

        // SSE连接成功时，从store中订阅所有事件
        try {
          // 动态导入避免循环依赖
          import("@/store/index").then(({ useTodoStore }) => {
            const todoStore = useTodoStore.getState();

            // 订阅任务更新事件
            todoStore.subscribeToTodoUpdates();

            // 订阅标签更新事件（如果存在）
            if (todoStore.subscribeToTagUpdates) {
              todoStore.subscribeToTagUpdates();
            }

            // 订阅清单更新事件（如果存在）
            if (todoStore.subscribeToListUpdates) {
              todoStore.subscribeToListUpdates();
            }

            // 动态导入habitStore并订阅习惯更新事件
            import("@/store/habitStore").then(({ useHabitStore }) => {
              const habitStore = useHabitStore.getState();
              if (habitStore.subscribeToHabitUpdates) {
                habitStore.subscribeToHabitUpdates();
                console.log("已订阅习惯更新事件");
              }
            });

            console.log("已订阅所有SSE事件");
          });
        } catch (error) {
          console.error("订阅SSE事件失败:", error);
        }

        // 启动连接状态检查
        this.startStatusCheck();
      };
    } catch (error) {
      console.error("创建SSE连接失败:", error);
      this.handleReconnect();
    }
  }

  /**
   * 断开SSE连接
   */
  disconnect(): void {
    // 清除重连定时器
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    console.log("断开了SSE连接");
    // 清除状态检查定时器
    this.stopStatusCheck();
    // 重置心跳时间
    this.lastHeartbeatTime = null;

    // 清除所有订阅
    this.clearAllSubscriptions();

    // 关闭EventSource
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * 清除所有订阅
   */
  private clearAllSubscriptions(): void {
    this.listeners.clear();
    this.mainCallbacks.clear();
    this.subscriptionMap.clear();
  }

  /**
   * 启动连接状态检查
   */
  private startStatusCheck(): void {
    // 清除可能存在的旧定时器
    this.stopStatusCheck();

    // 每10秒检查一次连接状态
    this.statusCheckIntervalId = window.setInterval(() => {
      this.checkConnectionStatus();
    }, 10000);
  }

  /**
   * 停止连接状态检查
   */
  private stopStatusCheck(): void {
    if (this.statusCheckIntervalId) {
      clearInterval(this.statusCheckIntervalId);
      this.statusCheckIntervalId = null;
    }
  }

  /**
   * 检查并打印连接状态
   */
  private checkConnectionStatus(): void {
    if (!this.eventSource) {
      console.log("SSE连接状态: 未连接");
      return;
    }

    let statusText = "未知";
    switch (this.eventSource.readyState) {
      case EventSource.CONNECTING:
        statusText = "连接中";
        break;
      case EventSource.OPEN:
        statusText = "已连接";
        break;
      case EventSource.CLOSED:
        statusText = "已关闭";
        break;
    }

    console.log(
      `SSE连接状态: ${statusText} (readyState: ${this.eventSource.readyState})`,
    );

    // 检查心跳超时
    this.checkHeartbeatTimeout();

    // 如果连接已关闭，尝试重新连接
    if (this.eventSource.readyState === EventSource.CLOSED) {
      console.warn("检测到SSE连接已关闭，尝试重新连接...");
      this.handleReconnect();
    }
  }

  /**
   * 检查心跳是否超时
   */
  private checkHeartbeatTimeout(): void {
    if (
      this.lastHeartbeatTime &&
      this.eventSource?.readyState === EventSource.OPEN
    ) {
      const now = Date.now();
      const timeSinceLastHeartbeat = now - this.lastHeartbeatTime;

      if (timeSinceLastHeartbeat > this.HEARTBEAT_TIMEOUT) {
        console.warn(
          `SSE心跳超时: ${timeSinceLastHeartbeat}ms，超过了${this.HEARTBEAT_TIMEOUT}ms的阈值`,
        );
        this.triggerErrorEvent(
          "heartbeat_timeout",
          "SSE连接心跳超时，请检查网络连接",
        );
        // 触发重连
        this.handleReconnect();
      } else {
        // 正常状态，记录距离下次超时的时间
        const timeToTimeout = this.HEARTBEAT_TIMEOUT - timeSinceLastHeartbeat;
        console.log(
          `SSE心跳正常，距离下次检查还剩约${Math.round(timeToTimeout / 1000)}秒`,
        );
      }
    }
  }

  /**
   * 触发错误事件
   */
  private triggerErrorEvent(
    type: "connection_error" | "auth_error" | "network_error" | "server_error",
    message: string,
    code?: string,
  ): void {
    const errorEvent: SseErrorEvent = {
      type,
      message,
      code,
      timestamp: new Date(),
    };

    console.error("触发SSE错误事件:", errorEvent);

    // 调用所有已注册的错误监听器
    const errorListeners = this.listeners.get("error");
    if (errorListeners) {
      errorListeners.forEach((listener) => listener(errorEvent));
    }
  }

  /**
   * 监听SSE错误事件
   */
  onError(callback: (event: SseErrorEvent) => void): () => void {
    if (!this.listeners.has("error")) {
      this.listeners.set("error", []);
    }

    const listeners = this.listeners.get("error")!;
    listeners.push(callback);

    // 返回取消订阅函数
    return () => {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * 处理重连逻辑
   */
  private handleReconnect(): void {
    // 如果达到最大重连尝试次数，则停止重连
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("达到最大重连次数，停止重连");
      this.triggerErrorEvent(
        "connection_error",
        "SSE连接失败，已达到最大重连次数",
      );
      return;
    }

    // 计算指数退避延迟
    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);

    this.reconnectTimeoutId = window.setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /**
   * 处理接收到的事件数据
   */
  private handleEvent(data: EntityUpdateEvent): void {
    console.log("处理SSE事件:", data);

    // 处理心跳事件
    if (data.entity === "system" && data.type === "heartbeat") {
      this.handleHeartbeatEvent(data);
      return;
    }

    const { entity } = data;

    // 根据实体类型分发到对应的事件监听器
    switch (entity) {
      case "tag":
        this.handleTagUpdate(data as TagUpdateEvent);
        break;
      case "list":
        this.handleListUpdate(data as ListUpdateEvent);
        break;
      case "todo":
        this.handleTodoUpdate(data as SSEUpdateData);
        break;
      case "habit":
        this.handleHabitUpdate(data as HabitUpdateEvent);
        break;
      default:
        console.warn("未知的实体类型事件:", data);
    }
  }

  /**
   * 处理心跳事件
   */
  private handleHeartbeatEvent(event: any): void {
    this.lastHeartbeatTime = Date.now();
    console.log(`收到SSE心跳事件，时间戳: ${this.lastHeartbeatTime}`);
  }

  /**
   * 处理任务更新事件
   */
  private handleTodoUpdate(event: SSEUpdateData): void {
    const listeners = this.listeners.get("todoUpdate");
    console.log(listeners);

    if (listeners) {
      console.log(listeners);
      listeners.forEach((listener) => listener(event));
    }
  }

  /**
   * 处理标签更新事件
   */
  private handleTagUpdate(event: TagUpdateEvent): void {
    const listeners = this.listeners.get("tagUpdate");
    if (listeners) {
      listeners.forEach((listener) => listener(event));
    }
  }

  /**
   * 处理清单更新事件
   */
  private handleListUpdate(event: ListUpdateEvent): void {
    const listeners = this.listeners.get("listUpdate");
    if (listeners) {
      listeners.forEach((listener) => listener(event));
    }
  }

  /**
   * 处理习惯更新事件
   */
  private handleHabitUpdate(event: HabitUpdateEvent): void {
    console.log("收到习惯更新事件:", event);
    
    // 创建事件的副本，确保stats中不携带id字段
    const sanitizedEvent = { ...event };
    if (sanitizedEvent.stats && 'id' in sanitizedEvent.stats) {
      // 移除stats中的id字段
      const { id, ...sanitizedStats } = sanitizedEvent.stats;
      sanitizedEvent.stats = sanitizedStats;
    }
    
    const listeners = this.listeners.get("habitUpdate");
    if (listeners) {
      listeners.forEach((listener) => listener(sanitizedEvent));
    }
  }

  /**
   * 监听任务更新事件
   */
  onTodoUpdate(callback: (event: TodoUpdateEvent) => void): () => void {
    const subscriptionType = "todoUpdate";
    const subscriptionId = ++this.subscriptionIdCounter;

    if (!this.listeners.has(subscriptionType)) {
      this.listeners.set(subscriptionType, []);
    }

    const listeners = this.listeners.get(subscriptionType)!;
    listeners.push(callback);

    // 保存订阅信息
    this.subscriptionMap.set(subscriptionId, {
      type: subscriptionType,
      callback,
    });

    // 返回取消订阅函数
    return () => {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
        this.subscriptionMap.delete(subscriptionId);
      }
    };
  }

  /**
   * 监听标签更新事件
   */
  onTagUpdate(callback: (event: TagUpdateEvent) => void): () => void {
    const subscriptionType = "tagUpdate";
    const subscriptionId = ++this.subscriptionIdCounter;

    if (!this.listeners.has(subscriptionType)) {
      this.listeners.set(subscriptionType, []);
    }

    const listeners = this.listeners.get(subscriptionType)!;
    listeners.push(callback);

    // 保存订阅信息
    this.subscriptionMap.set(subscriptionId, {
      type: subscriptionType,
      callback,
    });

    // 返回取消订阅函数
    return () => {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
        this.subscriptionMap.delete(subscriptionId);
      }
    };
  }

  /**
   * 监听清单更新事件
   */
  onHabitUpdate(callback: (event: HabitUpdateEvent) => void): () => void {
    const subscriptionType = "habitUpdate";
    const subscriptionId = ++this.subscriptionIdCounter;

    if (!this.listeners.has(subscriptionType)) {
      this.listeners.set(subscriptionType, []);
    }

    const listeners = this.listeners.get(subscriptionType)!;
    listeners.push(callback);

    // 保存订阅信息
    this.subscriptionMap.set(subscriptionId, {
      type: subscriptionType,
      callback,
    });

    // 返回取消订阅函数
    return () => {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
        this.subscriptionMap.delete(subscriptionId);
      }
    };
  }
  /**
   * 监听清单更新事件
   */
  onListUpdate(callback: (event: ListUpdateEvent) => void): () => void {
    const subscriptionType = "listUpdate";
    const subscriptionId = ++this.subscriptionIdCounter;

    if (!this.listeners.has(subscriptionType)) {
      this.listeners.set(subscriptionType, []);
    }

    const listeners = this.listeners.get(subscriptionType)!;
    listeners.push(callback);

    // 保存订阅信息
    this.subscriptionMap.set(subscriptionId, {
      type: subscriptionType,
      callback,
    });

    // 返回取消订阅函数
    return () => {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
        this.subscriptionMap.delete(subscriptionId);
      }
    };
  }

  /**
   * 清理指定类型的所有订阅
   */
  clearSubscriptionsByType(
    type: "tagUpdate" | "listUpdate" | "todoUpdate" | "error",
  ): void {
    if (this.listeners.has(type)) {
      const listeners = this.listeners.get(type)!;
      listeners.length = 0; // 清空数组
    }

    // 同时清理subscriptionMap
    for (const [id, sub] of this.subscriptionMap.entries()) {
      if (sub.type === type) {
        this.subscriptionMap.delete(id);
      }
    }
  }
}

export default new SseService();
export { TagUpdateEvent, ListUpdateEvent, EntityUpdateEvent, SseErrorEvent };
