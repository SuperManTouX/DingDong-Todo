import api from "./api";
import type { Todo } from "@/types";

// 获取所有待办事项
export const getAllTodos = async (): Promise<Todo[]> => {
  try {
    return await api.get("/todos");
  } catch (error) {
    console.error("获取待办事项失败:", error);
    throw error;
  }
};

// 获取单个待办事项
export const getTodoById = async (id: string): Promise<Todo> => {
  try {
    const response = await api.get(`/todos/${id}`);
    return response;
  } catch (error) {
    console.error(`获取待办事项 ${id} 失败:`, error);
    throw error;
  }
};

// 创建新的待办事项
export const createTodo = async (
  todo: Omit<Todo, "id" | "createdAt" | "updatedAt">,
): Promise<Todo> => {
  try {
    const response = await api.post("/todos", todo);
    return response;
  } catch (error) {
    console.error("创建待办事项失败:", error);
    throw error;
  }
};

// 更新待办事项
export const updateTodo = async (
  id: string,
  todo: Partial<Todo>,
): Promise<Todo> => {
  try {
    const response = await api.put(`/todos/${id}`, todo);
    return response;
  } catch (error) {
    console.error(`更新待办事项 ${id} 失败:`, error);
    throw error;
  }
};

// 获取所有置顶待办事项
export const getAllPinnedTodos = async (): Promise<Todo[]> => {
  try {
    // 调用现有的获取所有任务接口
    const allTodos = await getAllTodos();
    // 过滤出置顶的任务
    const pinnedTodos = allTodos.filter(todo => todo.isPinned === true);
    // 按置顶时间降序排序（最新置顶的在前）
    pinnedTodos.sort((a, b) => {
      if (a.pinnedAt && b.pinnedAt) {
        return new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime();
      }
      if (a.pinnedAt) return -1;
      if (b.pinnedAt) return 1;
      return 0;
    });
    return pinnedTodos;
  } catch (error) {
    console.error("获取置顶待办事项失败:", error);
    throw error;
  }
};

// 获取指定清单的置顶待办事项
export const getListPinnedTodos = async (listId: string): Promise<Todo[]> => {
  try {
    const response = await api.get(`/todos/pinned?listId=${listId}`);
    return response;
  } catch (error) {
    console.error(`获取清单 ${listId} 的置顶待办事项失败:`, error);
    throw error;
  }
};

// 切换任务置顶状态
export const togglePinTask = async (id: string, isPinned: boolean): Promise<Todo> => {
  try {
    const response = await api.patch(`/todos/${id}/pin`, { isPinned });
    return response;
  } catch (error) {
    console.error(`${isPinned ? "置顶" : "取消置顶"}任务 ${id} 失败:`, error);
    throw error;
  }
};

// 删除待办事项
export const deleteTodo = async (id: string): Promise<void> => {
  try {
    await api.delete(`/todos/${id}`);
  } catch (error) {
    console.error(`删除待办事项 ${id} 失败:`, error);
    throw error;
  }
};
