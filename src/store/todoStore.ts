import { create } from "zustand";
import { persist } from "zustand/middleware";
import { produce } from "immer";
import type { TodoListData, Todo, Tag, TodoActionExtended } from "@/types";
import type { TagReducerAction } from "@/types";
import todoListGroup from "../data/todoListGroup.json";
import todoTag from "../data/todoTags.json";
import binData from "../Layout/bin.json";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import { Priority, ShowType } from "@/constants";

// 完整的状态类型定义
interface TodoState {
  // 核心数据 - 持久化存储
  todoListGroups: TodoListData[];
  todoTags: Tag[];
  activeGroupId: string;
  selectTodoId: string | null;
  bin: Todo[]; // 回收站数据

  // 计算属性 - 这些属性在持久化时会被忽略
  activeGroup: TodoListData;
  selectTodo: Todo | null;

  // Actions - 处理状态更新的方法
  dispatchTodo: (action: TodoActionExtended) => void;
  dispatchTag: (action: TagReducerAction) => void;
  setActiveGroupId: (id: string) => void;
  setSelectTodoId: (id: string | null) => void;

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
  persist(
    (set, get) => ({
      // 初始化状态
      todoListGroups: todoListGroup as TodoListData[],
      todoTags: todoTag as Tag[],
      activeGroupId: "a",
      selectTodoId: null,
      bin: binData as Todo[], // 初始化回收站数据

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
          produce((draftState) => {
            const draft = draftState.todoListGroups;

            switch (action.type) {
              case "completedAll": {
                const {
                  completeOrUncomplete,
                  showType = ShowType.all,
                  groupId,
                } = action;
                const targetGroup = draft.find(
                  (group: TodoListData) => group.id === groupId,
                );

                if (!targetGroup) return;

                switch (showType) {
                  case ShowType.all:
                    targetGroup.tasks.forEach((t: Todo) => {
                      t.completed = completeOrUncomplete;
                    });
                    break;
                  case ShowType.completed:
                    targetGroup.tasks.forEach((t: Todo) => {
                      if (t.completed) {
                        t.completed = completeOrUncomplete;
                      }
                    });
                    break;
                  case ShowType.uncompleted:
                    targetGroup.tasks.forEach((t: Todo) => {
                      if (!t.completed) {
                        t.completed = completeOrUncomplete;
                      }
                    });
                    break;
                  case ShowType.overdue:
                    targetGroup.tasks.forEach((t: Todo) => {
                      const isOverdue =
                        t.deadline &&
                        new Date(t.deadline) < new Date() &&
                        !t.completed;
                      if (isOverdue) {
                        t.completed = completeOrUncomplete;
                      }
                    });
                    break;
                }
                targetGroup.updatedAt = dayjs().format();
                break;
              }

              case "toggle": {
                const { todoId, newCompleted, groupId } = action;
                const targetGroup: TodoListData = draft.find(
                  (group: TodoListData) => group.id === groupId,
                );
                if (!targetGroup) return;

                const todo = targetGroup.tasks.find((t) => t.id === todoId);
                if (todo) {
                  todo.completed = newCompleted;

                  // 同步子任务状态
                  const updateChildTasks = (
                    parentId: string,
                    newCompleted: boolean,
                  ) => {
                    const children = targetGroup.tasks.filter(
                      (t) => t.parentId === parentId,
                    );
                    children.forEach((child) => {
                      child.completed = newCompleted;
                      updateChildTasks(child.id, newCompleted);
                    });
                  };

                  // 查找并更新所有子任务
                  const childTasks = targetGroup.tasks.filter(
                    (t) => t.parentId === todo.id,
                  );
                  if (childTasks.length > 0) {
                    updateChildTasks(todo.id, newCompleted);
                  }

                  // 检查父任务状态
                  if (todo.parentId) {
                    const parentTodo = targetGroup.tasks.find(
                      (t) => t.id === todo.parentId,
                    );
                    if (parentTodo) {
                      const allChildTasks = targetGroup.tasks.filter(
                        (t) => t.parentId === parentTodo.id,
                      );
                      const allChildrenCompleted = allChildTasks.every(
                        (t) => t.completed,
                      );
                      parentTodo.completed = allChildrenCompleted;
                    }
                  }
                }
                targetGroup.updatedAt = dayjs().format();
                break;
              }

              case "deleted": {
                const { deleteId, groupId } = action;
                const targetGroup: TodoListData = draft.find(
                  (group: TodoListData) => group.id === groupId,
                );

                if (!targetGroup) return;

                targetGroup.tasks = targetGroup.tasks.filter(
                  (d) => d.id !== deleteId,
                );
                targetGroup.updatedAt = dayjs().format();
                break;
              }

              case "deletedAll": {
                const { groupId } = action;
                const targetGroup: TodoListData = draft.find(
                  (group: TodoListData) => group.id === groupId,
                );

                if (!targetGroup) return;

                targetGroup.tasks = targetGroup.tasks.filter(
                  (d) => !d.completed,
                );
                targetGroup.updatedAt = dayjs().format();
                break;
              }

              case "added": {
                const { title, completed, parentId, depth, groupId } = action;
                const targetGroup = draft.find(
                  (group: TodoListData) => group.id === groupId,
                );

                if (!targetGroup) return;

                targetGroup.tasks.push({
                  id: uuidv4(),
                  title: title,
                  groupId: groupId,
                  completed: completed,
                  priority: Priority.None,
                  parentId: parentId || null,
                  depth: depth || 0,
                });
                targetGroup.updatedAt = dayjs().format();
                break;
              }

              case "changed": {
                const { todo } = action;
                const targetGroup: TodoListData = draft.find(
                  (group: TodoListData) => group.id === todo.groupId,
                );
                if (!targetGroup) return;
                const i = targetGroup.tasks.findIndex((d) => d.id === todo.id);
                targetGroup.tasks[i] = todo;
                targetGroup.updatedAt = dayjs().format();
                console.log(todo);
                break;
              }

              case "replaced": {
                const { todoList, groupId } = action;
                const targetGroup: TodoListData = draft.find(
                  (group: TodoListData) => group.id === groupId,
                );

                if (!targetGroup) return;

                targetGroup.tasks = todoList;
                targetGroup.updatedAt = dayjs().format();
                break;
              }

              case "addListGroup": {
                const { title, initialTasks = [], emoji, color } = action;
                const now = dayjs().format();

                draft.push({
                  id: `group_${Date.now()}`,
                  title,
                  emoji,
                  color,
                  createdAt: now,
                  updatedAt: now,
                  tasks: initialTasks,
                });
                break;
              }

              case "deleteListGroup": {
                const { groupId } = action;
                const index = draft.findIndex(
                  (group: TodoListData) => group.id === groupId,
                );

                if (index !== -1) {
                  draft.splice(index, 1);
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
          produce((draftState) => {
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
                break;
              }
            }
          }),
        );
      },

      // 设置当前激活的任务组ID
      setActiveGroupId: (id: string) => {
        set({ activeGroupId: id });
      },

      // 设置当前选中的任务ID
      setSelectTodoId: (id: string | null) => {
        set({ selectTodoId: id });
      },

      // 辅助方法 - 用于查询和获取特定数据
      getTodoById: (id: string) => {
        const state = get();
        // 首先在正常任务中查找
        for (const group of state.todoListGroups) {
          const todo = group.tasks.find((t) => t.id === id);
          if (todo) return todo;
        }
        // 如果在正常任务中找不到，在回收站中查找
        return state.bin.find((t) => t.id === id) || null;
      },

      // 根据任务ID获取所属的任务组
      getGroupByTodoId: (todoId: string) => {
        const state = get();
        for (const group of state.todoListGroups) {
          if (group.tasks.some((t) => t.id === todoId)) {
            return group;
          }
        }
        return null;
      },

      // 将任务移动到回收站
      moveToBin: (todo: Todo) => {
        set(
          produce((draftState) => {
            // 从原任务组中移除任务
            const groupIndex = draftState.todoListGroups.findIndex(
              (group: TodoListData) => group.id === todo.groupId,
            );
            if (groupIndex !== -1) {
              const taskIndex = draftState.todoListGroups[
                groupIndex
              ].tasks.findIndex((task: Todo) => task.id === todo.id);
              if (taskIndex !== -1) {
                draftState.todoListGroups[groupIndex].tasks.splice(
                  taskIndex,
                  1,
                );
                draftState.todoListGroups[groupIndex].updatedAt =
                  dayjs().format();
              }
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
          produce((draftState) => {
            const binItemIndex = draftState.bin.findIndex(
              (item: Todo & { deletedAt: string }) => item.id === todoId,
            );

            if (binItemIndex === -1) return;

            const todoToRestore = draftState.bin[binItemIndex];

            // 从回收站移除
            draftState.bin.splice(binItemIndex, 1);

            // 恢复到原任务组
            const groupIndex = draftState.todoListGroups.findIndex(
              (group: TodoListData) => group.id === todoToRestore.groupId,
            );
            if (groupIndex !== -1) {
              // 删除deletedAt属性
              const { deletedAt, ...restoredTodo } = todoToRestore;
              draftState.todoListGroups[groupIndex].tasks.push(restoredTodo);
              draftState.todoListGroups[groupIndex].updatedAt =
                dayjs().format();
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
          (
            a: Todo & { deletedAt: string },
            b: Todo & { deletedAt: string },
          ) => {
            const dateA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
            const dateB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
            return dateB - dateA;
          },
        );
      },
    }),
    // {
    //   name: "todo-storage", // localStorage的键名
    //   partialize: (state) => ({
    //     todoListGroups: state.todoListGroups,
    //     todoTags: state.todoTags,
    //     activeGroupId: state.activeGroupId,
    //     bin: state.bin,
    //   }),
    // },
  ),
);

// 辅助hooks - 获取当前激活的任务组
// 这确保了即使在store外部也能正确计算activeGroup

export const useActiveGroup = (): TodoListData => {
  const filterData: TodoListData = {
    createdAt: "",
    id: "",
    tasks: [],
    title: "",
    updatedAt: "",
  };

  return useTodoStore((state) => {
    // 安全检查 - 确保state和相关属性存在
    if (!state || !state.todoListGroups || !state.activeGroupId) {
      return filterData;
    }

    let ag =
      state.todoListGroups.find(
        (item: TodoListData) => item.id === state.activeGroupId,
      ) || filterData;

    if (ag.tasks.length > 0) return ag;

    // 格式化清单名
    const formatGroupName = (): string => {
      switch (state.activeGroupId) {
        case "aa":
          return "今天";
        case "bb":
          return "最近七天";
        case "bin":
          return "回收站";
        case "cp":
          return "已完成";
        default:
          return (
            state.todoTags?.find((t: Tag) => t.id === state.activeGroupId)
              ?.name || ""
          );
      }
    };

    // 给title重新命名
    if (filterData.title === "") {
      filterData.title = formatGroupName();
    }

    // 将符合条件的todo推入filterData
    state.todoListGroups.forEach((tg: TodoListData) => {
      tg.tasks.forEach((t: Todo) => {
        switch (state.activeGroupId) {
          // 今天
          case "aa":
            if (t.deadline && dayjs(t.deadline).isSame(dayjs(), "day"))
              filterData.tasks.push(t);
            return;

          // 最近七天
          case "bb":
            if (
              t.deadline &&
              dayjs(t.deadline).isAfter(dayjs().subtract(7, "day")) &&
              dayjs(t.deadline).isBefore(dayjs().add(7, "day"))
            )
              filterData.tasks.push(t);
            return;
          //   回收站
          case "bin":
            if (filterData.tasks.length > 0) return;
            state.bin.forEach((t) => {
              filterData.tasks.push(t);
            });
            return;
          //   已完成
          case "cp":
            if (t.completed) filterData.tasks.push(t);
            return;

          // 标签数组
          default:
            t.tags?.forEach((ttId: string) => {
              if (state.activeGroupId === ttId) filterData.tasks.push(t);
            });

            const subTags = state.todoTags.filter(
              (ot: Tag) => state.activeGroupId === ot.parentId,
            );
            subTags.forEach((tt: Tag) => {
              t.tags?.forEach((ttId: string) => {
                if (tt.id === ttId) filterData.tasks.push(t);
              });
            });
        }
      });
    });

    // 去重
    filterData.tasks = Array.from(
      new Map(filterData.tasks.map((o: Todo) => [o.id, o])).values(),
    );

    return filterData;
  });
};

// 辅助hook - 获取当前选中的任务
export const useSelectTodo = (): Todo | null => {
  return useTodoStore((state) => {
    // 安全检查 - 确保state和相关属性存在
    if (!state || !state.selectTodoId || !state.todoListGroups) {
      return null;
    }

    for (const group of state.todoListGroups) {
      const todo = group.tasks.find((t: Todo) => t.id === state.selectTodoId);
      if (todo) return todo;
    }
    return null;
  });
};

// 辅助hook - 获取回收站中的所有任务
export const useBinTodos = (): Todo[] => {
  const getBinTodos = useTodoStore((state) => state.getBinTodos);
  return getBinTodos();
};
