import { create } from "zustand";
import { produce } from "immer";
import type { TodoListData, Todo, Tag, TodoActionExtended } from "@/types";
import type { TagReducerAction, ListGroupAction } from "@/types";
import type { Group } from "@/types/group";
import todoListData from "../data/TodoListData.json";
import todoTag from "../data/todoTags.json";
import binData from "../data/bin.json";
import allTasks from "../data/AllTasks.json";
import groupData from "../data/GroupData.json";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import { Priority, ShowType } from "@/constants";

// 完整的状态类型定义
interface TodoState {
  // 核心数据 - 持久化存储
  todoListData: TodoListData[];
  todoTags: Tag[];
  activeListId: string;
  selectTodoId: string | null;
  bin: Todo[]; // 回收站数据
  tasks: Todo[]; // 新增：独立的任务数组
  groups: Group[]; // 新增：全局分组数组

  // 计算属性 - 这些属性在持久化时会被忽略
  activeGroup: TodoListData;
  selectTodo: Todo | null;

  // 处理todo相关的action
  dispatchTodo: (action: TodoActionExtended) => void;
  dispatchList: (action: ListGroupAction) => void;
  dispatchTag: (action: TagReducerAction) => void;
  setActiveListId: (id: string) => void;
  setSelectTodoId: (id: string | null) => void;

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
}

