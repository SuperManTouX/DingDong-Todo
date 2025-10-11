import { Tag } from "@/types";
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
  mode?: 'move' | 'delete';
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
  type: "connection_error" | "auth_error" | "network_error" | "server_error";
  message: string;
  code?: string;
  timestamp: Date;
}

// 通用事件接口，包含实体类型标识
interface EntityUpdateEvent {
  entity: 'tag' | 'list' | 'todo';
  type: "create" | "update" | "delete" | "update_with_children";
  [key: string]: any;
}

class SseService {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectTimeoutId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000; // 初始重连延迟(ms)

  constructor() {
    // 直接使用后端URL
  }

  /**
   * 连接到SSE端点
   */
  connect(): void {
    console.log("尝试建立SSE连接...");
    // 如果已经连接，则断开连接
    this.disconnect();

    // 创建新的EventSource连接
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("无法连接SSE: 未找到认证token");
      return;
    }

    try {
      // 构建完整的URL，使用相对路径
      // 注意：EventSource不支持自定义请求头，所以必须通过URL参数传递token
      const url = `/events?token=${encodeURIComponent(token)}`;
      console.log(`正在连接到SSE端点: ${url}`);
      console.log(`当前URL: ${window.location.href}`);
      console.log(`Token存在，长度: ${token.length}`);

      // 创建带认证token的EventSource
      this.eventSource = new EventSource(url);

      // 处理消息事件
      this.eventSource.onmessage = (event) => {
        console.log("收到SSE消息:", event.data);
        try {
          const data = JSON.parse(event.data) as EntityUpdateEvent;
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
        let errorType: "connection_error" | "auth_error" | "network_error" | "server_error" = "connection_error";
        let errorMessage = "SSE连接发生错误";
        
        // 尝试根据连接状态判断错误类型
        if (!navigator.onLine) {
          errorType = "network_error";
          errorMessage = "网络连接已断开，请检查网络设置";
        } else if (this.eventSource && this.eventSource.readyState === EventSource.CLOSED) {
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

    // 关闭EventSource
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * 触发错误事件
   */
  private triggerErrorEvent(type: "connection_error" | "auth_error" | "network_error" | "server_error", message: string, code?: string): void {
    const errorEvent: SseErrorEvent = {
      type,
      message,
      code,
      timestamp: new Date()
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
      this.triggerErrorEvent("connection_error", "SSE连接失败，已达到最大重连次数");
      return;
    }

    // 计算指数退避延迟
    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`将在 ${delay}ms 后尝试重新连接SSE`);

    this.reconnectTimeoutId = window.setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /**
   * 处理接收到的事件数据
   */
  private handleEvent(data: EntityUpdateEvent): void {
    const { entity } = data;
    
    // 根据实体类型分发到对应的事件监听器
    switch (entity) {
      case 'tag':
        this.handleTagUpdate(data as TagUpdateEvent);
        break;
      case 'list':
        this.handleListUpdate(data as ListUpdateEvent);
        break;
      case 'todo':
        this.handleTodoUpdate(data as TodoUpdateEvent);
        break;
      default:
        console.warn('未知的实体类型事件:', data);
    }
  }

  /**
   * 处理任务更新事件
   */
  private handleTodoUpdate(event: TodoUpdateEvent): void {
    const listeners = this.listeners.get("todoUpdate");
    if (listeners) {
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
   * 监听任务更新事件
   */
  onTodoUpdate(callback: (event: TodoUpdateEvent) => void): () => void {
    if (!this.listeners.has("todoUpdate")) {
      this.listeners.set("todoUpdate", []);
    }

    const listeners = this.listeners.get("todoUpdate")!;
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
   * 监听标签更新事件
   */
  onTagUpdate(callback: (event: TagUpdateEvent) => void): () => void {
    if (!this.listeners.has("tagUpdate")) {
      this.listeners.set("tagUpdate", []);
    }

    const listeners = this.listeners.get("tagUpdate")!;
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
   * 监听清单更新事件
   */
  onListUpdate(callback: (event: ListUpdateEvent) => void): () => void {
    if (!this.listeners.has("listUpdate")) {
      this.listeners.set("listUpdate", []);
    }

    const listeners = this.listeners.get("listUpdate")!;
    listeners.push(callback);

    // 返回取消订阅函数
    return () => {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }
}

export default new SseService();
export { TagUpdateEvent, ListUpdateEvent, EntityUpdateEvent, SseErrorEvent };