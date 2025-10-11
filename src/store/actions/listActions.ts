import { produce } from "immer";
import { useAuthStore } from "@/store/authStore";
import type { ListGroupAction, TodoState } from "../types";
import {
  createTodoList,
  deleteTodoList,
  updateTodoList,
} from "@/services/listService";
import sseService from "@/services/sseService";
import { message } from "@/utils/antdStatic";

// 扩展SSE事件类型
export interface ListUpdateEvent {
  type: "create" | "update" | "delete";
  listId?: string;
  list?: any;
  targetListId?: string;
  mode?: 'move' | 'moveAndDelete';
  timestamp: Date;
}

// 为SSE服务添加清单更新监听功能
type SseServiceWithListSupport = typeof sseService & {
  onListUpdate?: (callback: (event: ListUpdateEvent) => void) => () => void;
  handleListUpdate?: (event: ListUpdateEvent) => void;
};

const enhancedSseService = sseService as SseServiceWithListSupport;

// 如果SSE服务还没有清单更新相关方法，添加它们
if (!enhancedSseService.handleListUpdate) {
  enhancedSseService.handleListUpdate = (event: ListUpdateEvent) => {
    // 这个方法会被SSE服务在收到清单更新事件时调用
    console.log("收到清单更新事件:", event);
    // 这里可以添加额外的处理逻辑
  };
}

if (!enhancedSseService.onListUpdate) {
  enhancedSseService.onListUpdate = (callback: (event: ListUpdateEvent) => void) => {
    // 临时实现：将回调添加到标签更新监听器中
    // 实际项目中应该在SSE服务中实现完整的清单更新监听机制
    return enhancedSseService.onTagUpdate?.(callback as any) || (() => {});
  };
}

