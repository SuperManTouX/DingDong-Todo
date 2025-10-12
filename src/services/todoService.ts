import api from "./api";
import { request } from "./baseService";
import type { Todo } from "@/types";

// 软删除任务（移至回收站） - 替代moveTaskToBin
// 使用统一请求处理封装 - 软删除待办事项（删除后清除相关缓存）
export const softDeleteTodo = (id: string) => {
  return request(
    () => api.delete<{ message: string; binId: string }>(`/todos/${id}`),
    `软删除待办事项 ${id} 失败`,
    {
      invalidateCache: ["/todos", `/todos/${id}`], // 清除相关缓存
    },
  );
};

// 从回收站恢复任务 - 替代restoreFromBin
// 使用统一请求处理封装 - 恢复回收站中的任务（恢复后清除相关缓存）
export const restoreTodoFromBin = (id: string) => {
  return request(
    () => api.post<{ message: string; taskId: string }>(`/todos/${id}/restore`),
    `恢复回收站任务 ${id} 失败`,
    {
      invalidateCache: ["/todos"], // 清除待办事项缓存
    },
  );
};

// 硬删除任务（永久删除） - 替代deleteFromBin
// 使用统一请求处理封装 - 永久删除回收站中的任务
export const hardDeleteTodo = (id: string) => {
  return request(
    () => api.delete<{ message: string }>(`/todos/${id}/permanent`),
    `永久删除回收站任务 ${id} 失败`,
    {}, // 硬删除不需要清除待办事项缓存
  );
};

// 清空回收站 - 替代emptyBin
// 使用统一请求处理封装 - 清空回收站中的所有任务
export const emptyBin = () => {
  return request(
    () => api.delete<{ message: string }>("/todos/bin/empty"),
    "清空回收站失败",
    {}, // 清空回收站不需要清除待办事项缓存
  );
};

// 获取回收站内容 - 替代getBinItems
// 使用统一请求处理封装 - 获取回收站中的所有任务
export const getBinItems = () => {
  return request(
    () => api.get<Todo[]>("/todos/bin"),
    "获取回收站内容失败",
    {
      cache: false, // 回收站内容不缓存，确保每次都获取最新数据
    },
  );
};

// 使用统一请求处理封装 - 获取所有待办事项（启用缓存）
export const getAllTodos = () => {
  return request(() => api.get<Todo[]>("/todos"), "获取待办事项失败", {
    cache: true,
    cacheKey: "/todos",
    cacheTime: 300000, // 5分钟缓存
  });
};

// 使用统一请求处理封装 - 获取单个待办事项（启用缓存）
export const getTodoById = (id: string) => {
  return request(
    () => api.get<Todo>(`/todos/${id}`),
    `获取待办事项 ${id} 失败`,
  );
};

// 使用统一请求处理封装 - 创建新的待办事项（创建后清除相关缓存）
export const createTodo = (
  todo: Omit<Todo, "id" | "createdAt" | "updatedAt">,
) => {
  return request(() => api.post<Todo>("/todos", todo), "创建待办事项失败", {
    invalidateCache: "/todos", // 创建后清除所有待办事项的缓存
  });
};

// 使用统一请求处理封装 - 更新待办事项（更新后清除相关缓存）
export const updateTodo = (id: string, todo: Partial<Todo>) => {
  // 需要级联更新的属性
  const cascadingProperties = ['listId', 'groupId', 'completed', 'isPinned', 'pinnedAt', 'deletedAt', 'parentId'];
  
  // 检查是否包含需要级联更新的属性
  const hasCascadingProperties = cascadingProperties.some(prop => prop in todo);
  
  // 如果包含需要级联更新的属性，添加update_with_children标志到请求体
  const requestBody = hasCascadingProperties 
    ? { ...todo, update_with_children: true }
    : todo;
  
  return request(
    () => api.put<Todo>(`/todos/${id}`, requestBody),
    `更新待办事项 ${id} 失败`,
    {
      invalidateCache: ["/todos", `/todos/${id}`], // 清除相关缓存
    },
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
    },
  );
};