export const useTodoStore = create<TodoState>()(
  // 需要本地化再解开
  // persist(
  (set, get) => ({
    // 初始化状态
    todoListData: todoListData,
    todoTags: todoTag as Tag[],
    activeListId: "a",
    selectTodoId: null,
    bin: binData as Todo[], // 初始化回收站数据
    // 从独立的AllTasks.json文件导入所有任务
    tasks: allTasks as Todo[],
    // 初始化分组数组为空
    groups: groupData,

    // 计算属性 - 当前激活的任务组
    activeGroup: {
      id: "",
      title: "",
      tasks: [],
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
              const {
                completeOrUncomplete,
                showType = ShowType.all,
                listId,
              } = action;

              // 直接操作独立的tasks数组
              draftState.tasks = draftState.tasks.map((task: Todo) => {
                // 仅处理指定清单的任务
                if (task.listId !== listId) return task;

                // 根据showType决定是否更新
                let shouldUpdate = false;
                switch (showType) {
                  case ShowType.all:
                    shouldUpdate = true;
                    break;
                  case ShowType.completed:
                    shouldUpdate = task.completed;
                    break;
                  case ShowType.uncompleted:
                    shouldUpdate = !task.completed;
                    break;
                  case ShowType.overdue:
                    shouldUpdate =
                      task.deadline &&
                      new Date(task.deadline) < new Date() &&
                      !task.completed;
                    break;
                }

                if (shouldUpdate) {
                  return { ...task, completed: completeOrUncomplete };
                }
                return task;
              });

              // 更新清单的更新时间
              const targetList = draftState.todoListData.find(
                (list) => list.id === listId,
              );
              if (targetList) {
                targetList.updatedAt = dayjs().format();
              }
              break;
            }

            case "toggle": {
              const { todoId, newCompleted } = action;
              // 直接在tasks数组中查找并更新
              const todoIndex = draftState.tasks.findIndex(
                (t) => t.id === todoId,
              );

              if (todoIndex !== -1) {
                draftState.tasks[todoIndex].completed = newCompleted;

                // 同步子任务状态
                const updateChildTasks = (
                  parentId: string,
                  newCompleted: boolean,
                ) => {
                  draftState.tasks = draftState.tasks.map((task) => {
                    if (task.parentId === parentId) {
                      return { ...task, completed: newCompleted };
                    }
                    return task;
                  });
                };

                // 更新所有子任务
                updateChildTasks(todoId, newCompleted);

                // 检查并更新父任务状态
                const todo = draftState.tasks[todoIndex];
                if (todo.parentId) {
                  const parentTodo = draftState.tasks.find(
                    (t) => t.id === todo.parentId,
                  );
                  if (parentTodo) {
                    const allChildTasks = draftState.tasks.filter(
                      (t) => t.parentId === parentTodo.id,
                    );
                    const allChildrenCompleted = allChildTasks.every(
                      (t) => t.completed,
                    );

                    const parentIndex = draftState.tasks.findIndex(
                      (t) => t.id === parentTodo.id,
                    );
                    if (parentIndex !== -1) {
                      draftState.tasks[parentIndex].completed =
                        allChildrenCompleted;
                    }
                  }
                }

                // 更新清单的更新时间
                const targetList = draftState.todoListData.find(
                  (list) => list.id === todo.listId,
                );
                if (targetList) {
                  targetList.updatedAt = dayjs().format();
                }
              }
              break;
            }

            case "added": {
              const { title, completed, parentId, depth, listId } = action;

              // 直接添加到独立的tasks数组
              draftState.tasks.push({
                id: uuidv4(),
                title: title,
                listId: listId,
                completed: completed,
                priority: Priority.None,
                parentId: parentId || null,
                depth: depth || 0,
              });

              // 更新清单的更新时间
              const targetList = draftState.todoListData.find(
                (list) => list.id === listId,
              );
              if (targetList) {
                targetList.updatedAt = dayjs().format();
              }
              break;
            }

            case "changed": {
              const { todo } = action;
              // 直接在tasks数组中查找并替换
              const index = draftState.tasks.findIndex((d) => d.id === todo.id);
              if (index !== -1) {
                draftState.tasks[index] = todo;

                // 更新清单的更新时间
                const targetList = draftState.todoListData.find(
                  (list) => list.id === todo.listId,
                );
                if (targetList) {
                  targetList.updatedAt = dayjs().format();
                }
              }
              break;
            }

            case "deleted": {
              const { deleteId } = action;
              // 先找到要删除的任务，以获取其listId
              const todoToDelete = draftState.tasks.find(
                (t) => t.id === deleteId,
              );
              if (todoToDelete) {
                // 从tasks数组中删除任务及其所有子任务
                const deleteRecursively = (id: string) => {
                  draftState.tasks = draftState.tasks.filter((task) => {
                    if (task.id === id) return false;
                    if (task.parentId === id) {
                      // 递归删除子任务
                      deleteRecursively(task.id);
                      return false;
                    }
                    return true;
                  });
                };

                deleteRecursively(deleteId);

                // 更新清单的更新时间
                const targetList = draftState.todoListData.find(
                  (list) => list.id === todoToDelete.listId,
                );
                if (targetList) {
                  targetList.updatedAt = dayjs().format();
                }
              }
              break;
            }

            case "deletedAll": {
              const { listId } = action;
              // 过滤掉指定清单的已完成任务
              draftState.tasks = draftState.tasks.filter((task) => {
                if (task.listId === listId && task.completed) {
                  return false;
                }
                return true;
              });

              // 更新清单的更新时间
              const targetList = draftState.todoListData.find(
                (list) => list.id === listId,
              );
              if (targetList) {
                targetList.updatedAt = dayjs().format();
              }
              break;
            }

            case "replaced": {
              const { todoList, listId } = action;
              // 保留其他清单的任务，替换指定清单的任务
              draftState.tasks = draftState.tasks
                .filter((task) => task.listId !== listId)
                .concat(todoList);

              // 更新清单的更新时间
              const targetList = draftState.todoListData.find(
                (list) => list.id === listId,
              );
              if (targetList) {
                targetList.updatedAt = dayjs().format();
              }
              break;
            }
          }
        }),
      );
    },

    // 处理清单组相关的action
    dispatchList: (action: ListGroupAction) => {
      set(
        produce((draftState: TodoState) => {
          switch (action.type) {
            case "addListGroup": {
              const { title, emoji, color } = action;
              const now = dayjs().format();
              const listId = `group_${Date.now()}`;

              // 添加新清单
              draftState.todoListData.push({
                id: listId,
                title,
                emoji,
                color,
                createdAt: now,
                updatedAt: now,
              });
              break;
            }

            case "deleteListGroup": {
              const { listId } = action;
              // 删除清单
              const index = draftState.todoListData.findIndex(
                (list: TodoListData) => list.id === listId,
              );

              if (index !== -1) {
                draftState.todoListData.splice(index, 1);
                // 同时删除该清单下的所有任务
                draftState.tasks = draftState.tasks.filter(
                  (task) => task.listId !== listId,
                );
              }
              break;
            }

            case "updateListGroup": {
              const { listId, title, emoji, color } = action;
              const targetList = draftState.todoListData.find(
                (list) => list.id === listId,
              );
              if (targetList) {
                if (title !== undefined) targetList.title = title;
                if (emoji !== undefined) targetList.emoji = emoji;
                if (color !== undefined) targetList.color = color;
                targetList.updatedAt = dayjs().format();
              }
              break;
            }
          }
        }),
      );
    },

    // 处理标签相关的action
    dispatchTag: (action: TagReducerAction) => {
      set(
        produce((draftState: TodoState) => {
          const draft = draftState.todoTags;

          switch (action.type) {
            case "initializeTags":
              // 清空当前标签并添加新标签
              draft.splice(
                0,
                draft.length,
                ...(action.payload || [...todoTag]),
              );
              break;

            case "addTag": {
              const { payload } = action;
              // 生成标签ID的辅助函数
              const generateTagId = (existingTags: Tag[]): string => {
                const maxId = existingTags.reduce((max, tag) => {
                  const idNum = parseInt(tag.id);
                  return isNaN(idNum) ? max : Math.max(max, idNum);
                }, 0);
                return (maxId + 1).toString();
              };

              const newTag: Tag = {
                ...payload,
                id: payload.id || generateTagId(draft),
              };
              draft.push(newTag);
              break;
            }

            case "updateTag": {
              const { id, updates } = action.payload;
              const tagIndex = draft.findIndex((tag: Tag) => tag.id === id);
              if (tagIndex !== -1) {
                // 使用immer的方式直接更新
                Object.assign(draft[tagIndex], updates);
              }
              break;
            }

            case "deleteTag": {
              const tagId = action.payload;
              // 不允许删除有子标签的标签
              const hasChildTags: boolean = draft.some(
                (tag: Tag) => tag.parentId === tagId,
              );
              if (hasChildTags) {
                console.warn("Cannot delete a tag with child tags");
                return;
              }
              // 过滤掉要删除的标签
              const indexToDelete = draft.findIndex(
                (tag: Tag) => tag.id === tagId,
              );
              if (indexToDelete !== -1) {
                draft.splice(indexToDelete, 1);
              }

              // 从所有任务中移除该标签
              draftState.tasks.forEach((task: Todo) => {
                if (task.tags && task.tags.length > 0) {
                  // 过滤掉要删除的标签ID
                  task.tags = task.tags.filter((id: string) => id !== tagId);
                }
              });

              // 从回收站中的任务中也移除该标签
              draftState.bin.forEach((task: Todo) => {
                if (task.tags && task.tags.length > 0) {
                  // 过滤掉要删除的标签ID
                  task.tags = task.tags.filter((id: string) => id !== tagId);
                }
              });

              break;
            }
          }
        }),
      );
    },

    // 分组相关操作方法
    addGroup: (
      listId: string,
      groupName: string,
    ) => {
      set(
        produce((draftState: TodoState) => {
          // 检查是否已存在相同的分组名
          const existingGroupIndex = draftState.groups.findIndex(
            (group) => group.listId === listId && group.groupName === groupName,
          );

          if (existingGroupIndex === -1) {
            // 生成唯一id（使用listId和描述性字符串组合）
            const id = `${listId}_${groupName.toLowerCase().replace(/\s+/g, '_')}`;
            // 添加新分组
            draftState.groups.push({
              id,
              listId,
              groupName,
            });
          }
        }),
      );
    },

    updateGroup: (nGroup: Group) => {
      set(
        produce((draftState: TodoState) => {
          let n = draftState.groups.findIndex(
            (group) => group.id === nGroup.id,
          );
          console.log(draftState.groups[n]);
          draftState.groups[n] = nGroup;
        }),
      );
    },

    deleteGroup: (groupId: string) => {
      set(
        produce((draftState: TodoState) => {
          draftState.groups = draftState.groups.filter(
            (group) => group.id !== groupId
          );
        }),
      );
    },

    getGroupsByListId: (listId: string) => {
      const state = get();
      return state.groups.filter((group) => group.listId === listId);
    },

    // 设置当前激活的任务组ID
    setActiveListId: (id: string) => {
      set({ activeListId: id });
    },

    // 设置当前选中的任务ID
    setSelectTodoId: (id: string | null) => {
      set({ selectTodoId: id });
    },

    // 辅助方法 - 用于查询和获取特定数据
    getTodoById: (id: string) => {
      const state = get();
      // 直接在独立的tasks数组中查找
      const todo = state.tasks.find((t) => t.id === id);
      if (todo) return todo;
      // 如果在正常任务中找不到，在回收站中查找
      return state.bin.find((t) => t.id === id) || null;
    },

    // 根据任务ID获取所属的任务组
    getGroupByTodoId: (todoId: string) => {
      const state = get();
      // 先找到任务
      const todo = state.tasks.find((t) => t.id === todoId);
      if (todo) {
        // 再根据任务的listId找到所属清单
        return (
          state.todoListData.find((list) => list.id === todo.listId) || null
        );
      }
      return null;
    },

    // 将任务移动到回收站
    moveToBin: (todo: Todo) => {
      set(
        produce((draftState: TodoState) => {
          // 从独立的tasks数组中移除任务
          draftState.tasks = draftState.tasks.filter(
            (task) => task.id !== todo.id,
          );

          // 更新清单的更新时间
          const targetList = draftState.todoListData.find(
            (list) => list.id === todo.listId,
          );
          if (targetList) {
            targetList.updatedAt = dayjs().format();
          }

          // 将任务添加到回收站，并记录删除时间
          const deletedTodo = {
            ...todo,
            deletedAt: dayjs().format(),
          };
          draftState.bin.push(deletedTodo);
        }),
      );
    },

    // 从回收站恢复任务
    restoreFromBin: (todoId: string) => {
      set(
        produce((draftState: TodoState) => {
          const binItemIndex = draftState.bin.findIndex(
            (item: Todo & { deletedAt: string }) => item.id === todoId,
          );

          if (binItemIndex === -1) return;

          const todoToRestore = draftState.bin[binItemIndex];

          // 从回收站移除
          draftState.bin.splice(binItemIndex, 1);

          // 恢复到独立的tasks数组
          const { deletedAt, ...restoredTodo } = todoToRestore;
          draftState.tasks.push(restoredTodo);

          // 更新清单的更新时间
          const targetList = draftState.todoListData.find(
            (list) => list.id === todoToRestore.listId,
          );
          if (targetList) {
            targetList.updatedAt = dayjs().format();
          }
        }),
      );
    },

    // 从回收站删除单个任务
    deleteFromBin: (todoId: string) => {
      set(
        produce((draftState) => {
          const indexToDelete = draftState.bin.findIndex(
            (item: Todo & { deletedAt: string }) => item.id === todoId,
          );
          if (indexToDelete !== -1) {
            draftState.bin.splice(indexToDelete, 1);
          }
        }),
      );
    },

    // 清空回收站
    emptyBin: () => {
      set(
        produce((draftState) => {
          draftState.bin = [];
        }),
      );
    },

    // 获取回收站中的所有任务
    getBinTodos: () => {
      const state = get();
      // 按删除时间倒序排序（最近删除的在前）
      return [...state.bin].sort(
        (a: Todo & { deletedAt: string }, b: Todo & { deletedAt: string }) => {
          const dateA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
          const dateB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
          return dateB - dateA;
        },
      );
    },
  }),
  // 需要本地化再解开
  // {
  //   name: "todo-storage", // localStorage的键名
  //   partialize: (state) => ({
  //     todoListData: state.todoListData,
  //     todoTags: state.todoTags,
  //     activeListId: state.activeListId,
  //     bin: state.bin,
  //   }),
  // },
  // ),
);

