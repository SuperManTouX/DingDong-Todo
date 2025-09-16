import type { Priority } from "@/constants";

import { ShowType, type ShowTypeValue } from "@/constants";

export interface ControllerProps {
  isAllDone: boolean;
  onSwitchShow: (showType: ShowTypeValue) => void;
  onCompleteAll: (action: TodoCompleteAllAction) => void;
  showType: ShowTypeValue;
  text: string;
  setText: (text: string) => void;
  onAdded: () => void;
}

export type Priority = (typeof Priority)[keyof typeof Priority];

export interface TodoListData {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  tasks: Todo[];
}

export type ShowType = (typeof ShowType)[keyof typeof ShowType];

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: number;
  datetimeLocal?: string;
  deadline?: string;
  parentId?: string | null; // 新增：指向父任务ID
  depth: number; // 新增：表示嵌套深度
}

interface TodoAddAction {
  type: "added";
  text: string;
  completed: false;
  parentId?: string | null; // 可选：用于添加子任务
  depth?: number; // 可选：表示嵌套深度
}

interface TodoToggleAction {
  type: "toggle";
  todoId: string;
  newCompleted: boolean;
}
interface TodoChangedAction {
  type: "changed";
  todo: Todo;
}

interface TodoDeletedAction {
  type: "deleted";
  deleteId: string;
}

interface TodoReplaceAction {
  type: "replaced";
  todoList: Todo[];
}

export interface TodoCompleteAllAction {
  type: "completedAll";
  completeOrUncomplete: boolean;
  showType?: ShowTypeValue;
}

interface TodoDeleteAllCompleteAction {
  type: "deletedAll";
  todoList: Todo[];
}

// ========= 新增 Action 类型 =========
// 扁平化后，子任务相关的Action可以被通用的TodoAction替代
// 但为了兼容性，我们保留部分Action类型

export type TodoAction =
  | TodoAddAction
  | TodoToggleAction
  | TodoChangedAction
  | TodoDeletedAction
  | TodoReplaceAction
  | TodoCompleteAllAction
  | TodoDeleteAllCompleteAction;

export interface TodoItemProps {
  todo: Todo;
  onTodoChange: (action: TodoAction) => void;

  other?: boolean;
}

// SubTodoItemProps接口已移除，扁平化后所有任务都使用Todo类型
export interface ContextMenuProps {
  todo: Todo;
  onAddSubTask: (parentId: string, parentDepth: number) => void;
  onTodoChange: (action: TodoAction) => void;
  children: React.ReactNode;
}

export interface TODOListProps {
  initialTodoList?: TodoListData;
}
