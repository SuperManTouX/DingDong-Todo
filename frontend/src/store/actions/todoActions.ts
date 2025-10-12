import { produce } from "immer";
import { Priority } from "@/constants";
import { useAuthStore } from "@/store/authStore";
import {
  createTodo,
  updateTodo,
  deleteTodo,
  moveTaskToGroup,
  moveTaskToList,
  toggleTaskCompleted,
} from "@/services/todoService";
import type { SSEUpdateData, TodoActionExtended } from "@/types";
import type { TodoState } from "../types";
import type { Todo } from "@/types";
import { message } from "@/utils/antdStatic";
import { MESSAGES } from "@/constants/messages";
// 需要同步到子项的字段
const SYNC_FIELDS: (keyof Todo)[] = [
  "listId",
  "groupId",
  "tags",
  "completed",
  "isPinned",
];

// 创建一个简单的事件系统用于通知表格刷新
export const tableEvents = {
  listeners: new Set<() => void>(),

  notify() {
    this.listeners.forEach((callback) => callback());
  },
};

export const todoActions = {
  /**
   * 处理任务相关的异步API请求
   */
  dispatchTodo: async (
    action: TodoActionExtended,
    set: any,
    get: () => TodoState,
  ): Promise<void> => {
    const authState = useAuthStore.getState();
    const { userId } = authState;
    if (!userId) return;

    try {
      // 2. 然后异步发送API请求
      switch (action.type) {
        case "added":
          {
            try {
              await createTodo(action.newTask);
              message.success("添加新待办事项，成功！");
            } catch (error) {
              console.error("创建任务API调用失败:", error);
              throw error;
            }
          }
          break;
        // 处理任务完成状态变化的专门分支
        case "completedChange": {
          if (action.todoId && typeof action.completed === "boolean") {
            // 使用专门的toggleTaskCompleted方法
            await toggleTaskCompleted(action.todoId, action.completed).catch(
              (error) => {
                console.error(
                  `切换任务完成状态API调用失败 (ID: ${action.todoId}):`,
                  error,
                );
                throw error;
              },
            );
          }
          break;
        }
        case "changed": {
          if (action.todo.id) {
            // 发送API请求，但不等待响应
            await updateTodo(action.todo.id, {
              ...action.todo,
              userId,
            })
              .then(() => {
                // 无需WebSocket通知，使用SSE代替
              })
              .catch((error) => {
                console.error(
                  `更新任务API调用失败 (ID: ${action.todo.id}):`,
                  error,
                );
                // API失败后，可以选择回滚本地状态
                // 这里暂时不回滚，让用户可以重试
                throw error;
              });
          }
          break;
        }
        case "deleted": {
          if (action.deleteId) {
            // 发送API请求，但不等待响应
            deleteTodo(action.deleteId)
              .then(() => {
                // 无需WebSocket通知，使用SSE代替
              })
              .catch((error) => {
                console.error(
                  `删除任务API调用失败 (ID: ${action.deleteId}):`,
                  error,
                );
                // API失败后，可以选择回滚本地状态
                // 这里暂时不回滚，让用户可以重试
                throw error;
              });
          }
          break;
        }
        case "completedAll": {
          // 异步更新每个任务
          const tasksToUpdate = get().tasks.filter(
            (task: any) => task.listId === action.listId,
          );
          await Promise.all(
            tasksToUpdate.map((task: any) =>
              updateTodo(task.id, {
                ...task,
                completed: action.completeOrUncomplete,
                userId,
              }).catch((error) => {
                console.error(
                  `批量完成任务API调用失败 (ID: ${task.id}):`,
                  error,
                );
                return null; // 继续处理其他任务
              }),
            ),
          );
          break;
        }
        case "deletedAll": {
          if (action.todoList && action.listId) {
            // 获取所有已完成的任务
            const completedTasks = action.todoList.filter(
              (task: any) => task.completed && task.listId === action.listId,
            );

            // 异步删除每个任务
            await Promise.all(
              completedTasks.map((task: any) =>
                deleteTodo(task.id).catch((error) => {
                  console.error(
                    `批量删除任务API调用失败 (ID: ${task.id}):`,
                    error,
                  );
                  return null; // 继续处理其他任务
                }),
              ),
            );
          }
          break;
        }
        case "moveToGroup": {
          if (action.todoId && action.groupId !== undefined) {
            // 发送API请求 - 后端会通过SSE发送update_with_children事件处理子任务
            await moveTaskToGroup(action.todoId, action.groupId, action.listId)
              .then(() => {})
              .catch((error) => {
                console.error(
                  `移动任务到分组API调用失败 (ID: ${action.todoId}):`,
                  error,
                );
                throw error;
              });
          }
          break;
        }
        case "moveToList": {
          if (action.todoId && action.listId) {
            // 发送API请求 - 后端会通过SSE发送update_with_children事件处理子任务
            await moveTaskToList(action.todoId, action.listId)
              .then(() => {
                message.success(MESSAGES.SUCCESS.TASK_MOVE);
                // 无需WebSocket通知，使用SSE代替
              })
              .catch((error) => {
                console.error(
                  `移动任务到清单API调用失败 (ID: ${action.todoId}):`,
                  error,
                );
                throw error;
              });
          }
          break;
        }
      }
    } catch (error) {
      console.error(`任务操作失败 (${action.type}):`, error);
      // 可以在这里添加用户友好的错误提示
      throw error; // 重新抛出错误以便调用者可以处理
    }
  },

  /**
   * 在 Immer produce 回调中直接修改 draftState.tasks
   * 支持父节点更新并递归同步指定字段到所有子孙节点
   */
  handleTreeTasksUpdate: (sseUpdateData: SSEUpdateData, set: any) => {
    set(
      produce((draftState: TodoState) => {
        const { action, parent, childrenChanges } = sseUpdateData;
        console.log(action, parent, childrenChanges);
        if (action !== "update_tree_node_with_children") return;
        const {
          add = [],
          update = [],
          delete: deleteList = [],
        } = childrenChanges || {};

        // 1. 更新父节点 & 递归同步到所有子孙节点
        if (parent?.id) {
          const parentNode = draftState.tasks.find((t) => t.id === parent.id);
          if (parentNode) {
            // 更新父节点自身
            Object.assign(parentNode, parent);
            /**
             * 递归查找所有子孙任务ID
             */
            function findAllDescendantIds(
              tasks: Todo[],
              parentId: string,
            ): string[] {
              const descendants = [];
              const directChildren = tasks.filter(
                (t) => t.parentId === parentId,
              );

              for (const child of directChildren) {
                descendants.push(child.id);
                // 递归查找子任务的子任务
                descendants.push(...findAllDescendantIds(tasks, child.id));
              }

              return descendants;
            }

            // 找到所有子孙节点ID
            const descendantIds = findAllDescendantIds(
              draftState.tasks,
              parent.id,
            );

            // 同步字段到所有子孙节点
            descendantIds.forEach((id) => {
              const task = draftState.tasks.find((t) => t.id === id);
              if (task) {
                SYNC_FIELDS.forEach((field) => {
                  if (parent[field] !== undefined) {
                    task[field] = parent[field] as any;
                  }
                });
              }
            });
          }
        }

        // 2. 新增节点
        if (add.length) {
          draftState.tasks.push(...add);
        }

        // 3. 更新节点
        if (update.length) {
          update.forEach((updated) => {
            const target = draftState.tasks.find((t) => t.id === updated.id);
            if (target) {
              Object.assign(target, updated);
            }
          });
        }

        // 4. 删除节点
        if (deleteList.length) {
          const deleteIds = new Set(deleteList.map((d) => d.id));
          let newIndex = 0;
          for (let i = 0; i < draftState.tasks.length; i++) {
            const task = draftState.tasks[i];
            if (!deleteIds.has(task.id)) {
              draftState.tasks[newIndex] = task;
              newIndex++;
            }
          }
          draftState.tasks.length = newIndex;
        }
      }),
    );
  },
  // 交换两个任务在数组中的位置
  swapTasksPositions: (
    draggedTask: Todo,
    targetTask: Todo,
    set: any,
    get: () => TodoState,
  ): void => {
    set(
      produce((draftState: TodoState) => {
        // 查找两个任务在tasks数组中的索引
        const draggedIndex = draftState.tasks.findIndex(
          (task) => task.id === draggedTask.id,
        );
        const targetIndex = draftState.tasks.findIndex(
          (task) => task.id === targetTask.id,
        );

        // 确保两个任务都存在于数组中
        if (draggedIndex !== -1 && targetIndex !== -1) {
          // 交换任务位置
          const temp = draftState.tasks[draggedIndex];
          draftState.tasks[draggedIndex] = draftState.tasks[targetIndex];
          draftState.tasks[targetIndex] = temp;

          console.log(
            `已成功交换任务位置: draggedTask (${draggedTask.id}) 与 targetTask (${targetTask.id})`,
          );
        } else {
          console.error("交换任务失败: 未找到指定的任务");
        }
      }),
    );
  },

  // 本地更新todo的方法 - 只更新本地状态，不发送API请求
  // 用于拖拽等频繁操作场景，提高性能和用户体验
  updateTodoLocally: (todo: Todo, set: any, get: () => TodoState): void => {
    // 直接更新本地状态，不发送API请求
    set(
      produce((draftState: TodoState) => {
        const todoIndex = draftState.tasks.findIndex(
          (task) => task.id === todo.id,
        );
        if (todoIndex !== -1) {
          // 更新任务信息，但保留createdAt和updatedAt等自动生成的字段
          const existingTask = draftState.tasks[todoIndex];
          draftState.tasks[todoIndex] = {
            ...existingTask,
            ...todo,
            // 不覆盖系统字段
            createdAt: existingTask.createdAt,
            updatedAt: existingTask.updatedAt,
          };
        }
      }),
    );
  },
};
