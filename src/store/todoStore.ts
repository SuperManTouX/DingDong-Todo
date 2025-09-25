import { create } from "zustand";
import { produce } from "immer";
import type { TodoListData, Todo, Tag, TodoActionExtended } from "@/types";
import type { TagReducerAction, ListGroupAction } from "@/types";
import type { Group } from "@/types/group";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import { Priority } from "@/constants";
import { useAuthStore } from "@/store/authStore";
import {
  getAllTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  getAllTodoLists,
  createTodoList,
  updateTodoList,
  deleteTodoList,
  getAllTags,
  createTag,
  updateTag,
  deleteTag,
  getAllGroups,
  createGroup,
  updateGroup as updateGroupApi,
  deleteGroup as deleteGroupApi,
  getBinItems,
  moveTaskToBin,
  restoreFromBin,
  deleteFromBin,
  emptyBin,
} from "../services/todoService";
import { collectTaskWithSubtasks } from "@/utils/taskRecursionUtils";

// 完整的状态类型定义
interface TodoState {
  // 核心数据 - 持久化存储
  todoListData: TodoListData[];
  todoTags: Tag[];
  activeListId: string;
  selectTodoId: string | null;
  bin: Todo[]; // 回收站数据
  tasks: Todo[]; // 独立的任务数组
  groups: Group[]; // 全局分组数组
  userId: string | null; // 用户ID字段

  // 计算属性 - 这些属性在持久化时会被忽略
  activeGroup: TodoListData;
  selectTodo: Todo | null;

  // 处理todo相关的action
  dispatchTodo: (action: TodoActionExtended) => void;
  dispatchList: (action: ListGroupAction) => void;
  dispatchTag: (action: TagReducerAction) => void;
  setActiveListId: (id: string) => void;
  setSelectTodoId: (id: string | null) => void;
  setUserId: (id: string | null) => void;

  // 分组相关操作
  addGroup: (listId: string, groupName: string, groupItemIds: string[]) => void;
  updateGroup: (nGroup: Group) => void;
  deleteGroup: (listId: string, groupName: string) => void;
  getGroupsByListId: (listId: string) => Group[];

  // 回收站相关操作
  moveToBin: (todo: Todo) => void; // 将任务移动到回收站
  restoreFromBin: (todoId: string) => void; // 从回收站恢复任务
  deleteFromBin: (todoId: string) => void; // 从回收站删除单个任务
  emptyBin: () => void; // 清空回收站
  getBinTodos: () => Todo[]; // 获取回收站中的所有任务

  // 辅助方法 - 用于查询和获取特定数据
  getTodoById: (id: string) => Todo | null;
  getGroupByTodoId: (todoId: string) => TodoListData | null;
  getActiveListData: () => TodoListData;
  getActiveListTasks: () => Todo[];

