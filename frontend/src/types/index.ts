import type { Priority } from "@/constants";

import { ShowType, type ShowTypeValue } from "@/constants";
import type { MenuProps } from "antd";

// 扩展TodoAction类型，添加groupId字段
export interface TodoListGroupAction {
  groupId?: string; // 指定操作的列表组 ID
}

// 新增列表组管理相关的Action类型
export interface AddTodoListGroupAction {
  type: "addListGroup";
  title: string;
  // 可选的emoji图标
  emoji?: string;
  // 可选的颜色
  color?: string;
  // 可选的初始任务
  initialTasks?: Todo[];
}

export interface UpdateTodoListGroupAction {
  type: "updateListGroup";
  groupId: string;
  title?: string;
  emoji?: string;
  color?: string;
}

export interface DeleteTodoListGroupAction {
  type: "deleteListGroup";
  groupId: string;
}

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
  emoji?: string; // 清单的emoji图标
  color?: string; // 清单的颜色
  createdAt: string;
  updatedAt: string;
  tasks: Todo[];
}

export type ShowType = (typeof ShowType)[keyof typeof ShowType];

export interface Todo {
  id: string;
  title: string;
  text?: string;
  completed: boolean;
  priority: number;
  datetimeLocal?: string;
  deadline?: string;
  parentId?: string | null; // 新增：指向父任务ID
  depth: number; // 新增：表示嵌套深度
  tags?: string[]; // 新增：任务标签数组，存储标签ID
  groupId: string; // 新增：指向所属列表组ID
}

interface TodoAddAction {
  type: "added";
  title: string;
  groupId: string;
  completed: false;
  parentId?: string | null; // 可选：用于添加子任务
  depth?: number; // 可选：表示嵌套深度
}

interface TodoToggleAction {
  type: "toggle";
  todoId: string;
  groupId: string;
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

// 标签相关的Action类型
interface AddTagToTodoAction {
  type: "addTagToTodo";
  todoId: string;
  tagId: string;
}

interface RemoveTagFromTodoAction {
  type: "removeTagFromTodo";
  todoId: string;
  tagId: string;
}

interface UpdateTodoTagsAction {
  type: "updateTodoTags";
  todoId: string;
  tags?: string[];
}

export interface TagAction {
  type: string;
  payload?: any;
}

export interface AddTagAction extends TagAction {
  type: "addTag";
  payload: Omit<Tag, "id"> & { id?: string };
}

export interface UpdateTagAction extends TagAction {
  type: "updateTag";
  payload: { id: string; updates: Partial<Tag> };
}

export interface DeleteTagAction extends TagAction {
  type: "deleteTag";
  payload: string;
}

export interface InitializeTagsAction extends TagAction {
  type: "initializeTags";
  payload?: Tag[];
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
  | TodoDeleteAllCompleteAction
  | AddTagToTodoAction
  | RemoveTagFromTodoAction
  | UpdateTodoTagsAction;

// 扩展后的Action类型，用于重构后的reducer
export type TodoActionExtended =
  | (TodoAction & TodoListGroupAction)
  | AddTodoListGroupAction
  | UpdateTodoListGroupAction
  | DeleteTodoListGroupAction;

export type TagReducerAction =
  | AddTagAction
  | UpdateTagAction
  | DeleteTagAction
  | InitializeTagsAction;

export interface TodoItemProps {
  todo: Todo;
  other?: boolean;
  hasSubTasks?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

// 标签接口定义
export interface Tag {
  id: string;
  name: string;
  parentId: string | null;
  color?: string;
  subTags?: Tag[]; // 可选：用于树形结构展示的子标签
}

// SubTodoItemProps接口已移除，扁平化后所有任务都使用Todo类型
export interface ContextMenuProps {
  todo: Todo;
  children: React.ReactNode;
}

export interface SideMenuProps {
  menuItem: MenuProps["items"];
  onActiveGroupChange: (groupId: string) => void;
}
