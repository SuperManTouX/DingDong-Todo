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

        // 添加计算属性
        // 方法形式的activeGroup
        get activeGroup() {
          try {
            const state = get();
            // 确保state存在且有todoListData
            if (!state || !Array.isArray(state.todoListData)) {
              console.warn("State or todoListData is invalid");
              return {
                id: "",
                title: "",
                userId: "",
                createdAt: "",
                updatedAt: "",
              };
            }
            return (
              state.todoListData.find(
                (list) => list.id === state.activeListId,
              ) || {
                id: "",
                title: "",
                userId: "",
                createdAt: "",
                updatedAt: "",
              }
            );
          } catch (error) {
            console.error("Error in activeGroup getter:", error);
            return {
              id: "",
              title: "",
              userId: "",
              createdAt: "",
              updatedAt: "",
            };
          }
        },

        // 方法形式的selectTodo
        // 普通方法，返回计算后的单个 task
        selectTodo() {
          const state = get();
          if (!state.selectTodoId) return null;
          return state.tasks.find((t) => t.id === state.selectTodoId) ?? null;
        },

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
        getGroupsByListId: (listId) =>
          groupActions.getGroupsByListId(listId, get),

        // 回收站相关操作
        moveToBin: (todo) => binActions.moveToBin(todo, set),
        restoreFromBin: (todoId) => binActions.restoreFromBin(todoId, set, get),
        deleteFromBin: (todoId) => binActions.deleteFromBin(todoId, set),
        emptyBin: () => binActions.emptyBin(set),
        getBinTodos: () => binActions.getBinTodos(get),

        // 工具方法
        getTodoById: (id) => utilsActions.getTodoById(id, get),
        getGroupByTodoId: (todoId) =>
          utilsActions.getGroupByTodoId(todoId, get),
        getActiveListData: () => utilsActions.getActiveListData(get),
        getActiveListTasks: () => utilsActions.getActiveListTasks(get),
        setActiveListId: (id) => utilsActions.setActiveListId(id, set),
        setSelectTodoId: (id) => utilsActions.setSelectTodoId(id, set),
        setUserId: (id) => utilsActions.setUserId(id, set),

        // 数据加载
        loadDataAll: () => loadActions.loadDataAll(set, get),
        loadTags: () => loadActions.loadActions(set, get),
      };
    },
    { name: "TodoStore" },
  ),
);
