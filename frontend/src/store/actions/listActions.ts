import { produce } from "immer";
import { useAuthStore } from "@/store/authStore";
import type { ListGroupAction, TodoState } from "../types";
import {
  createTodoList,
  deleteTodoList,
  updateTodoList,
} from "@/services/listService";

export const listActions = {
  dispatchList: async (
    action: ListGroupAction,
    set: any,
    get: () => TodoState,
  ): Promise<void> => {
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
          // 等待API调用成功，传递targetListId和mode参数
          await deleteTodoList(action.listId, action.targetListId, action.mode);

          // API调用成功后再更新本地状态
          set(
            produce((draftState: TodoState) => {
              draftState.todoListData = draftState.todoListData.filter(
                (list) => list.id !== action.listId,
              );
              // 如果提供了targetListId和mode，根据mode决定如何处理任务
              if (action.targetListId) {
                if (action.mode === 'moveAndDelete') {
                  // moveAndDelete模式：移动任务并标记为已删除
                  draftState.tasks = draftState.tasks.map(task => 
                    task.listId === action.listId 
                      ? { 
                          ...task, 
                          listId: action.targetListId,
                          deletedAt: new Date().toISOString() 
                        }
                      : task
                  );
                } else {
                  // move模式：只移动任务到目标清单
                  draftState.tasks = draftState.tasks.map(task => 
                    task.listId === action.listId 
                      ? { ...task, listId: action.targetListId }
                      : task
                  );
                }
              } else {
                // 否则将任务标记为已删除（移入回收站），而不是从state中移除
                draftState.tasks = draftState.tasks.map(task => 
                  task.listId === action.listId 
                    ? { ...task, deletedAt: new Date().toISOString(), listId: '' }
                    : task
                );
              }
            }),
          );
          break;
        }
        default:
          break;
      }
    } catch (error) {
      console.error(`API操作失败 (${action.type}):`, error);
      throw error; // 重新抛出错误以便调用者可以处理
    }
  },
};
