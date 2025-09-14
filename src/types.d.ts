import type { Priority } from "../constants";

export type Priority = (typeof Priority)[keyof typeof Priority];
import { ShowType, type ShowTypeValue } from "@/constants";
import { MenuProps } from "antd";
import { ReactElement } from "react";

export type ShowType = (typeof ShowType)[keyof typeof ShowType];

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: number;
  datetimeLocal?: string;
  deadline?: string;
  subTodo?: SubTodo[];
}

interface SubTodo {
  todoId: string;
  subId: string;
  subText: string;
  subCompleted: boolean;
  subPriority: number;
  subDatetimeLocal?: string;
  subDeadline?: string;
}

interface TodoAddAction {
  type: "added";
  text: string;
  completed: false;
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

interface TodoCompleteAllAction {
  type: "completedAll";
  completeOrUncomplete: boolean;
  showType?: ShowTypeValue;
}

interface TodoDeleteAllCompleteAction {
  type: "deletedAll";
  todoList: Todo[];
}

// ========= 新增 Action 类型 =========
interface SubTodoToggleAction {
  type: "toggle_sub";
  todoId: string; // 父任务 id
  subId: string; // 子任务 subId
}
/* 1. Action 类型 */
interface SubTodoChangedAction {
  type: "change_sub";
  todoId: string; // 父任务 id
  subId: string; // 要被替换的子任务 subId
  newSubTodo: SubTodo; // 全新的子任务对象
}

interface SubTodoAddedAction {
  type: "add_sub";
  todoId: string;
  text: string;
}

interface SubTodoDeletedAction {
  type: "delete_sub";
  todoId: string;
  subId: string;
}

type TodoAction =
  | TodoAddAction
  | TodoChangedAction
  | TodoDeletedAction
  | TodoReplaceAction
  | TodoCompleteAllAction
  | TodoDeleteAllCompleteAction
  | SubTodoToggleAction
  | SubTodoChangedAction
  | SubTodoAddedAction
  | SubTodoDeletedAction;

interface TodoItemProps {
  todo: Todo;
  onTodoChange: (action: TodoChangedAction | SubTodoChangedAction) => void;
  onTodoDelete: (action: TodoDeletedAction | SubTodoDeletedAction) => void;

  other?: boolean;
}

interface SubTodoItemProps {
  subTodo: SubTodo;
  todoId: string;
  onSubTodoChange: (action: SubTodoChangedAction) => void;
  onSubTodoDelete: (action: SubTodoDeletedAction) => void;
  other?: boolean;
}

interface ControllerProps {
  isAllDone: boolean;
  onSwitchShow: (showType: ShowTypeValue) => void;
  onCompleteAll: (action: TodoCompleteAllAction) => void;
  showType: ShowType;
}
interface ContextMenuProps {
  todo: Todo | SubTodo;
  onTodoChange: (action: TodoChangedAction | SubTodoChangedAction) => void;
  children: React.ReactNode;
  onTodoDelete: (action: TodoDeletedAction | SubTodoDeletedAction) => void;
}