// 使用todostore的get方法的版本
export const getActiveListData = (): TodoListData => {
  const defaultData: TodoListData = {
    createdAt: "",
    id: "",
    title: "",
    updatedAt: "",
  };

  // 获取store实例
  const store = useTodoStore.getState();
  const { activeListId, todoTags, todoListData } = store;

  // 安全检查 - 确保state和相关属性存在
  if (!activeListId) {
    return defaultData;
  }

  let title: string;
  switch (activeListId) {
    case "aa":
      title = "今天";
      break;
    case "bb":
      title = "最近七天";
      break;
    case "bin":
      title = "回收站";
      break;
    case "cp":
      title = "已完成";
      break;
    default:
      title = todoTags?.find((t: Tag) => t.id === activeListId)?.name || "";
  }

  // 确保todoListData存在
  if (!todoListData) {
    return defaultData;
  }

  // 如果是普通清单，返回清单信息
  if (
    activeListId !== "aa" &&
    activeListId !== "bb" &&
    activeListId !== "bin" &&
    activeListId !== "cp"
  ) {
    const list = todoListData.find((item) => item.id === activeListId);
    if (list) {
      return {
        ...list,
      };
    }
  }

  // 对于特殊视图和标签，返回格式化的清单信息
  return {
    ...defaultData,
    id: activeListId,
    title: title,
  };
};

// 使用todostore的get方法的版本
export const getActiveListTasks = (): Todo[] => {
  // 获取store实例
  const store = useTodoStore.getState();
  const { activeListId, tasks, bin, todoTags } = store;

  // 安全检查 - 确保state和相关属性存在
  if (!activeListId || !tasks) {
    return [];
  }

  // 初始化任务数组
  let resultTasks: Todo[] = [];
  // 如果是普通清单，返回清单关联的任务
  if (todoListData.some((l) => activeListId === l.id)) {
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
          const subTags = todoTags.filter((ot) => ot.parentId === activeListId);
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
};

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
