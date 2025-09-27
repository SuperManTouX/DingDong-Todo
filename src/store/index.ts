import { create } from "zustand";
import type { TodoState } from "./types";
import { todoActions } from "./slices/todoSlice";
import { listActions } from "./slices/listSlice";
import { tagActions } from "./slices/tagSlice";
import { groupActions } from "./slices/groupSlice";
import { binActions } from "./slices/binSlice";
import { utilsActions } from "./slices/utilsSlice";
import { loadActions } from "./slices/loadSlice";

export const useTodoStore = create<TodoState>()(
  // 需要本地化再解开
  // persist(
  (set, get) => ({
    // 初始化状态
    todoListData: [],
    todoTags: [],
    activeListId: "",
    selectTodoId: null,
    bin: [], // 初始化回收站数据
    tasks: [],
    groups: [],
    userId: null,

    // 计算属性 - 当前激活的任务组
    activeGroup: {
      id: "",
      title: "",
      userId: "",
      createdAt: "",
      updatedAt: "",
    },

    // 计算属性 - 当前选中的任务
    selectTodo: null,

    // 任务相关操作
    dispatchTodo: (action) => todoActions.dispatchTodo(action, set, get),

    // 列表相关操作
    dispatchList: (action) => listActions.dispatchList(action, set, get),

    // 标签相关操作
    dispatchTag: (action) => tagActions.dispatchTag(action, set, get),

    // 分组相关操作
    addGroup: (listId, groupName, groupItemIds) =>
      groupActions.addGroup(listId, groupName, groupItemIds, set, get),
    updateGroup: (nGroup) => groupActions.updateGroup(nGroup, set),
    deleteGroup: (listId, groupName) =>
      groupActions.deleteGroup(listId, groupName, set, get),
    getGroupsByListId: (listId) => groupActions.getGroupsByListId(listId, get),

    // 回收站相关操作
    moveToBin: (todo) => binActions.moveToBin(todo, set, get),
    restoreFromBin: (todoId) => binActions.restoreFromBin(todoId, set, get),
    deleteFromBin: (todoId) => binActions.deleteFromBin(todoId, set),
    emptyBin: () => binActions.emptyBin(set),
    getBinTodos: () => binActions.getBinTodos(get),

    // 工具方法
    getTodoById: (id) => utilsActions.getTodoById(id, get),
    getGroupByTodoId: (todoId) => utilsActions.getGroupByTodoId(todoId, get),
    getActiveListData: () => utilsActions.getActiveListData(get),
    getActiveListTasks: () => utilsActions.getActiveListTasks(get),
    setActiveListId: (id) => utilsActions.setActiveListId(id, set),
    setSelectTodoId: (id) => utilsActions.setSelectTodoId(id, set),
    setUserId: (id) => utilsActions.setUserId(id, set),

    // 数据加载
    loadData: () => loadActions.loadData(set, get),
  }),
  // )
);
