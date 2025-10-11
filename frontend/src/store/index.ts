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

export const useTodoStore = create<TodoState>()(
  // 添加devtools中间件
  devtools(
    // 需要本地化再解开
    // persist(
    (set, get: () => TodoState) => {
      // 标签实时更新功能
      const subscribeToTagUpdates = () => {
        // 连接到SSE服务
        sseService.connect();

        // 订阅标签更新事件
        return sseService.onTagUpdate((event) => {
          const { type, tag, tagId } = event;
          
          // 使用updateLocal方法更新本地状态，避免发送API请求
          const localAction = {
            type,
            tag,
            tagId
          } as any;
          
          // 直接调用updateLocal方法更新本地状态
          tagActions.updateLocal(localAction, set, get);
        });
      };

      // 清单实时更新功能
      const subscribeToListUpdates = () => {
        // @ts-ignore - 我们已经在listActions中扩展了SSE服务的类型
        return sseService.onListUpdate((event: ListUpdateEvent) => {
          const { type, listId, list } = event;
          
          // 根据事件类型更新本地状态
          switch (type) {
            case "create":
              if (list) {
                // 检查是否存在同名且处于pending状态的清单
                const hasPendingList = get().todoListData.some(
                  l => l.title === list.title && l.isPending
                );
                
                // 只在不存在待处理的同名清单时才添加（避免重复）
                if (!hasPendingList) {
                  set(
                    (state) => ({
                      todoListData: [...state.todoListData, list]
                    })
                  );
                }
              }
              break;
            case "update":
              if (listId && list) {
                set(
                  (state) => ({
                    todoListData: state.todoListData.map(l => 
                      l.id === listId ? list : l
                    )
                  })
                );
              }
              break;
            case "delete":
              if (listId) {
                set(
                  (state) => ({
                    todoListData: state.todoListData.filter(l => l.id !== listId),
                    // 移除关联的分组
                    groups: state.groups.filter(g => g.listId !== listId),
                    // 根据targetListId和mode处理任务移动
                    tasks: state.tasks.map(task => {
                      if (task.listId === listId) {
                        // 如果提供了targetListId，将任务移动到目标清单
                        if (event.targetListId) {
                          return {
                            ...task,
                            listId: event.targetListId,
                            // 如果mode为delete，标记为已删除
                            ...(event.mode === 'delete' && { deletedAt: new Date().toISOString() }),
                            groupId: undefined // 清除groupId
                          };
                        } else if (event.mode === 'delete') {
                          // 如果没有targetListId但mode为delete，标记为已删除并清除listId
                          return {
                            ...task,
                            deletedAt: new Date().toISOString(),
                            listId: '',
                            groupId: undefined // 清除groupId
                          };
                        }
                      }
                      return task;
                    })
                  })
                );
              }
              break;
          }
        });
      };

      // 任务实时更新功能
      const subscribeToTodoUpdates = () => {
        // @ts-ignore
        return sseService.onTodoUpdate((event: TodoUpdateEvent) => {
          const { type, todo, todoId, todoIds, updateData } = event;
          
          // 使用updateLocal方法更新本地状态，避免发送API请求
          switch (type) {
            case "create":
              if (todo) {
                // 添加新任务
                set((state) => ({
                  tasks: [...state.tasks, todo]
                }));
              }
              break;
            case "update":
              if (todoId && updateData) {
                // 更新单个任务
                set((state) => ({
                  tasks: state.tasks.map(task => 
                    task.id === todoId ? { ...task, ...updateData } : task
                  )
                }));
              }
              break;
            case "update_with_children":
              if (todoId && updateData) {
                // 使用updateLocalTodoData处理级联更新
                import("@/utils/updateLocalTreeData").then(({ updateLocalTodoData }) => {
                  set((state) => ({
                    tasks: updateLocalTodoData(state.tasks, {
                      action: "update_with_children",
                      id: todoId,
                      data: updateData
                    })
                  }));
                });
              }
              break;
            case "delete":
              if (todoId) {
                // 删除单个任务
                set((state) => ({
                  tasks: state.tasks.filter(task => task.id !== todoId)
                }));
              } else if (todoIds && todoIds.length > 0) {
                // 批量删除任务
                set((state) => ({
                  tasks: state.tasks.filter(task => !todoIds.includes(task.id))
                }));
              }
              break;
          }
        });
      };

      // 初始化SSE连接并保存取消订阅函数
      const unsubscribeTagUpdates = subscribeToTagUpdates();
      const unsubscribeListUpdates = subscribeToListUpdates();
      const unsubscribeTodoUpdates = subscribeToTodoUpdates();

      // 在组件卸载时清理订阅和连接
      window.addEventListener('beforeunload', () => {
        unsubscribeTagUpdates();
        unsubscribeListUpdates();
        unsubscribeTodoUpdates();
        sseService.disconnect();
      });

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
        // 修改dispatchList为乐观更新模式
        dispatchList: (action) => {
          // 1. 首先调用本地更新，立即更新UI
          listActions.updateListLocally(action, set, get);
          // 2. 然后发送API请求，异步处理后端操作
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
        loadCompletedTasks: (
          type: string,
          page?: number,
          pageSize?: number,
        ) => loadActions.loadCompletedTasks(set, get, type, page, pageSize),

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
    { name: "TodoStore" }
  )
);
