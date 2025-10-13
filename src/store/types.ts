import {
  TodoListData,
  Todo,
  Tag,
  TodoActionExtended,
  TreeTableData,
} from "@/types";
import type { TagReducerAction, ListGroupAction } from "@/types";
import type { Group } from "@/types/group";

// 完整的状态类型定义
export interface TodoState {
  // 核心数据 - 持久化存储
  todoListData: TodoListData[];
  todoTags: Tag[];
  activeListId: string;
  selectTodoId: string | null;
  bin: Todo[]; // 回收站数据
  tasks: Todo[]; // 独立的任务数组
  groups: Group[]; // 全局分组数组
  userId: string | null; // 用户ID字段
  pinnedTasks: Todo[]; // 置顶任务数组
  needsTableReload: boolean; // 标记表格是否需要刷新
  isTasksLoading: boolean; // 任务加载状态

  // 计算属性 - 这些属性在持久化时会被忽略
  activeGroup(): TodoListData;
  selectTodo(): TreeTableData | null;

  // 处理todo相关的action
  dispatchTodo: (action: TodoActionExtended) => Promise<void>;
  dispatchList: (action: ListGroupAction) => void;
  dispatchTag: (action: TagReducerAction) => void;
  setActiveListId: (id: string) => void;
  setSelectTodoId: (id: string | null) => void;
  setUserId: (id: string | null) => void;

  // 分组相关操作
  addGroup: (listId: string, groupName: string, groupItemIds: string[]) => void;
  updateGroup: (nGroup: Group) => void;
  deleteGroup: (listId: string, groupName: string) => void;
  getGroupsByListId: (listId: string) => Group[];
  updateParentId: (listId: string, parentId: string) => void;
  // 回收站相关操作
  moveToBin: (todo: Todo) => void; // 将任务移动到回收站
  restoreFromBin: (todoId: string) => void; // 从回收站恢复任务
  deleteFromBin: (todoId: string) => void; // 从回收站删除单个任务
  emptyBin: () => void; // 清空回收站
  getBinTodos: () => Todo[]; // 获取回收站中的所有任务

  // 辅助方法 - 用于查询和获取特定数据
  getTodoById: (id: string | null) => Promise<Todo | null>;
  getGroupByTodoId: (todoId: string) => TodoListData | null;
  getActiveListData: () => TodoListData;
  getActiveListTasks: () => Todo[];

  // API加载数据方法
  loadDataAll: () => Promise<void>;
  loadTags: () => Promise<void>;
  loadTasksByType: (taskId: string) => Promise<void>;
  loadCompletedTasks: (
    type: string,
    page?: number,
    pageSize?: number,
  ) => Promise<void>;
}
