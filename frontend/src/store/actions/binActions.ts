import { produce } from "immer";
import type { Todo, TodoState } from "../types";
import {
  deleteFromBin,
  emptyBin,
  moveTaskToBin,
  restoreFromBin,
} from "@/services/binService";
import { websocketService } from "@/services/websocketService";
import { useAuthStore } from "@/store/authStore";

export const binActions = {
  moveToBin: async (todo: Todo, set: any): Promise<void> => {
    try {
      // 先更新本地状态（乐观更新）
      set(
        produce((draftState: TodoState) => {
          // 从任务列表中移除
          draftState.tasks = draftState.tasks.filter(
            (task: any) => task.id !== todo.id,
          );

          // 同时移除子任务
          draftState.tasks = draftState.tasks.filter(
            (task: any) => task.parentId !== todo.id,
          );
        }),
      );

      // 然后发送API请求，但不等待响应
      moveTaskToBin(todo.id).catch((error) => {
        console.error("移动到回收站失败:", error);
        // 这里暂时不回滚状态，让用户可以重试
      });
      // 通过WebSocket发送任务更新通知
      websocketService.emit("task:deleted", {
        taskId: todo.id,
        userId: useAuthStore().userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("移动到回收站本地操作失败:", error);
      throw error;
    }
  },

  restoreFromBin: async (todoId: string, set: any, get): Promise<void> => {
    try {
      // 先更新本地状态（乐观更新）
      set(
        produce((draftState: TodoState) => {
          // 从任务列表中移除
          draftState.tasks = draftState.tasks.filter(
            (task: any) => task.id !== todoId,
          );

          // 同时移除子任务
          draftState.tasks = draftState.tasks.filter(
            (task: any) => task.parentId !== todoId,
          );
        }),
      );

      // 然后发送API请求，但不等待响应
      restoreFromBin(todoId).catch((error) => {
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
      // 先更新本地状态（乐观更新）
      set(
        produce((draftState: TodoState) => {
          // 从任务列表中移除
          draftState.tasks = draftState.tasks.filter(
            (task: any) => task.id !== todoId,
          );

          // 同时移除子任务
          draftState.tasks = draftState.tasks.filter(
            (task: any) => task.parentId !== todoId,
          );
        }),
      );

      // 然后发送API请求，但不等待响应
      deleteFromBin(todoId).catch((error) => {
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
      // 先更新本地状态（乐观更新）
      set(
        produce((draftState: TodoState) => {
          draftState.bin = [];
        }),
      );

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
