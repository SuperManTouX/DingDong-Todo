import { produce } from "immer";
import { Priority } from "@/constants";
import { useAuthStore } from "@/store/authStore";
import { createTodo, updateTodo, deleteTodo } from "@/services/todoService";
import type { TodoActionExtended } from "@/types";
import type { TodoState } from "../types";

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
      // 先调用API
      let createdTask: any = null;
      let updatedTask: any = null;

      switch (action.type) {
        case "added": {
          // 准备任务数据
          const taskData = {
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
          };

          // 等待API调用成功
          createdTask = await createTodo(taskData);
          break;
        }
        case "changed": {
          if (action.todo.id) {
            // 等待API调用成功
            updatedTask = await updateTodo(action.todo.id, {
              ...action.todo,
              userId,
            });
          }
          break;
        }
        case "deleted": {
          if (action.deleteId) {
            // 等待API调用成功
            await deleteTodo(action.deleteId);
          }
          break;
        }
        case "completedAll": {
          // 对于批量操作，我们仍然先更新本地状态
          // 因为这可能影响多个任务，为了用户体验我们不等待所有API调用
          set(
            produce((draftState: TodoState) => {
              const { completeOrUncomplete, listId } = action;
              draftState.tasks.forEach((task: any) => {
                if (task.listId !== listId) return;
                task.completed = completeOrUncomplete;
              });
            }),
          );
          // 然后异步更新每个任务
          const tasksToUpdate = get().tasks.filter(
            (task: any) => task.listId === action.listId,
          );
          await Promise.all(
            tasksToUpdate.map((task: any) =>
              updateTodo(task.id, {
                ...task,
                completed: action.completeOrUncomplete,
                userId,
              }),
            ),
          );
          return;
        }
        case "deletedAll": {
          if (action.todoList && action.listId) {
            // 获取所有已完成的任务
            const completedTasks = action.todoList.filter(
              (task: any) => task.completed && task.listId === action.listId,
            );

            // 等待所有删除API调用成功
            await Promise.all(
              completedTasks.map((task: any) => deleteTodo(task.id)),
            );
          }
          break;
        }
        default:
          break;
      }

      // API调用成功后再更新本地状态
      set(
        produce((draftState: TodoState) => {
          switch (action.type) {
            case "added":
              if (createdTask) {
                draftState.tasks.push(createdTask);

                // 如果有父任务，更新父任务的updatedAt
                if (createdTask.parentId) {
                  const parentTaskIndex = draftState.tasks.findIndex(
                    (task) => task.id === createdTask.parentId,
                  );
                  if (parentTaskIndex !== -1) {
                    draftState.tasks[parentTaskIndex].updatedAt =
                      new Date().toISOString();
                  }
                }
              }
              break;
            case "changed":
              if (updatedTask && action.todo.id) {
                const todoIndex = draftState.tasks.findIndex(
                  (task) => task.id === action.todo.id,
                );
                if (todoIndex !== -1) {
                  draftState.tasks[todoIndex] = updatedTask;
                }
              }
              break;
            case "deleted":
              if (action.deleteId) {
                draftState.tasks = draftState.tasks.filter(
                  (task) => task.id !== action.deleteId,
                );
                // 同时移除子任务
                draftState.tasks = draftState.tasks.filter(
                  (task) => task.parentId !== action.deleteId,
                );
              }
              break;
            case "deletedAll":
              if (action.todoList && action.listId) {
                // 仅保留未完成的任务
                draftState.tasks = draftState.tasks.filter(
                  (task) => !(task.completed && task.listId === action.listId),
                );
              }
              break;
            default:
              break;
          }
        }),
      );
    } catch (error) {
      console.error(`API操作失败 (${action.type}):`, error);
      // 可以在这里添加用户友好的错误提示
      throw error; // 重新抛出错误以便调用者可以处理
    }
  },
};
