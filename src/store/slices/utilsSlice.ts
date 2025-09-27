import type { TodoState } from "../types";
import { useTodoStore } from "@/store";
import type { Todo } from "@/types";
import { useAuthStore } from "@/store/authStore";

export const utilsActions = {
  // 获取指定ID的任务
  getTodoById: (id: string, get: any): any | null => {
    return get().tasks.find((task: any) => task.id === id) || null;
  },

  // 根据任务ID获取所属的任务组
  getGroupByTodoId: (todoId: string, get: any): any | null => {
    const task = get().tasks.find((t: any) => t.id === todoId);
    if (!task) return null;

    return (
      get().todoListData.find((list: any) => list.id === task.listId) || null
    );
  },

  // 获取当前激活的任务组数据
  getActiveListData: (get: any): any => {
    return (
      get().todoListData.find(
        (list: any) => list.id === get().activeListId,
      ) || {
        id: "",
        title: "",
        userId: "",
        createdAt: "",
        updatedAt: "",
      }
    );
  },

  // 获取当前激活列表的所有任务
  getActiveListTasks: (get: () => TodoState): Todo[] => {
    // 激活的是清单
    if (get().tasks.some((task: any) => task.listId === get().activeListId)) {
      return get().tasks.filter(
        (task: any) => task.listId === get().activeListId,
      );
      //激活的是特殊列表
    } else {
      if (get().activeListId === "bin") {
        return get().bin;
      }
      return get().tasks.filter(
        (task: any) => task.userId === useAuthStore.getState().userId,
      );
    }
  },

  // 设置激活的列表ID
  setActiveListId: (id: string, set: any): void => {
    set({ activeListId: id });
  },

  // 设置选中的任务ID
  setSelectTodoId: (id: string | null, set: any): void => {
    set({ selectTodoId: id });
  },

  // 设置用户ID
  setUserId: (id: string | null, set: any): void => {
    set({ userId: id });
  },
};
