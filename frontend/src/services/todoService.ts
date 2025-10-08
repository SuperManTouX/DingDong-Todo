import api from "./api";
import { request } from "./baseService";
import type { Todo } from "@/types";

// 使用统一请求处理封装 - 获取所有待办事项（启用缓存）
export const getAllTodos = () => {
  return request(
    () => api.get<Todo[]>('/todos'),
    '获取待办事项失败',
    {
      cache: true,
      cacheKey: '/todos',
      cacheTime: 300000, // 5分钟缓存
    }
  );
};

// 使用统一请求处理封装 - 获取单个待办事项（启用缓存）
export const getTodoById = (id: string) => {
  return request(
    () => api.get<Todo>(`/todos/${id}`),
    `获取待办事项 ${id} 失败`,
    {
      cache: true,
      cacheKey: `/todos/${id}`,
      cacheTime: 300000, // 5分钟缓存
    }
  );
};

// 使用统一请求处理封装 - 创建新的待办事项（创建后清除相关缓存）
export const createTodo = (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => {
  return request(
    () => api.post<Todo>('/todos', todo),
    '创建待办事项失败',
    {
      invalidateCache: '/todos', // 创建后清除所有待办事项的缓存
    }
  );
};

// 使用统一请求处理封装 - 更新待办事项（更新后清除相关缓存）
export const updateTodo = (id: string, todo: Partial<Todo>) => {
  return request(
    () => api.put<Todo>(`/todos/${id}`, todo),
    `更新待办事项 ${id} 失败`,
    {
      invalidateCache: ['/todos', `/todos/${id}`], // 清除相关缓存
    }
  );
};

// 获取指定清单的置顶待办事项（启用缓存）
export const getListPinnedTodos = async (listId: string): Promise<Todo[]> => {
  return request(
    () => api.get<Todo[]>(`/todos/pinned?listId=${listId}`),
    `获取清单 ${listId} 的置顶待办事项失败`,
    {
      cache: true,
      cacheKey: `/todos/pinned?listId=${listId}`,
      cacheTime: 300000, // 5分钟缓存
    }
  );
};

// 使用统一请求处理封装 - 切换任务置顶状态（更新后清除相关缓存）
export const togglePinTask = (id: string, isPinned: boolean) => {
  return request(
    () => api.patch<Todo>(`/todos/${id}/pin`, { isPinned }),
    `${isPinned ? '置顶' : '取消置顶'}任务 ${id} 失败`,
    {
      invalidateCache: ['/todos', `/todos/${id}`], // 清除相关缓存
    }
  );
};

// 根据类型获取任务列表
export const getTasksByType = async (type: string): Promise<Todo[]> => {
  return request(
    () => api.get<Todo[]>(`/todos/type/${type}`),
    `获取${type}类型的任务列表失败`,
    {
      cache: true,
      cacheKey: `/todos/type/${type}`,
      cacheTime: 60000, // 1分钟缓存，因为这些是动态变化的数据
      invalidateCache: '/todos', // 获取后清除主缓存
    }
  );
};

// 根据关键词搜索任务
export const searchTasks = async (keyword: string): Promise<Todo[]> => {
  return request(
    () => api.get<Todo[]>(`/todos/search?keyword=${encodeURIComponent(keyword)}`),
    `搜索任务失败`,
    {
      cache: false, // 搜索结果不缓存，确保每次都获取最新数据
    }
  );
};

// 获取已完成的任务，支持分页
// 当type参数为空时获取所有已完成任务，否则获取指定类型的已完成任务
export const getCompletedTasks = async (type?: string, page: number = 1, pageSize: number = 20): Promise<Todo[]> => {
  let url = '/todos/completed';
  
  // 构建查询参数
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  params.append('page', page.toString());
  params.append('pageSize', pageSize.toString());
  
  const queryString = params.toString();
  if (queryString) url += `?${queryString}`;
  
  return request(
    () => api.get<Todo[]>(url),
    `获取已完成任务失败`,
    {
      cache: true,
      cacheKey: url,
      cacheTime: 60000, // 1分钟缓存
      invalidateCache: '/todos', // 获取后清除主缓存
    }
  );
};

// 使用统一请求处理封装 - 更新任务的父任务ID（更新后清除相关缓存）
export const updateParentId = (id: string, parentId: string | null) => {
  return request(
    () => api.patch<Todo>(`/todos/${id}/parent`, { parentId }),
    `更新任务 ${id} 的父任务失败`,
    {
      invalidateCache: ['/todos', `/todos/${id}`], // 清除相关缓存
    }
  );
};

// 使用统一请求处理封装 - 删除待办事项（删除后清除相关缓存）
export const deleteTodo = (id: string) => {
  return request(
    () => api.delete<void>(`/todos/${id}`),
    `删除待办事项 ${id} 失败`,
    {
      invalidateCache: ['/todos', `/todos/${id}`], // 清除相关缓存
    }
  );
};
