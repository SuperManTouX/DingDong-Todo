import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TodoListData, Todo, Tag, TodoActionExtended } from "@/types";
import type { TagReducerAction } from "@/utils/tagReducer";
import todoListGroup from "../data/todoListGroup.json";
import todoTag from "../data/todoTags.json";
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

  // 计算属性 - 这些属性在持久化时会被忽略
  activeGroup: TodoListData;
  selectTodo: Todo | null;

  // Actions - 处理状态更新的方法
  dispatchTodo: (action: TodoActionExtended) => void;
  dispatchTag: (action: TagReducerAction) => void;
  setActiveGroupId: (id: string) => void;
  setSelectTodoId: (id: string | null) => void;

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
        set((state) => {
          const newState = { ...state };
          const draft = [...state.todoListGroups];

          switch (action.type) {
            case "completedAll": {
              const {
                completeOrUncomplete,
                showType = ShowType.all,
                groupId,
              } = action;
              const targetGroup = draft.find((group) => group.id === groupId);

              if (!targetGroup) return state;

              switch (showType) {
                case ShowType.all:
                  targetGroup.tasks.forEach((t) => {
                    t.completed = completeOrUncomplete;
                  });
                  break;
                case ShowType.completed:
                  targetGroup.tasks.forEach((t) => {
                    if (t.completed) {
                      t.completed = completeOrUncomplete;
                    }
                  });
                  break;
                case ShowType.uncompleted:
                  targetGroup.tasks.forEach((t) => {
                    if (!t.completed) {
                      t.completed = completeOrUncomplete;
                    }
                  });
                  break;
                case ShowType.overdue:
                  targetGroup.tasks.forEach((t) => {
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
              const targetGroup = draft.find((group) => group.id === groupId);

              if (!targetGroup) return state;

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
              const targetGroup = draft.find((group) => group.id === groupId);

              if (!targetGroup) return state;

              targetGroup.tasks = targetGroup.tasks.filter(
                (d) => d.id !== deleteId,
              );
              targetGroup.updatedAt = dayjs().format();
              break;
            }

            case "deletedAll": {
              const { groupId } = action;
              const targetGroup = draft.find((group) => group.id === groupId);

              if (!targetGroup) return state;

              targetGroup.tasks = targetGroup.tasks.filter((d) => !d.completed);
              targetGroup.updatedAt = dayjs().format();
              break;
            }

            case "added": {
              const { title, completed, parentId, depth, groupId } = action;
              const targetGroup = draft.find((group) => group.id === groupId);

              if (!targetGroup) return state;

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
              const targetGroup = draft.find(
                (group) => group.id === todo.groupId,
              );
              if (!targetGroup) return state;
              const i = targetGroup.tasks.findIndex((d) => d.id === todo.id);
              targetGroup.tasks[i] = todo;
              targetGroup.updatedAt = dayjs().format();
              break;
            }

            case "replaced": {
              const { todoList, groupId } = action;
              const targetGroup = draft.find((group) => group.id === groupId);

              if (!targetGroup) return state;

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
              const index = draft.findIndex((group) => group.id === groupId);

              if (index !== -1) {
                draft.splice(index, 1);
              }
              break;
            }
            // case "updateListGroup": {
            //   const { groupId, title, emoji, color } = action;
            //   const targetGroup = draft.find((group) => group.id === groupId);
            //
            //   if (!targetGroup) return state;
            //
            //   if (title) targetGroup.title = title;
            //   if (emoji !== undefined) targetGroup.emoji = emoji;
            //   if (color !== "") targetGroup.color = color;
            //
            //   targetGroup.updatedAt = dayjs().format();
            //   break;
            // }
            // case "addTagToTodo": {
            //   const { todoId, tagId, groupId } = action;
            //   const targetGroup = draft.find((group) => group.id === groupId);
            //
            //   if (!targetGroup) return state;
            //
            //   const todo = targetGroup.tasks.find((t) => t.id === todoId);
            //   if (todo) {
            //     if (!todo.tags) todo.tags = [];
            //     if (!todo.tags.includes(tagId)) {
            //       todo.tags.push(tagId);
            //     }
            //     targetGroup.updatedAt = dayjs().format();
            //   }
            //   break;
            // }
            //
            // case "removeTagFromTodo": {
            //   const { todoId, tagId, groupId } = action;
            //   const targetGroup = draft.find((group) => group.id === groupId);
            //
            //   if (!targetGroup) return state;
            //
            //   const todo = targetGroup.tasks.find((t) => t.id === todoId);
            //   if (todo && todo.tags) {
            //     todo.tags = todo.tags.filter((id) => id !== tagId);
            //     targetGroup.updatedAt = dayjs().format();
            //   }
            //   break;
            // }
            //
            // case "updateTodoTags": {
            //   const { todoId, tags, groupId } = action;
            //   const targetGroup = draft.find((group) => group.id === groupId);
            //
            //   if (!targetGroup) return state;
            //
            //   const todo = targetGroup.tasks.find((t) => t.id === todoId);
            //   if (todo) {
            //     todo.tags = tags || [];
            //     targetGroup.updatedAt = dayjs().format();
            //   }
            //   break;
            // }
          }

          return {
            ...newState,
            todoListGroups: draft,
          };
        });
      },

      // 处理标签相关的action
      dispatchTag: (action: TagReducerAction) => {
        set((state) => {
          const newState = { ...state };
          let draft = [...state.todoTags];

          switch (action.type) {
            case "initializeTags":
              draft = action.payload || [...todoTag];
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
              const tagIndex = draft.findIndex((tag) => tag.id === id);
              if (tagIndex !== -1) {
                draft[tagIndex] = { ...draft[tagIndex], ...updates };
              }
              break;
            }

            case "deleteTag": {
              const tagId = action.payload;
              // 不允许删除有子标签的标签
              const hasChildTags = draft.some((tag) => tag.parentId === tagId);
              if (hasChildTags) {
                console.warn("Cannot delete a tag with child tags");
                return state;
              }
              draft = draft.filter((tag) => tag.id !== tagId);
              break;
            }
          }

          return {
            ...newState,
            todoTags: draft,
          };
        });
      },

      // 设置当前激活的任务组ID
      setActiveGroupId: (id: string) => {
        set({ activeGroupId: id });
      },

      // 设置当前选中的任务ID
      setSelectTodoId: (id: string | null) => {
        set({ selectTodoId: id });
      },

      // 根据ID获取任务
      getTodoById: (id: string) => {
        const state = get();
        for (const group of state.todoListGroups) {
          const todo = group.tasks.find((t) => t.id === id);
          if (todo) return todo;
        }
        return null;
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
    }),
    {
      name: "todo-storage", // localStorage的键名
      partialize: (state) => ({
        todoListGroups: state.todoListGroups,
        todoTags: state.todoTags,
        activeGroupId: state.activeGroupId,
      }),
    },
  ),
);

