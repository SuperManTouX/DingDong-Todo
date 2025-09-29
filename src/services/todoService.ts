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

// 删除待办事项
export const deleteTodo = async (id: string): Promise<void> => {
  try {
    await api.delete(`/todos/${id}`);
  } catch (error) {
    console.error(`删除待办事项 ${id} 失败:`, error);
    throw error;
  }
};
