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
   * 根据action类型更新本地todo状态
   * 只更新本地状态，不发送API请求
   */
  updateTodoLocallyByAction: (
    action: TodoActionExtended,
    set: any,
    get: () => TodoState,
  ): string | null => {
    const authState = useAuthStore.getState();
    const { userId } = authState;
    if (!userId) return null;

    // 先生成临时任务ID（如果需要）
    let tempId: string | null = null;
    if (action.type === "added") {
      // 为新增任务生成临时ID
      tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 更新本地状态，提供即时反馈（乐观更新）
    set(
      produce((draftState: TodoState) => {
        switch (action.type) {
          case "added": {
            // 准备任务数据
            const taskData: Todo = {
              id: tempId!,
              title: action.title,
              text: action.text || "",
              completed: action.completed || false,
              priority: action.priority || Priority.None,
              deadline: action.deadline || undefined,
              parentId: action.parentId || null,
              depth: action.depth || 0,
              tags: action.tags || [],
              listId: action.listId,
              isPinned: action.isPinned || false,
              groupId: action.groupId || undefined,
              userId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            // 直接添加到本地状态
            draftState.tasks.push(taskData);

            // 如果有父任务，更新父任务的updatedAt
            if (taskData.parentId) {
              const parentTaskIndex = draftState.tasks.findIndex(
                (task) => task.id === taskData.parentId,
              );
              if (parentTaskIndex !== -1) {
                draftState.tasks[parentTaskIndex].updatedAt =
                  new Date().toISOString();
              }
            }
            break;
          }
          case "completedChange": {
            if (action.todoId && typeof action.completed === "boolean") {
              // 直接更新任务的completed属性
              const todoIndex = draftState.tasks.findIndex(
                (task) => task.id === action.todoId,
              );

              if (todoIndex !== -1) {
                // 直接更新现有任务的completed属性
                draftState.tasks[todoIndex] = {
                  ...draftState.tasks[todoIndex],
                  completed: action.completed,
                  userId,
                  updatedAt: new Date().toISOString(),
                };
                console.log(
                  `任务 ${action.todoId} 的完成状态已更新为: ${action.completed}`,
                );
              }
            }
            break;
          }
          case "changed": {
            if (action.todo.id) {
              // 需要级联更新的属性
              const cascadingProperties = [
                "listId",
                "groupId",
                "completed",
                "isPinned",
                "pinnedAt",
                "deletedAt",
                "parentId",
              ];

              const todoIndex = draftState.tasks.findIndex(
                (task) => task.id === action.todo.id,
              );
              // 检查任务是否在tasks数组中
              const taskInTasksArray = todoIndex !== -1;

              // 保留createdAt等不变字段，只更新必要字段
              const updatedTask = {
                id: action.todo.id,
                ...(taskInTasksArray ? draftState.tasks[todoIndex] : {}),
                ...action.todo,
                userId,
                updatedAt: new Date().toISOString(),
              };

              if (action.todo.completed === true) {
                // 当completed状态变为true时，从tasks中移除任务
                if (taskInTasksArray) {
                  draftState.tasks.splice(todoIndex, 1);
                  console.log(
                    `任务 ${action.todo.id} 已从tasks中移除，因为状态变为已完成`,
                  );
                }
              } else if (action.todo.completed === false) {
                // 当completed状态变为false时，添加到tasks数组
                if (taskInTasksArray) {
                  // 如果任务已经在tasks中，直接更新
                  draftState.tasks[todoIndex] = updatedTask;
                } else {
                  // 如果任务不在tasks中，添加进去
                  draftState.tasks.push(updatedTask);
                  console.log(
                    `任务 ${action.todo.id} 已添加到tasks中，因为状态变为未完成`,
                  );
                }

                // 同时处理子任务，将子任务也添加到tasks数组
                draftState.tasks.forEach((task) => {
                  if (task.parentId === action.todo.id && !task.completed) {
                    const childTaskIndex = draftState.tasks.findIndex(
                      (t) => t.id === task.id,
                    );
                    if (childTaskIndex === -1) {
                      // 如果子任务不在tasks数组中，添加进去
                      draftState.tasks.push({
                        ...task,
                        updatedAt: new Date().toISOString(),
                      });
                      console.log(
                        `子任务 ${task.id} 已添加到tasks中，因为父任务状态变为未完成`,
                      );
                    }
                  }
                });
              } else {
                // 其他情况，正常更新tasks中的任务（如果存在）
                if (taskInTasksArray) {
                  draftState.tasks[todoIndex] = updatedTask;
                }
              }
            }
            break;
          }
          case "deleted": {
            if (action.deleteId) {
              // 记录要删除的任务及其子任务，以便API调用
              draftState.tasks = draftState.tasks.filter(
                (task) => task.id !== action.deleteId,
              );
              // 同时移除子任务
              draftState.tasks = draftState.tasks.filter(
                (task) => task.parentId !== action.deleteId,
              );
            }
            break;
          }
          case "completedAll": {
            const { completeOrUncomplete, listId } = action;
            draftState.tasks.forEach((task: any) => {
              if (task.listId !== listId) return;
              task.completed = completeOrUncomplete;
              task.updatedAt = new Date().toISOString();
            });
            break;
          }
          case "deletedAll": {
            if (action.todoList && action.listId) {
              // 仅保留未完成的任务
              draftState.tasks = draftState.tasks.filter(
                (task) => !(task.completed && task.listId === action.listId),
              );
            }
            break;
          }
          case "moveToGroup": {
            if (action.todoId && action.groupId !== undefined) {
              // 更新本地状态 - 只更新当前任务，子任务由SSE处理
              draftState.tasks = draftState.tasks.map((task) => {
                if (
                  task.id === action.todoId ||
                  task.parentId === action.todoId
                ) {
                  return {
                    ...task,
                    groupId: action.groupId,
                    updatedAt: new Date().toISOString(),
                  };
                }
                return task;
              });
              // 触发表格刷新事件
              tableEvents.notify();
            }
            break;
          }
          case "moveToList": {
            if (action.todoId && action.listId) {
              // 从本地删除任务及其所有子任务
              draftState.tasks = draftState.tasks.filter((task) => {
                // 排除目标任务及其所有子任务
                return (
                  task.id !== action.todoId && task.parentId !== action.todoId
                );
              });
              // 触发表格刷新事件
              tableEvents.notify();
            }
            break;
          }
        }
      }),
    );
    
    return tempId;
  },

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
      // 1. 先调用本地更新方法进行乐观更新
      const tempId = todoActions.updateTodoLocallyByAction(action, set, get);
      
      // 2. 然后异步发送API请求
      switch (action.type) {
        case "added": {
          // 获取临时创建的任务
          const localCreatedTask = get().tasks.find(task => task.id === tempId);
          
          if (localCreatedTask) {
            // 发送API请求，但不使用tempId
            const taskData = {
              ...localCreatedTask,
              id: undefined, // 让服务器生成真实ID
            };

            try {
              const createdTask = await createTodo(taskData);

              // API成功后，更新本地状态中的临时ID为真实ID
              if (createdTask && createdTask.id) {
                set(
                  produce((draftState: TodoState) => {
                    const tempTaskIndex = draftState.tasks.findIndex(
                      (task) => task.id === tempId,
                    );
                    if (tempTaskIndex !== -1) {
                      draftState.tasks[tempTaskIndex] = createdTask;
                    }
                  }),
                );
              }
            } catch (error) {
              console.error("创建任务API调用失败:", error);
              // API失败后，可以选择从本地状态中移除临时任务
              // 这里暂时保留，让用户可以重试
              throw error;
            }
          }
          break;
        }
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
              .then(() => {
                message.success(MESSAGES.SUCCESS.TASK_MOVE);
                // 无需WebSocket通知，使用SSE代替
              })
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
