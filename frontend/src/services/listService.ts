// 获取所有待办事项列表
import type { TodoListData } from "@/types";
import api from "@/services/api";

export const getAllTodoLists = async (): Promise<TodoListData[]> => {
  try {
    const response = await api.get("/todo-lists");
    return response;
  } catch (error) {
    console.error("获取待办事项列表失败:", error);
    throw error;
  }
};
// 创建待办事项列表
export const createTodoList = async (
  list: Omit<TodoListData, "id" | "createdAt" | "updatedAt">,
): Promise<TodoListData> => {
  try {
    const response = await api.post("/todo-lists", list);
    return response;
  } catch (error) {
    console.error("创建待办事项列表失败:", error);
    throw error;
  }
};
// 更新待办事项列表
export const updateTodoList = async (
  id: string,
  updates: Partial<TodoListData>,
): Promise<TodoListData> => {
  try {
    const response = await api.put(`/todo-lists/${id}`, updates);
    return response;
  } catch (error) {
    console.error(`更新待办事项列表 ${id} 失败:`, error);
    throw error;
  }
};
// 删除待办事项列表
export const deleteTodoList = async (id: string, targetListId?: string | null, mode?: 'move' | 'moveAndDelete'): Promise<void> => {
  try {
    // 通过请求体传递参数
    await api.delete(`/todo-lists/${id}`, {
      data: { 
        targetListId, 
        mode 
      }
    });
  } catch (error) {
    console.error(`删除待办事项列表 ${id} 失败:`, error);
    throw error;
  }
};
