import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { TodoState } from "./types";
import { todoActions } from "@/store/actions/todoActions";
import { listActions } from "@/store/actions/listActions";
import { tagActions } from "@/store/actions/tagActions";
import { groupActions } from "@/store/actions/groupActions";
import { binActions } from "@/store/actions/binActions";
import { utilsActions } from "@/store/actions/utilsActions";
import { loadActions } from "@/store/actions/loadActions";
import { getListPinnedTodos } from "@/services/todoService";
import { SpecialLists } from "@/constants";
import { type } from "node:os";

export const useTodoStore = create<TodoState>()(
  // 添加devtools中间件
  devtools(
    // 需要本地化再解开
    // persist(
    (set, get: () => TodoState) => {
      // 将计算属性实现为函数而不是getter

      return {
        // 初始化状态
        todoListData: [],
        todoTags: [],
        activeListId: "todolist-001",
        selectTodoId: null,
        // bin: [], // 初始化回收站数据
        // 当前用户未置顶任务
        tasks: [],
        groups: [],
        userId: null,
        pinnedTasks: [], // 初始化置顶任务数组
        displayCompletedTasks: [], // 新增：存储已完成的任务
        needsTableReload: false, // 初始化表格刷新标记

        selectTodo: () => {
          const state = get();
          if (!state.selectTodoId) return null;
          return (
            state.tasks.find((todo) => todo.id === state.selectTodoId) ||
            state.pinnedTasks.find((todo) => todo.id === state.selectTodoId)
          );
        },

        // 任务相关操作
        dispatchTodo: (action) => todoActions.dispatchTodo(action, set, get),
        updateTodoLocally: (action) =>
          todoActions.updateTodoLocally(action, set, get),
        swapTasksPositions: (draggedTask, targetTask) =>
          todoActions.swapTasksPositions(draggedTask, targetTask, set, get),
        dispatchList: (action) => listActions.dispatchList(action, set, get),
        dispatchTag: (action) => tagActions.dispatchTag(action, set, get),

        // 任务层级相关操作
        updateParentId: async (taskId: string, parentId: string | null) => {
          const { updateParentId: updateParentIdApi } = await import(
            "@/services/todoService"
          );
          return updateParentIdApi(taskId, parentId);
        },

        // 分组相关操作
        addGroup: (listId, groupName, groupItemIds) =>
          groupActions.addGroup(listId, groupName, groupItemIds, set, get),
        updateGroup: (nGroup) => groupActions.updateGroup(nGroup, set, get),
        deleteGroup: (listId, groupName) =>
          groupActions.deleteGroup(listId, groupName, set, get),
        getGroupsByListId: (listId) =>
          groupActions.getGroupsByListId(listId, get),

        // 回收站相关操作
        moveToBin: (todo) => binActions.moveToBin(todo, set, get),
        restoreFromBin: (todoId) => binActions.restoreFromBin(todoId, set, get),
        deleteFromBin: (todoId) => binActions.deleteFromBin(todoId, set, get),
        emptyBin: () => binActions.emptyBin(set, get),
        getBinTodos: () => binActions.getBinTodos(get),

        // 辅助方法
        getTodoById: (id) => {
          const state = get();
          return state.tasks.find((todo) => todo.id === id) || null;
        },
        getGroupByTodoId: (todoId) => {
          const state = get();
          const todo = state.tasks.find((t) => t.id === todoId);
          if (!todo || !todo.listId) return null;
          return (
            state.todoListData.find((group) => group.id === todo.listId) || null
          );
        },
        getActiveListData: (listId = get().activeListId) => {
          const state = get();
          return (
            state.todoListData.find((list) => list.id === listId) || ({} as any)
          );
        },
        // 计算属性，返回当前状态中的任务（保持同步）
        getActiveListTasks: () => {
          const state = get();
          return state.tasks;
        },

        // 工具方法
        setActiveListId: (id) => utilsActions.setActiveListId(id, set),
        setSelectTodoId: (id) => utilsActions.setSelectTodoId(id, set),
        setUserId: (id) => utilsActions.setUserId(id, set),

        // 数据加载
        loadDataAll: () => loadActions.loadDataAll(set, get),
        loadTodos: () => loadActions.loadTodos(set, get),
        loadTodoLists: () => loadActions.loadTodoLists(set, get),
        loadTags: () => loadActions.loadTags(set, get),
        loadGroups: () => loadActions.loadGroups(set, get),
        loadBinItems: () => loadActions.loadBinItems(set, get),
        // 从loadActions注册的方法，用于加载指定类型的任务
        loadTasksByType: (type: string) =>
          loadActions.loadTasksByType(set, get, type),
        // 加载已完成任务，支持分页
        loadCompletedTasks: (
          type: string,
          page?: number = 1,
          pageSize?: number = 20,
        ) => loadActions.loadCompletedTasks(set, get, type, page, pageSize),
      };
    },
    { name: "TodoStore" },
  ),
);
