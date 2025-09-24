import api from "./api";
import type { Group, Tag, Todo, TodoListData } from "@/types";

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
    const response = await api.patch(`/todos/${id}`, todo);
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

// 获取所有待办事项列表
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

// 获取所有标签
export const getAllTags = async (): Promise<Tag[]> => {
  try {
    const response = await api.get("/todo-tags");
    return response;
  } catch (error) {
    console.error("获取标签失败:", error);
    throw error;
  }
};

// 创建标签
export const createTag = async (
  tag: Omit<Tag, "id" | "createdAt" | "updatedAt">,
): Promise<Tag> => {
  try {
    const response = await api.post("/todo-tags", tag);
    return response;
  } catch (error) {
    console.error("创建标签失败:", error);
    throw error;
  }
};

// 获取所有任务组
export const getAllGroups = async (): Promise<Group[]> => {
  try {
    const response = await api.get("/task-groups");
    return response;
  } catch (error) {
    console.error("获取任务组失败:", error);
    throw error;
  }
};

// 创建任务组
export const createGroup = async (group: Omit<Group, "id">): Promise<Group> => {
  try {
    const response = await api.post("/task-groups", group);
    return response;
  } catch (error) {
    console.error("创建任务组失败:", error);
    throw error;
  }
};
