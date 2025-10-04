import type { Priority } from "@/constants";

import type { MenuProps } from "antd";

// 扩展TodoAction类型，添加listId字段
export interface TodoListGroupAction {
  listId?: string; // 指定操作的列表组 ID
}

// 新增列表组管理相关的Action类型
export interface AddTodoListGroupAction {
  type: "addedList";
  title: string;
  // 可选的emoji图标
  emoji?: string;
  // 可选的颜色
  color?: string;
}

export interface UpdateTodoListGroupAction {
  type: "updatedList";
  listId: string;
  title?: string;
  emoji?: string;
  color?: string;
}

export interface DeleteTodoListGroupAction {
  type: "deleteList";
  listId: string;
}

export interface ControllerProps {
  isAllDone: boolean;
  onCompleteAll: (action: TodoCompleteAllAction) => void;
  onAdded: () => void;
  groupMode?: "normal" | "time" | "none";
  onToggleGroupMode?: (mode: "normal" | "time" | "none") => void;
  searchText?: string;
  setSearchText?: (text: string) => void;
}

export type Priority = (typeof Priority)[keyof typeof Priority];

export interface TodoListData {
  id: string;
  title: string;
  emoji?: string; // 清单的emoji图标
  color?: string; // 清单的颜色
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: string;
  title: string;
  text?: string | null;
  completed: boolean;
  priority: number;
  datetimeLocal?: string | null;
  deadline?: string | null;
  parentId?: string | null; // 新增：指向父任务ID
  depth: number; // 新增：表示嵌套深度
  tags?: string[]; // 新增：任务标签数组，存储标签ID
  listId: string; // 新增：指向所属清单ID
  groupId?: string | null; // 新增：指向所属清单ID
  userId: string; // 新增：指向创建任务的用户ID
  isPinned?: boolean; // 新增：是否置顶
  pinnedAt?: string | null; // 新增：置顶时间，用于多个置顶任务的排序
  reminder_at?: string | null; // 新增：提醒时间
  is_reminded?: boolean; // 新增：是否已经提醒
}

interface TodoAddAction {
  type: "added";
  title: string;
  listId: string;
  completed: false;
  parentId?: string | null; // 可选：用于添加子任务
  depth?: number; // 可选：表示嵌套深度
  groupId?: string | null;
  isPinned?: boolean;
  pinnedAt?: string | null;
  tags?: string[] | [];
}

interface TodoToggleAction {
  type: "toggle";
  todoId: string;
  listId: string;
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
// 任务相关的Action类型
export type TodoActionExtended = TodoAction & TodoListGroupAction;

// 清单组相关的Action类型
export type ListGroupAction =
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
}
