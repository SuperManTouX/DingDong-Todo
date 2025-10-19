import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { TodoState } from "./types";
import { todoActions } from "@/store/actions/todoActions";
import { listActions, type ListUpdateEvent } from "@/store/actions/listActions";
import { tagActions } from "@/store/actions/tagActions";
import { groupActions } from "@/store/actions/groupActions";
import { binActions } from "@/store/actions/binActions";
import { utilsActions } from "@/store/actions/utilsActions";
import { loadActions } from "@/store/actions/loadActions";
import { getListPinnedTodos } from "@/services/todoService";
import { SpecialLists } from "@/constants";
import sseService from "@/services/sseService";
import type { TodoUpdateEvent } from "@/services/sseService";
import { type SSEUpdateData, Todo, TreeTableData } from "@/types";

export const useTodoStore = create<TodoState>()(
  // 添加devtools中间件
  devtools(
    // 需要本地化再解开
    // persist(
    (set, get: () => TodoState) => {
      // 标签实时更新功能
      const subscribeToTagUpdates = () => {
        // 订阅标签更新事件
        return sseService.onTagUpdate((event) => {
          const { type, tag, tagId } = event;
          console.log(type, tag, tagId);

          // 使用updateLocal方法更新本地状态，避免发送API请求
          const localAction = {
            type,
            tag,
            tagId,
          } as any;

          // 直接调用updateLocal方法更新本地状态
          tagActions.updateLocal(localAction, set, get);
        });
      };

      // 清单实时更新功能
      const subscribeToListUpdates = () => {
        return sseService.onListUpdate((event) => {
          const { type, listId, list, targetListId, mode } = event;
          console.log("收到清单更新事件:", event);

          // 构建本地操作对象，直接使用event.type作为action类型
          const localAction: any = {
            type: event.type, // 直接使用'create', 'update', 'delete'作为action类型
          };

          // 根据事件类型设置必要的字段
          if (event.type === "create" && list) {
            // 对于创建操作，直接传递list对象
            localAction.list = list;
          } else if (event.type === "update" && listId && list) {
            // 对于更新操作，直接传递list对象
            localAction.list = list;
          } else if (event.type === "delete" && listId) {
            // 对于删除操作，设置listId和其他必要字段
            localAction.listId = listId;
            localAction.targetListId = targetListId;
            localAction.mode = mode;
          }

          // 使用listActions.updateListLocally更新本地状态
          listActions.updateListLocally(localAction, set, get);
        });
      };

      // 任务实时更新功能
      const subscribeToTodoUpdates = () => {
        // @ts-ignore
        return sseService.onTodoUpdate((event: SSEUpdateData) => {
          console.log("收到任务更新事件:", event);

          // 所有情况都使用handleTreeTasksUpdate处理任务更新
          todoActions.handleTreeTasksUpdate(event, set, get);
        });
      };

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
        isTasksLoading: false, // 初始化任务加载状态

        // 返回子树
        selectTodo: () => {
          const state = get();
          if (!state.selectTodoId) return null;
          // 有子任务时才有children属性
          const buildSubTaskTree = (
            tasks: Todo[],
            parentId: string,
            depth: number = 0,
          ): TreeTableData => {
            const task = tasks.find((t) => t.id === parentId && !t.deletedAt);
            if (!task) throw new Error(`Task with id ${parentId} not found or deleted`);

            // 先获取所有未删除的子任务
            const childrenTasks = tasks.filter((t) => t.parentId === parentId && !t.deletedAt);

            // 构建基础任务对象
            const treeNode: TreeTableData = {
              ...task,
              key: task.id,
              depth,
            };

            // 只有当有子任务时才添加 children 属性
            if (childrenTasks.length > 0) {
              treeNode.children = childrenTasks.map((child) =>
                buildSubTaskTree(tasks, child.id, depth + 1),
              );

              // 计算子节点统计信息
              let totalChildren = 0;
              let completedChildren = 0;

              // 递归计算所有子任务的数量和已完成数量
              const calculateStats = (nodes: TreeTableData[]) => {
                nodes.forEach((node) => {
                  // 当前子节点计入总数
                  totalChildren++;
                  // 如果当前子节点已完成，计入已完成数量
                  if (node.completed) {
                    completedChildren++;
                  }
                  // 递归计算子节点的子节点
                  if (node.children && node.children.length > 0) {
                    calculateStats(node.children);
                  }
                });
              };

              // 开始计算统计信息
              calculateStats(treeNode.children);

              // 设置统计属性
              treeNode.totalChildren = totalChildren;
              treeNode.completedChildren = completedChildren;
            }

            return treeNode;
          };
          const task = state.tasks.find((t) => t.id === state.selectTodoId && !t.deletedAt);
          return task ? buildSubTaskTree(state.tasks, task.id) : null;
        },

        // 任务相关操作
        dispatchTodo: (action) => todoActions.dispatchTodo(action, set, get),
        updateTodoLocally: (action) =>
          todoActions.updateTodoLocally(action, set, get),
        swapTasksPositions: (draggedTask, targetTask) =>
          todoActions.swapTasksPositions(draggedTask, targetTask, set, get),
        // 修改dispatchList为乐观更新模式
        dispatchList: (action) => {
          listActions.dispatchList(action, set, get);
        },
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
        loadCompletedTasks: (type: string, page?: number, pageSize?: number) =>
          loadActions.loadCompletedTasks(set, get, type, page, pageSize),

        // 标签实时更新功能暴露给组件使用
        subscribeToTagUpdates,
        // 清单实时更新功能暴露给组件使用
        subscribeToListUpdates,
        // 任务实时更新功能暴露给组件使用
        subscribeToTodoUpdates,

        // SSE连接控制方法
        disconnectSSE: () => sseService.disconnect(),
      };
    },
    { name: "TodoStore", trace: true },
  ),
);
