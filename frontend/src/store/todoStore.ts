// 兼容性包装器 - 导出新的模块化store
import { useTodoStore } from "./index";
import type { TodoState } from "./types";
import type { Todo } from "@/types";
// 创建一个兼容性对象，代理所有方法调用
const todoStore = {
  ...useTodoStore,
  // 确保所有直接方法调用都能工作
  getState: () => useTodoStore.getState(),
  setState: (state) => useTodoStore.setState(state),
  subscribe: (listener) => useTodoStore.subscribe(listener),
};

// 获取store状态，用于导出所有可能被直接访问的方法、属性
export const {
  // 状态属性
  todoListData,
  todoTags,
  activeListId,
  selectTodoId,
  bin,
  tasks,
  groups,
  userId,
  pinnedTasks,

  // 计算属性
  activeGroup,
  selectTodo,

  // 方法
  dispatchTodo,
  dispatchList,
  dispatchTag,
  addGroup,
  updateGroup,
  deleteGroup,
  getGroupsByListId,
  moveToBin,
  restoreFromBin,
  deleteFromBin,
  emptyBin,
  getBinTodos,
  getTodoById,
  getGroupByTodoId,
  getActiveListData,
  getActiveListTasks,
  setActiveListId,
  setSelectTodoId,
  setUserId,
  loadDataAll,
  loadTags,
  loadListPinnedTasks,
} = useTodoStore.getState();

// 为了确保兼容性，创建并导出一些可能使用的自定义hooks
export const useSelectTodo = (): Todo | null => {
  try {
    const selectTodo = useTodoStore((state) => {
      try {
        // 确保state存在且有selectTodo属性
        if (!state) {
          console.warn("State is undefined in useSelectTodo");
          return null;
        }
        // 返回state.selectTodo，它现在是一个getter
        return state.selectTodo();
      } catch (error) {
        console.error("Error accessing selectTodo in store:", error);
        return null;
      }
    });
    // 确保返回的是null或有效的Todo对象
    return selectTodo || null;
  } catch (error) {
    console.error("Error in useSelectTodo hook:", error);
    return null;
  }
};

// 使用useMemo优化todoListData的获取，避免不必要的重渲染
export const useTodoListData = () => {
  try {
    const todoListData = useTodoStore((state) => state.todoListData || []);
    return Array.isArray(todoListData) ? todoListData : [];
  } catch (error) {
    console.error("Error in useTodoListData hook:", error);
    return [];
  }
};

export const useTasks = () => {
  try {
    const tasks = useTodoStore((state) => state.tasks || []);
    return Array.isArray(tasks) ? tasks : [];
  } catch (error) {
    console.error("Error in useTasks hook:", error);
    return [];
  }
};

export const usePinnedTasks = () => {
  try {
    const pinnedTasks = useTodoStore((state) => state.pinnedTasks || []);
    return Array.isArray(pinnedTasks) ? pinnedTasks : [];
  } catch (error) {
    console.error("Error in usePinnedTasks hook:", error);
    return [];
  }
};

export { useTodoStore };
export type { TodoState };
