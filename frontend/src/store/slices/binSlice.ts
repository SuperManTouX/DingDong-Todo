import { produce } from "immer";
import { moveTaskToBin, restoreFromBin, deleteFromBin, emptyBin } from "@/services/todoService";
import type { Todo, TodoState } from "../types";

export const binActions = {
  moveToBin: async (
    todo: Todo,
    set: any,
    get: any
  ): Promise<void> => {
    try {
      // 调用API将任务移到回收站
      await moveTaskToBin(todo.id);
      
      // 更新本地状态
      set(
        produce((draftState: TodoState) => {
          // 将任务添加到回收站
          draftState.bin.push(todo);
          
          // 从任务列表中移除
          draftState.tasks = draftState.tasks.filter(
            (task: any) => task.id !== todo.id
          );
          
          // 同时移除子任务
          draftState.tasks = draftState.tasks.filter(
            (task: any) => task.parentId !== todo.id
          );
        })
      );
    } catch (error) {
      console.error("移动到回收站失败:", error);
      throw error;
    }
  },

  restoreFromBin: async (
    todoId: string,
    set: any,
    get: any
  ): Promise<void> => {
    try {
      // 调用API恢复任务
      await restoreFromBin(todoId);
      
      // 更新本地状态
      set(
        produce((draftState: TodoState) => {
          // 查找要恢复的任务
          const taskToRestore = draftState.bin.find(
            (task: any) => task.id === todoId
          );
          
          if (taskToRestore) {
            // 将任务添加回任务列表
            draftState.tasks.push(taskToRestore);
            // 从回收站中移除
            draftState.bin = draftState.bin.filter(
              (task: any) => task.id !== todoId
            );
          }
        })
      );
    } catch (error) {
      console.error("从回收站恢复失败:", error);
      throw error;
    }
  },

  deleteFromBin: async (
    todoId: string,
    set: any
  ): Promise<void> => {
    try {
      // 调用API永久删除任务
      await deleteFromBin(todoId);
      
      // 更新本地状态
      set(
        produce((draftState: TodoState) => {
          // 从回收站中移除
          draftState.bin = draftState.bin.filter(
            (task: any) => task.id !== todoId
          );
        })
      );
    } catch (error) {
      console.error("从回收站删除失败:", error);
      throw error;
    }
  },

  emptyBin: async (
    set: any
  ): Promise<void> => {
    try {
      // 调用API清空回收站
      await emptyBin();
      
      // 更新本地状态
      set(
        produce((draftState: TodoState) => {
          draftState.bin = [];
        })
      );
    } catch (error) {
      console.error("清空回收站失败:", error);
      throw error;
    }
  },

  getBinTodos: (
    get: any
  ): Todo[] => {
    return get().bin;
  },
};