  // API加载数据方法
  loadData: () => Promise<void>;
}

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

    // 处理todo相关的action
    dispatchTodo: (action: TodoActionExtended) => {
      set(
        produce((draftState: TodoState) => {
          switch (action.type) {
            case "completedAll": {
              const { completeOrUncomplete, listId } = action;

              // 直接操作独立的tasks数组
              draftState.tasks.forEach((task: Todo) => {
                // 仅处理指定清单的任务
                if (task.listId !== listId) return task;
                task.completed = completeOrUncomplete;
              });
              break;
            }
            case "added": {
              // 为新任务生成唯一ID和时间戳
              const newTask: Todo = {
                id: uuidv4(),
                title: action.title,
                text: action.text || undefined,
                completed: action.completed || false,
                priority: action.priority || Priority.normal,
                deadline: action.deadline || undefined,
                parentId: action.parentId || null,
                depth: action.depth || 0,
                tags: action.tags || [],
                listId: action.listId,
                groupId: action.groupId || undefined,
                userId: action.userId || get().userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              // 添加到任务数组
              draftState.tasks.push(newTask);

              // 如果有父任务，更新父任务的子任务信息
              if (newTask.parentId) {
                const parentTaskIndex = draftState.tasks.findIndex(
                  (task) => task.id === newTask.parentId,
                );
                if (parentTaskIndex !== -1) {
                  draftState.tasks[parentTaskIndex].updatedAt =
                    new Date().toISOString();
                }
              }
              break;
            }
            case "changed": {
              // 找到要更新的任务并更新
              const todoIndex = draftState.tasks.findIndex(
                (task) => task.id === action.todo.id,
              );
              if (todoIndex !== -1) {
                draftState.tasks[todoIndex] = {
                  ...draftState.tasks[todoIndex],
                  ...action.todo,
                  updatedAt: new Date().toISOString(),
                };
              }
              break;
            }
            case "deleted": {
              // 从任务数组中移除
              draftState.tasks = draftState.tasks.filter(
                (task) => task.id !== action.todo.id,
              );
              // 同时移除子任务
              draftState.tasks = draftState.tasks.filter(
                (task) => task.parentId !== action.todo.id,
              );
              break;
            }
            default:
              break;
          }
        }),
      );

      // 对于需要API调用的操作，在state更新后异步调用API
      const handleApiCall = async () => {
        const { userId } = useAuthStore.getState();
        if (!userId) return;

        try {
          switch (action.type) {
            case "added":
              await createTodo({
                title: action.title,
                completed: action.completed || false,
                priority: action.priority || Priority.normal,
                deadline: action.deadline || undefined,
                parentId: action.parentId || null,
                depth: action.depth || 0,
                tags: action.tags || [],
                listId: action.listId,
                groupId: action.groupId || undefined,
                userId,
              });
              break;
            case "changed":
              if (action.todo.id) {
                await updateTodo(action.todo.id, {
                  ...action.todo,
                  userId,
                });
              }
              break;
            case "deleted":
              if (action.todo.id) {
                await deleteTodo(action.todo.id);
              }
              break;
          }
        } catch (error) {
          console.error(`API操作失败 (${action.type}):`, error);
          // 这里可以添加错误通知给用户
        }
      };

      handleApiCall();
    },

    // 处理列表相关的action
    dispatchList: async (action: ListGroupAction) => {
      const authState = useAuthStore.getState();
      const { userId } = authState;
      if (!userId) return;

      try {
        // 先调用API
        switch (action.type) {
          case "addedList": {
            const listData = {
              title: action.title,
              emoji: action.emoji,
              color: action.color,
              userId,
            };

            // 等待API调用成功
            const createdList = await createTodoList(listData);

            // API调用成功后再更新本地状态
            set(
              produce((draftState: TodoState) => {
                draftState.todoListData.push(createdList);
              }),
            );
            break;
          }
          case "updatedList": {
            const updateData = {
              title: action.title,
              emoji: action.emoji,
              color: action.color,
            };

            // 等待API调用成功
            const updatedList = await updateTodoList(action.listId, updateData);

            // API调用成功后再更新本地状态
            set(
              produce((draftState: TodoState) => {
                const listIndex = draftState.todoListData.findIndex(
                  (list) => list.id === action.listId,
                );
                if (listIndex !== -1) {
                  draftState.todoListData[listIndex] = updatedList;
                }
              }),
            );
            break;
          }
          case "deletedList": {
            // 等待API调用成功
            await deleteTodoList(action.listId);

            // API调用成功后再更新本地状态
            set(
              produce((draftState: TodoState) => {
                draftState.todoListData = draftState.todoListData.filter(
                  (list) => list.id !== action.listId,
                );
                // 同时删除该列表下的所有任务
                draftState.tasks = draftState.tasks.filter(
                  (task) => task.listId !== action.listId,
                );
              }),
            );
            break;
          }
          default:
            break;
        }
      } catch (error) {
        console.error(`API操作失败 (${action.type}):`, error);
        // 可以在这里添加用户友好的错误提示
        throw error; // 重新抛出错误以便调用者可以处理
      }
    },

    // 处理标签相关的action
    dispatchTag: (action: TagReducerAction) => {
      set(
        produce((draftState: TodoState) => {
          switch (action.type) {
            case "addTag":
              // 使用action.payload中的数据
              const newTag: Tag = {
                id: uuidv4(),
                name: action.payload.name,
                color: action.payload.color || "#1890ff",
                parentId: action.payload.parentId || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              draftState.todoTags.push(newTag);
              break;
            case "updateTag":
              // 使用action.payload中的数据
              const tagIndex = draftState.todoTags.findIndex(
                (tag) => tag.id === action.payload.id,
              );
              if (tagIndex !== -1) {
                draftState.todoTags[tagIndex] = {
                  ...draftState.todoTags[tagIndex],
                  ...action.payload.updates,
                  updatedAt: new Date().toISOString(),
                };
              }
              break;
            case "deleteTag":
              // 使用action.payload作为tagId
              draftState.todoTags = draftState.todoTags.filter(
                (tag) => tag.id !== action.payload,
              );
              // 同时从所有任务中移除该标签
              draftState.tasks = draftState.tasks.map((task) => ({
                ...task,
                tags:
                  task.tags?.filter((tagId) => tagId !== action.payload) || [],
              }));
              break;
            case "initializeTags":
              // 初始化标签列表
              if (action.payload) {
                draftState.todoTags = action.payload;
              }
              break;
            default:
              break;
          }
        }),
      );

      // 对于需要API调用的操作，在state更新后异步调用API
      const handleApiCall = async () => {
        try {
          switch (action.type) {
            case "addTag":
              await createTag({
                name: action.payload.name,
                color: action.payload.color,
                parentId: action.payload.parentId || null,
              });
              break;
            case "updateTag":
              await updateTag(action.payload.id, action.payload.updates);
              break;
            case "deleteTag":
              await deleteTag(action.payload);
              break;
          }
        } catch (error) {
          console.error(`标签API操作失败 (${action.type}):`, error);
          // 这里可以添加错误通知给用户
        }
      };

      handleApiCall();
    },

    // 设置激活的列表ID
    setActiveListId: (id: string) => {
      set({ activeListId: id });
    },

    // 设置选中的任务ID
    setSelectTodoId: (id: string | null) => {
      set({ selectTodoId: id });
    },

    // 设置用户ID
    setUserId: (id: string | null) => {
      set({ userId: id });
    },

    // 添加分组
    addGroup: async (
      listId: string,
      groupName: string,
      groupItemIds: string[],
    ) => {
      try {
        // 准备新分组数据
        const groupData = {
          listId,
          groupName,
          userId: get().userId,
        };

        // 调用后端API创建分组
        const newGroup = await createGroup(groupData);

        // 更新本地状态
        set(
          produce((draftState: TodoState) => {
            draftState.groups.push(newGroup);

            // 更新任务的groupId
            if (groupItemIds && groupItemIds.length > 0) {
              draftState.tasks.forEach((task) => {
                if (groupItemIds.includes(task.id)) {
                  task.groupId = newGroup.id;
                  task.updatedAt = new Date().toISOString();
                }
              });
            }
          }),
        );
      } catch (error) {
        console.error("添加分组失败:", error);
        throw error;
      }
    },

    // 更新分组
    updateGroup: async (nGroup: Group) => {
      try {
        // 调用后端API更新分组
        await updateGroupApi(nGroup.id, nGroup);
        // 更新本地状态
        set(
          produce((draftState: TodoState) => {
            const groupIndex = draftState.groups.findIndex(
              (group) => group.id === nGroup.id,
            );
            if (groupIndex !== -1) {
              draftState.groups[groupIndex] = nGroup;
            }
          }),
        );
      } catch (error) {
        console.error("更新分组失败:", error);
        throw error;
      }
    },

    // 删除分组
    deleteGroup: async (groupId: string) => {
      try {
        // 查找要删除的分组
        const groupToDelete = get().groups.find(
          (group) => group.id === groupId,
        );
        if (!groupToDelete) return;

        // 调用后端API删除分组
        await deleteGroupApi(groupToDelete.id);

        // 更新本地状态
        set(
          produce((draftState: TodoState) => {
            // 从分组数组中删除
            draftState.groups = draftState.groups.filter(
              (group) => group.id !== groupId,
            );

            // 清除相关任务的groupId
            draftState.tasks.forEach((task) => {
              if (task.groupId === groupId) {
                task.groupId = undefined;
                task.updatedAt = new Date().toISOString();
              }
            });
          }),
        );
      } catch (error) {
        console.error("删除分组失败:", error);
        throw error;
      }
    },

    // 根据列表ID获取分组
    getGroupsByListId: (listId: string) => {
      const { groups } = get();
      return groups.filter((group) => group.listId === listId);
    },

    // 将任务移动到回收站
    moveToBin: async (todo: Todo) => {
      try {
        // 调用API将任务移至回收站
        const response = await moveTaskToBin(todo.id);

        set(
          produce((draftState: TodoState) => {
            // 使用通用工具函数收集所有需要移动的任务
            const tasksToMove = collectTaskWithSubtasks(
              draftState.tasks,
              todo.id,
            );

            // 批量移除任务
            tasksToMove.forEach((task) => {
              draftState.tasks = draftState.tasks.filter(
                (t) => t.id !== task.id,
              );
            });

            // 批量添加到回收站
            draftState.bin.push(...tasksToMove);
          }),
        );

        return response;
      } catch (error) {
        console.error("移动任务到回收站失败:", error);
        throw error;
      }
    },

    // 从回收站恢复任务
    restoreFromBin: async (todoId: string) => {
      try {
        const response = await restoreFromBin(todoId);

        // 重新加载数据以确保状态同步
        await get().loadData();

        return response;
      } catch (error) {
        console.error("恢复任务失败:", error);
        throw error;
      }
    },

    // 从回收站删除单个任务
    deleteFromBin: async (todoId: string) => {
      try {
        const response = await deleteFromBin(todoId);

        set(
          produce((draftState: TodoState) => {
            // 从内存中的bin数组移除
            draftState.bin = draftState.bin.filter(
              (todo) => todo.id !== todoId,
            );
          }),
        );

        return response;
      } catch (error) {
        console.error("永久删除任务失败:", error);
        throw error;
      }
    },

    // 清空回收站
    emptyBin: async () => {
      try {
        const response = await emptyBin();

        set({ bin: [] });

        return response;
      } catch (error) {
        console.error("清空回收站失败:", error);
        throw error;
      }
    },

    // 获取回收站中的所有任务
    getBinTodos: () => {
      return get().bin;
    },

    // 根据ID获取任务
    getTodoById: (id: string) => {
      const { tasks } = get();
      return tasks.find((task) => task.id === id) || null;
    },

    // 根据任务ID获取所属分组
    getGroupByTodoId: (todoId: string) => {
      const { tasks, groups, todoListData } = get();
      const task = tasks.find((t) => t.id === todoId);
      if (!task || !task.groupId) return null;

      const group = groups.find((g) => g.id === task.groupId);
      if (!group) return null;

      return todoListData.find((list) => list.id === group.listId) || null;
    },

    // 获取当前激活的列表数据
    getActiveListData: () => {
      const { todoListData, activeListId } = get();
      switch (activeListId) {
        case "aa":
          return {
            id: "",
            title: "今天",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: "",
          };
        case "bb":
          return {
            id: "",
            title: "最近七天",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: "",
          };
        case "bin":
          return {
            id: "",
            title: "回收站",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: "",
          };
        case "cp":
          return {
            id: "",
            title: "已完成",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: "",
          };
      }
      // 返回激活的列表数据，或者默认数据
      return (
        todoListData.find((list) => list.id === activeListId) || {
          id: "",
          title: "我的待办事项",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: "",
        }
      );
    },

    // 获取当前激活列表的任务
    getActiveListTasks: () => {
      const token = localStorage.getItem("token");
      const { activeListId, tasks, bin, todoTags } = get();

      // 安全检查 - 确保state和相关属性存在
      if (!activeListId || !tasks || !token) {
        return [];
      }

      let resultTasks: Todo[] = [];
      // 如果是普通清单，返回清单关联的任务
      if (get().todoListData.some((l: TodoListData) => activeListId === l.id)) {
        resultTasks = tasks.filter((task) => task.listId === activeListId);
      } else {
        // 根据不同的视图类型返回对应的任务
        switch (activeListId) {
          // 今天
          case "aa":
            resultTasks = tasks.filter(
              (t) => t.deadline && dayjs(t.deadline).isSame(dayjs(), "day"),
            );
            break;

          // 最近七天
          case "bb":
            resultTasks = tasks.filter(
              (t) =>
                t.deadline &&
                dayjs(t.deadline).isAfter(dayjs().subtract(7, "day")) &&
                dayjs(t.deadline).isBefore(dayjs().add(7, "day")),
            );
            break;

          // 回收站
          case "bin":
            resultTasks = [...bin];
            break;

          // 已完成
          case "cp":
            resultTasks = tasks.filter((t) => t.completed);
            break;

          // 标签筛选
          default:
            resultTasks = tasks.filter((t) => {
              if (!t.tags) return false;
              // 直接匹配标签ID
              if (t.tags.includes(activeListId)) return true;
              // 检查子标签
              const subTags = todoTags.filter(
                (ot) => ot.parentId === activeListId,
              );
              return subTags.some((st) => t.tags?.includes(st.id));
            });
            break;
        }
      }

      // 去重
      resultTasks = Array.from(
        new Map(resultTasks.map((o: Todo) => [o.id, o])).values(),
      );

      return resultTasks;
    },

    // API加载数据方法
    loadData: async () => {
      try {
        // 在非组件环境中，使用getState()获取authStore的状态
        const authState = useAuthStore.getState();
        const userId = authState.userId;

        if (!userId) {
          throw new Error("用户未登录");
        }

        console.log("正在加载数据...");

        // 并行加载所有数据
        const [todoLists, todos, tags, groups, bin] = await Promise.all([
          getAllTodoLists(),
          getAllTodos(),
          getAllTags(),
          getAllGroups(),
          getBinItems(),
        ]);

        console.log("数据加载成功:", {
          todoLists: todoLists.length,
          todos: todos.length,
          tags: tags.length,
          groups: groups.length,
          bin: bin.length,
        });
        console.log(tags);
        set({
          todoListData: todoLists,
          tasks: todos,
          todoTags: tags,
          groups: groups,
          bin: bin,
          // 设置第一个列表为激活状态
          activeListId: todoLists.length > 0 ? todoLists[0].id : "",
        });
      } catch (error) {
        console.error("加载待办数据失败:", error);
        // 在API调用失败时，可以加载一些模拟数据作为fallback
        set({
          todoListData: [
            {
              id: "fallback_list",
              title: "我的待办事项",
              userId: "fallback_user",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          tasks: [
            {
              id: "fallback_task_1",
              title: "学习 React",
              completed: false,
              priority: 2,
              deadline: "2025-09-22",
              parentId: null,
              depth: 0,
              tags: [],
              listId: "fallback_list",
              userId: "fallback_user",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: "fallback_task_2",
              title: "完成项目文档",
              completed: false,
              priority: 1,
              deadline: "2025-09-18",
              parentId: null,
              depth: 0,
              tags: [],
              listId: "fallback_list",
              userId: "fallback_user",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          todoTags: [],
          groups: [],
          activeListId: "fallback_list",
        });
      }
    },
  }),
  // );
);

// 辅助hook - 获取当前选中的任务
export const useSelectTodo = (): Todo | null => {
  return useTodoStore((state) => {
    // 安全检查 - 确保state和相关属性存在
    if (!state || !state.selectTodoId || !state.tasks) {
      return null;
    }

    // 直接在独立的tasks数组中查找
    return state.tasks.find((t: Todo) => t.id === state.selectTodoId) || null;
  });
};

// 辅助hook - 获取回收站中的所有任务
export const useBinTodos = (): Todo[] => {
  const getBinTodos = useTodoStore((state) => state.getBinTodos);
  return getBinTodos();
};

// 辅助hook - 获取当前激活的列表数据
export const getActiveListData = (): TodoListData => {
  return useTodoStore.getState().getActiveListData();
};

// 辅助函数 - 获取当前激活列表的任务
export const getActiveListTasks = (): Todo[] => {
  return useTodoStore.getState().getActiveListTasks();
};