// 辅助hooks - 获取当前激活的任务组
// 这确保了即使在store外部也能正确计算activeGroup

// 直接使用Zustand的原生API实现，不依赖auto-zustand-selectors-hooks

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
    
    let ag = state.todoListGroups.find((item) => item.id === state.activeGroupId) || filterData;

    if (ag.tasks.length > 0) return ag;

    // 格式化清单名
    const formatGroupName = (): string => {
      switch (state.activeGroupId) {
        case "aa":
          return "今天";
        case "bb":
          return "最近七天";
        default:
          return state.todoTags?.find((t) => t.id === state.activeGroupId)?.name || "";
      }
    };

    // 给title重新命名
    if (filterData.title === "") {
      filterData.title = formatGroupName();
    }

    // 将符合条件的todo推入filterData
    state.todoListGroups.forEach((tg) => {
      tg.tasks.forEach((t) => {
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

          // 标签数组
          default:
            t.tags?.forEach((ttId) => {
              if (state.activeGroupId === ttId) filterData.tasks.push(t);
            });

            const subTags = state.todoTags.filter(
              (ot) => state.activeGroupId === ot.parentId,
            );
            subTags.forEach((tt) => {
              t.tags?.forEach((ttId) => {
                if (tt.id === ttId) filterData.tasks.push(t);
              });
            });
        }
      });
    });

    // 去重
    filterData.tasks = Array.from(
      new Map(filterData.tasks.map((o) => [o.id, o])).values(),
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
      const todo = group.tasks.find((t) => t.id === state.selectTodoId);
      if (todo) return todo;
    }
    return null;
  });
};
