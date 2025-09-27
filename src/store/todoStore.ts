// 兼容性包装器 - 导出新的模块化store
import { useTodoStore } from './index';
import type { TodoState } from './types';

// 创建一个兼容性对象，代理所有方法调用
const todoStore = {
  ...useTodoStore,
  // 确保所有直接方法调用都能工作
  getState: () => useTodoStore.getState(),
  setState: (state) => useTodoStore.setState(state),
  subscribe: (listener) => useTodoStore.subscribe(listener),
};

// 获取store状态，用于导出所有属性
const storeState = useTodoStore.getState();

// 导出原始store和所有可能被直接访问的方法、属性
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
  loadData
} = storeState;

// 为了确保兼容性，创建并导出一些可能使用的自定义hooks
export const useSelectTodo = () => {
  const selectTodo = useTodoStore(state => state.selectTodo);
  return selectTodo;
};

export const useActiveGroup = () => {
  const activeGroup = useTodoStore(state => state.activeGroup);
  return activeGroup;
};

export const useTodoListData = () => {
  const todoListData = useTodoStore(state => state.todoListData);
  return todoListData;
};

export const useTasks = () => {
  const tasks = useTodoStore(state => state.tasks);
  return tasks;
};

export { useTodoStore };
export type { TodoState };