export const listActions = {
  // 本地更新函数 - 用于乐观更新UI
  updateListLocally: (action: ListGroupAction, set: any, get: () => TodoState): void => {
    const authState = useAuthStore.getState();
    const { userId } = authState;
    if (!userId) return;

    try {
      switch (action.type) {
        case "addedList": {
          set(
            produce((draftState: TodoState) => {
              // 创建临时ID，等API响应后再更新
              const tempId = `temp-${Date.now()}`;
              draftState.todoListData.push({
                id: tempId,
                title: action.title,
                emoji: action.emoji,
                color: action.color,
                userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isPending: true, // 标记为待处理状态
              });
            }),
          );
          break;
        }
        case "updatedList": {
          set(
            produce((draftState: TodoState) => {
              const listIndex = draftState.todoListData.findIndex(
                (list) => list.id === action.listId,
              );
              if (listIndex !== -1) {
                // 保存原始数据，以便在API失败时回滚
                draftState.todoListData[listIndex] = {
                  ...draftState.todoListData[listIndex],
                  title: action.title,
                  emoji: action.emoji,
                  color: action.color,
                  updatedAt: new Date().toISOString(),
                  isPending: true,
                };
              }
            }),
          );
          break;
        }
        case "deletedList": {
          set(
            produce((draftState: TodoState) => {
              // 保存被删除的列表信息，以便在API失败时回滚
              const listToDelete = draftState.todoListData.find(
                (list) => list.id === action.listId,
              );
              if (listToDelete) {
                // 如果提供了targetListId和mode，根据mode决定如何处理任务
                if (action.targetListId) {
                  if (action.mode === 'moveAndDelete') {
                    // moveAndDelete模式：移动任务并标记为已删除
                    draftState.tasks = draftState.tasks.map(task => 
                      task.listId === action.listId 
                        ? { 
                            ...task, 
                            listId: action.targetListId,
                            deletedAt: new Date().toISOString(),
                            groupId: undefined // 清除groupId
                          }
                        : task
                    );
                  } else {
                    // move模式：只移动任务到目标清单
                    draftState.tasks = draftState.tasks.map(task => 
                      task.listId === action.listId 
                        ? { 
                            ...task, 
                            listId: action.targetListId,
                            groupId: undefined // 清除groupId
                          }
                        : task
                    );
                  }
                } else {
                  // 否则将任务标记为已删除，而不是从state中移除
                  draftState.tasks = draftState.tasks.map(task => 
                    task.listId === action.listId 
                      ? { 
                          ...task, 
                          deletedAt: new Date().toISOString(), 
                          listId: '',
                          groupId: undefined // 清除groupId
                        }
                      : task
                  );
                }
                
                // 直接从UI中移除清单（乐观更新）
                draftState.todoListData = draftState.todoListData.filter(
                  (list) => list.id !== action.listId,
                );
                
                // 同时删除关联的分组
                draftState.groups = draftState.groups.filter(
                  (group) => group.listId !== action.listId,
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
      console.error(`本地状态更新失败 (${action.type}):`, error);
      message.error(`本地状态更新失败`);
    }
  },

  // 发送API请求函数
  dispatchList: async (
    action: ListGroupAction,
    set: any,
    get: () => TodoState,
  ): Promise<void> => {
    const authState = useAuthStore.getState();
    const { userId } = authState;
    if (!userId) return;

    try {
      // 根据操作类型发送API请求
      switch (action.type) {
        case "addedList": {
          const listData = {
            title: action.title,
            emoji: action.emoji,
            color: action.color,
            userId,
          };

          // 发送API请求，但不阻塞UI
          createTodoList(listData)
            .then((createdList) => {
              // API调用成功后，通过SSE通知更新本地状态
              const event: ListUpdateEvent = {
                type: "create",
                list: createdList,
                timestamp: new Date(),
              };
              enhancedSseService.handleListUpdate?.(event);
              
              // 更新本地状态，替换临时ID
              set(
                produce((draftState: TodoState) => {
                  const tempIndex = draftState.todoListData.findIndex(
                    (list) => list.title === action.title && list.isPending,
                  );
                  if (tempIndex !== -1) {
                    draftState.todoListData[tempIndex] = createdList;
                  }
                }),
              );
              message.success("清单创建成功");
            })
            .catch((error) => {
              console.error("创建清单API调用失败:", error);
              // API失败后，回滚本地状态
              set(
                produce((draftState: TodoState) => {
                  draftState.todoListData = draftState.todoListData.filter(
                    (list) => !(list.title === action.title && list.isPending),
                  );
                }),
              );
              message.error("创建清单失败");
            });
          break;
        }
        case "updatedList": {
          const updateData = {
            title: action.title,
            emoji: action.emoji,
            color: action.color,
          };

          // 发送API请求，但不阻塞UI
          updateTodoList(action.listId, updateData)
            .then((updatedList) => {
              // API调用成功后，通过SSE通知更新本地状态
              const event: ListUpdateEvent = {
                type: "update",
                listId: action.listId,
                list: updatedList,
                timestamp: new Date(),
              };
              enhancedSseService.handleListUpdate?.(event);
              
              // 更新本地状态，移除pending标记
              set(
                produce((draftState: TodoState) => {
                  const listIndex = draftState.todoListData.findIndex(
                    (list) => list.id === action.listId,
                  );
                  if (listIndex !== -1) {
                    draftState.todoListData[listIndex] = {
                      ...updatedList,
                      isPending: false,
                    };
                  }
                }),
              );
              message.success("清单更新成功");
            })
            .catch((error) => {
              console.error(`更新清单API调用失败 (ID: ${action.listId}):`, error);
              // API失败后，可以选择回滚本地状态
              message.error("更新清单失败");
            });
          break;
        }
        case "deletedList": {
          // 发送API请求，但不阻塞UI
          deleteTodoList(action.listId, action.targetListId, action.mode)
            .then(() => {
              // API调用成功后，通过SSE通知更新本地状态
              const event: ListUpdateEvent = {
                type: "delete",
                listId: action.listId,
                targetListId: action.targetListId,
                mode: action.mode,
                timestamp: new Date(),
              };
              enhancedSseService.handleListUpdate?.(event);
              message.success("清单删除成功");
            })
            .catch((error) => {
              console.error(`删除清单API调用失败 (ID: ${action.listId}):`, error);
              // API失败后，可能需要回滚本地状态
              message.error("删除清单失败");
            });
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
