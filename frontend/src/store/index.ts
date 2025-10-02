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
        activeListId: "",
        selectTodoId: null,
        bin: [], // 初始化回收站数据
        tasks: [],
        groups: [],
        userId: null,
        pinnedTasks: [], // 初始化置顶任务数组

        // 计算属性实现
        activeGroup: () => {
          const state = get();
          return (
            state.todoListData.find((item) => item.id === state.activeListId) ||
            ({} as any)
          );
        },
        selectTodo: () => {
          const state = get();
          if (!state.selectTodoId) return null;
          return (
            state.tasks.find((todo) => todo.id === state.selectTodoId) || null
          );
        },

        // 任务相关操作
        dispatchTodo: (action) => todoActions.dispatchTodo(action, set, get),
        dispatchList: (action) => listActions.dispatchList(action, set, get),
        dispatchTag: (action) => tagActions.dispatchTag(action, set, get),

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
        getActiveListData: () => {
          const state = get();
          return (
            state.todoListData.find((list) => list.id === state.activeListId) ||
            ({} as any)
          );
        },
        getActiveListTasks: () => {
          const state = get();
          return state.tasks.filter((todo) => {
            if (state.activeListId in SpecialLists) return true;
            return todo.listId === state.activeListId;
          });
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
        loadPinnedTasks: (listId?: string) => loadActions.loadPinnedTasks(set, get, listId),
        loadListPinnedTasks: async (listId: string) => {
          try {
            const pinnedTasks = await getListPinnedTodos(listId);
            set({ pinnedTasks });
          } catch (error) {
            console.error(`加载清单 ${listId} 的置顶任务失败:`, error);
          }
        },
      };
    },
    { name: "TodoStore" },
  ),
);