// 使用统一请求处理封装 - 切换任务置顶状态（更新后清除相关缓存）
export const togglePinTask = (id: string, isPinned: boolean) => {
  return request(
    () => api.patch<Todo>(`/todos/${id}/pin`, { isPinned }),
    `${isPinned ? "置顶" : "取消置顶"}任务 ${id} 失败`,
    {
      invalidateCache: ["/todos", `/todos/${id}`], // 清除相关缓存
    },
  );
};

// 根据类型获取任务列表
export const getTasksByType = async (type: string): Promise<Todo[]> => {
  return request(
    () => api.get<Todo[]>(`/todos/type/${type}`),
    `获取${type}类型的任务列表失败`,
  );
};

// 根据关键词搜索任务
export const searchTasks = async (keyword: string): Promise<Todo[]> => {
  return request(
    () =>
      api.get<Todo[]>(`/search?keyword=${encodeURIComponent(keyword)}`),
    `搜索任务失败`,
    {
      cache: false, // 搜索结果不缓存，确保每次都获取最新数据
    },
  );
};

// 获取已完成的任务，支持分页
// 当type参数为空时获取所有已完成任务，否则获取指定类型的已完成任务
export const getCompletedTasks = async (
  type?: string,
  page: number = 1,
  pageSize: number = 20,
): Promise<Todo[]> => {
  let url = "/todos/completed";

  // 构建查询参数
  const params = new URLSearchParams();
  if (type) params.append("type", type);
  params.append("page", page.toString());
  params.append("pageSize", pageSize.toString());

  const queryString = params.toString();
  if (queryString) url += `?${queryString}`;

  return request(() => api.get<Todo[]>(url), `获取已完成任务失败`);
};

// 使用统一请求处理封装 - 更新任务的父任务ID（更新后清除相关缓存）
export const updateParentId = (id: string, parentId: string | null) => {
  return request(
    () => api.patch<Todo>(`/todos/${id}/parent`, { parentId }),
    `更新任务 ${id} 的父任务失败`,
    {
      invalidateCache: ["/todos", `/todos/${id}`], // 清除相关缓存
    },
  );
};

// 使用统一请求处理封装 - 移动任务及其子任务到指定分组
export const moveTaskToGroup = (
  id: string,
  groupId: string | null,
  listId: string,
) => {
  return request(
    () => api.patch<Todo>(`/todos/${id}/move-to-group`, { groupId, listId }),
    `移动任务 ${id} 到分组失败`,
    {
      invalidateCache: ["/todos", `/todos/${id}`], // 清除相关缓存
    },
  );
};

// 使用统一请求处理封装 - 移动任务及其子任务到指定清单
export const moveTaskToList = (id: string, listId: string) => {
  return request(
    () => api.patch<Todo>(`/todos/${id}/move-to-list`, { listId }),
    `移动任务 ${id} 到清单失败`,
    {
      invalidateCache: ["/todos", `/todos/${id}`], // 清除相关缓存
    },
  );
};

// 使用统一请求处理封装 - 删除待办事项（删除后清除相关缓存）
export const deleteTodo = (id: string) => {
  // 调用软删除函数，保持向后兼容
  return softDeleteTodo(id);
};

// 使用统一请求处理封装 - 切换任务完成状态（更新后清除相关缓存）
export const toggleTaskCompleted = (id: string, completed: boolean) => {
  // 添加update_with_children标志，确保子任务也会被级联更新
  return request(
    () => api.patch<Todo>(`/todos/${id}/completed`, { completed, update_with_children: true }),
    `${completed ? "完成" : "取消完成"}任务 ${id} 失败`,
    {
      invalidateCache: ["/todos", `/todos/${id}`], // 清除相关缓存
    },
  );
};
