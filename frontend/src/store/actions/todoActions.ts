import { produce } from "immer";
import { Priority } from "@/constants";
import { useAuthStore } from "@/store/authStore";
import { createTodo, updateTodo, deleteTodo } from "@/services/todoService";
import type { TodoActionExtended } from "@/types";
import type { TodoState } from "../types";
import type { Todo } from "@/types";

export const todoActions = {
  dispatchTodo: async (
    action: TodoActionExtended,
    set: any,
    get: () => TodoState,
  ): Promise<void> => {
    const authState = useAuthStore.getState();
    const { userId } = authState;
    if (!userId) return;

    try {
      // 先生成临时任务ID（如果需要）
      let tempId: string | null = null;
      if (action.type === "added") {
        // 为新增任务生成临时ID
        tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // 先更新本地状态，提供即时反馈
      let localCreatedTask: Todo | null = null;
      set(
        produce((draftState: TodoState) => {
          switch (action.type) {
            case "added": {
              // 准备任务数据
              const taskData: Todo = {
                id: tempId!,
                title: action.title,
                text: action.text || '',
                completed: action.completed || false,
                priority: action.priority || Priority.normal,
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
              localCreatedTask = taskData;

              // 如果有父任务，更新父任务的updatedAt
              if (taskData.parentId) {
                const parentTaskIndex = draftState.tasks.findIndex(
                  (task) => task.id === taskData.parentId,
                );
                if (parentTaskIndex !== -1) {
                  draftState.tasks[parentTaskIndex].updatedAt = new Date().toISOString();
                }
              }
              break;
            }
            case "changed": {
              if (action.todo.id) {
                const todoIndex = draftState.tasks.findIndex(
                  (task) => task.id === action.todo.id,
                );
                if (todoIndex !== -1) {
                  // 保留createdAt等不变字段，只更新必要字段
                  draftState.tasks[todoIndex] = {
                    ...draftState.tasks[todoIndex],
                    ...action.todo,
                    userId,
                    updatedAt: new Date().toISOString(),
                  };
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
            default:
              break;
          }
        }),
      );

      // 然后异步发送API请求
      switch (action.type) {
        case "added": {
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
        case "changed": {
          if (action.todo.id) {
            // 发送API请求，但不等待响应
            updateTodo(action.todo.id, {
              ...action.todo,
              userId,
            }).catch(error => {
              console.error(`更新任务API调用失败 (ID: ${action.todo.id}):`, error);
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
            deleteTodo(action.deleteId).catch(error => {
              console.error(`删除任务API调用失败 (ID: ${action.deleteId}):`, error);
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
              }).catch(error => {
                console.error(`批量完成任务API调用失败 (ID: ${task.id}):`, error);
                return null; // 继续处理其他任务
              })
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
                deleteTodo(task.id).catch(error => {
                  console.error(`批量删除任务API调用失败 (ID: ${task.id}):`, error);
                  return null; // 继续处理其他任务
                })
              ),
            );
          }
          break;
        }
        default:
          break;
      }
    } catch (error) {
      console.error(`任务操作失败 (${action.type}):`, error);
      // 可以在这里添加用户友好的错误提示
      throw error; // 重新抛出错误以便调用者可以处理
    }
  },

  // 交换两个任务在数组中的位置
  swapTasksPositions: (draggedTask: Todo, targetTask: Todo, set: any, get: () => TodoState): void => {
    set(
      produce((draftState: TodoState) => {
        // 查找两个任务在tasks数组中的索引
        const draggedIndex = draftState.tasks.findIndex(task => task.id === draggedTask.id);
        const targetIndex = draftState.tasks.findIndex(task => task.id === targetTask.id);

        // 确保两个任务都存在于数组中
        if (draggedIndex !== -1 && targetIndex !== -1) {
          // 交换任务位置
          const temp = draftState.tasks[draggedIndex];
          draftState.tasks[draggedIndex] = draftState.tasks[targetIndex];
          draftState.tasks[targetIndex] = temp;
          
          console.log(`已成功交换任务位置: draggedTask (${draggedTask.id}) 与 targetTask (${targetTask.id})`);
        } else {
          console.error('交换任务失败: 未找到指定的任务');
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
  }
};
