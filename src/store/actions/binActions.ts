import { produce } from "immer";
import type { Todo, TodoState } from "../types";
import {
  hardDeleteTodo,
  emptyBin,
  softDeleteTodo,
  restoreTodoFromBin,
} from "@/services/todoService";
import { useAuthStore } from "@/store/authStore";

export const binActions = {
  moveToBin: async (todo: Todo, set: any): Promise<void> => {
    try {
      // 然后发送API请求，但不等待响应
      softDeleteTodo(todo.id).catch((error) => {
        console.error("移动到回收站失败:", error);
        // 这里暂时不回滚状态，让用户可以重试
      });
    } catch (error) {
      console.error("移动到回收站本地操作失败:", error);
      throw error;
    }
  },

  restoreFromBin: async (todoId: string, set: any, get): Promise<void> => {
    try {
      // 然后发送API请求，但不等待响应
      restoreTodoFromBin(todoId).catch((error) => {
        console.error("从回收站恢复失败:", error);
        // 这里暂时不回滚状态，让用户可以重试
      });
    } catch (error) {
      console.error("从回收站恢复本地操作失败:", error);
      throw error;
    }
  },

  deleteFromBin: async (todoId: string, set: any): Promise<void> => {
    try {
      // 然后发送API请求，但不等待响应
      hardDeleteTodo(todoId).catch((error) => {
        console.error("从回收站删除失败:", error);
        // 这里暂时不回滚状态，让用户可以重试
      });
    } catch (error) {
      console.error("从回收站删除本地操作失败:", error);
      throw error;
    }
  },

  emptyBin: async (set: any): Promise<void> => {
    try {
      // 然后发送API请求，但不等待响应
      emptyBin().catch((error) => {
        console.error("清空回收站失败:", error);
        // 这里暂时不回滚状态，让用户可以重试
      });
    } catch (error) {
      console.error("清空回收站本地操作失败:", error);
      throw error;
    }
  },

  getBinTodos: (get: () => TodoState): Todo[] => {
    return get().bin;
  },
};
