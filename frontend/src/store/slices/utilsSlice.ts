import type { TodoState } from "../types";
import { useTodoStore } from "@/store";
import type { Todo } from "@/types";
import { useAuthStore } from "@/store/authStore";

export const utilsActions = {
  // 获取指定ID的任务
  getTodoById: (id: string, get: any): any | null => {
    try {
      const state = get();
      if (!state || !Array.isArray(state.tasks)) {
        console.warn("State or tasks is invalid in getTodoById");
        return null;
      }
      return state.tasks.find((task: any) => task.id === id) || null;
    } catch (error) {
      console.error("Error in getTodoById:", error);
      return null;
    }
  },

  // 根据任务ID获取所属的任务组
  getGroupByTodoId: (todoId: string, get: any): any | null => {
    try {
      const state = get();
      if (!state || !Array.isArray(state.tasks) || !Array.isArray(state.todoListData)) {
        console.warn("State or required arrays are invalid in getGroupByTodoId");
        return null;
      }
      
      const task = state.tasks.find((t: any) => t.id === todoId);
      if (!task) return null;

      return (
        state.todoListData.find((list: any) => list.id === task.listId) || null
      );
    } catch (error) {
      console.error("Error in getGroupByTodoId:", error);
      return null;
    }
  },

  // 获取当前激活的任务组数据
  getActiveListData: (get: any): any => {
    try {
      const state = get();
      if (!state || !Array.isArray(state.todoListData)) {
        console.warn("State or todoListData is invalid in getActiveListData");
        return {
          id: "",
          title: "",
          userId: "",
          createdAt: "",
          updatedAt: "",
        };
      }
      
      return (
        state.todoListData.find(
          (list: any) => list.id === state.activeListId,
        ) || {
          id: "",
          title: "",
          userId: "",
          createdAt: "",
          updatedAt: "",
        }
      );
    } catch (error) {
      console.error("Error in getActiveListData:", error);
      return {
        id: "",
        title: "",
        userId: "",
        createdAt: "",
        updatedAt: "",
      };
    }
  },

  // 获取当前激活列表的所有任务
  getActiveListTasks: (get: () => TodoState): Todo[] => {
    try {
      const state = get();
      if (!state || !Array.isArray(state.tasks)) {
        console.warn("State or tasks is invalid in getActiveListTasks");
        return [];
      }
      
      // 激活的是清单
      if (state.tasks.some((task: any) => task.listId === state.activeListId)) {
        return state.tasks.filter(
          (task: any) => task.listId === state.activeListId,
        );
        //激活的是特殊列表
      } else {
        if (state.activeListId === "bin") {
          return Array.isArray(state.bin) ? state.bin : [];
        }
        
        const userId = useAuthStore.getState()?.userId;
        return state.tasks.filter(
          (task: any) => task.userId === userId,
        );
      }
    } catch (error) {
      console.error("Error in getActiveListTasks:", error);
      return [];
    }
  },

  // 设置激活的列表ID
  setActiveListId: (id: string, set: any): void => {
    try {
      set({ activeListId: id });
    } catch (error) {
      console.error("Error in setActiveListId:", error);
    }
  },

  // 设置选中的任务ID
  setSelectTodoId: (id: string | null, set: any): void => {
    try {
      // 只设置selectTodoId，selectTodo会通过getter自动计算
      set({ selectTodoId: id });
    } catch (error) {
      console.error("Error in setSelectTodoId:", error);
    }
  },

  // 设置用户ID
  setUserId: (id: string | null, set: any): void => {
    try {
      set({ userId: id });
    } catch (error) {
      console.error("Error in setUserId:", error);
    }
  },
};

export default utilsActions;
