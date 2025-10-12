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
  mode?: "move" | "moveAndDelete";
  timestamp: Date;
}

export const listActions = {
  // 本地更新函数 - 用于乐观更新UI
  updateListLocally: (
    action: ListUpdateEvent,
    set: any,
    get: () => TodoState,
  ): void => {
    const authState = useAuthStore.getState();

    const { userId } = authState;
    if (!userId) return;
    console.log(action);
    try {
      switch (action.type) {
        case "create": {
          set(
            produce((draftState: TodoState) => {
              // 如果直接传入list对象，使用list对象数据
              if (action.list) {
                // 检查是否已存在相同ID的列表
                const existingIndex = draftState.todoListData.findIndex(
                  (list) => list.id === action.list.id,
                );

                if (existingIndex !== -1) {
                  // 如果已存在相同ID的列表，更新它
                  draftState.todoListData[existingIndex] = {
                    ...draftState.todoListData[existingIndex],
                    ...action.list,
                    isPending: false,
                  };
                } else {
                  // 否则添加新列表
                  draftState.todoListData.push({
                    ...action.list,
                    userId,
                    isPending: false,
                  });
                }
              }
            }),
          );
          break;
        }
        case "update": {
          set(
            produce((draftState: TodoState) => {
              console.log(action);
              // 如果直接传入list对象，使用list对象数据
              if (action.list && action.list.id) {
                const listIndex = draftState.todoListData.findIndex(
                  (list) => list.id === action.list.id,
                );
                if (listIndex !== -1) {
                  draftState.todoListData[listIndex] = {
                    ...draftState.todoListData[listIndex],
                    ...action.list,

                    isPending: false,
                  };
                }
              } else if (action.listId) {
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

                    isPending: true,
                  };
                }
              }
            }),
          );
          break;
        }
        case "delete": {
          set(
            produce((draftState: TodoState) => {
              const listId = action.listId || action.list?.id || "";

              if (!listId) {
                console.warn("删除操作缺少listId或list对象");
                return;
              }

              // 保存被删除的列表信息，以便在API失败时回滚
              const listToDelete = draftState.todoListData.find(
                (list) => list.id === listId,
              );
              if (listToDelete) {
                // 如果提供了targetListId和mode，根据mode决定如何处理任务
                if (action.targetListId) {
                  if (action.mode === "moveAndDelete") {
                    // moveAndDelete模式：移动任务并标记为已删除
                    draftState.tasks = draftState.tasks.map((task) =>
                      task.listId === listId
                        ? {
                            ...task,
                            listId: action.targetListId,

                            groupId: undefined, // 清除groupId
                          }
                        : task,
                    );
                  } else {
                    // move模式：只移动任务到目标清单
                    draftState.tasks = draftState.tasks.map((task) =>
                      task.listId === listId
                        ? {
                            ...task,
                            listId: action.targetListId,
                            groupId: undefined, // 清除groupId
                          }
                        : task,
                    );
                  }
                } else {
                  // 否则将任务标记为已删除，而不是从state中移除
                  draftState.tasks = draftState.tasks.map((task) =>
                    task.listId === listId
                      ? {
                          ...task,
                          deletedAt: new Date().toISOString(),
                          listId: "",
                          groupId: undefined, // 清除groupId
                        }
                      : task,
                  );
                }

                // 直接从UI中移除清单（乐观更新）
                draftState.todoListData = draftState.todoListData.filter(
                  (list) => list.id !== listId,
                );

                // 同时删除关联的分组
                draftState.groups = draftState.groups.filter(
                  (group) => group.listId !== listId,
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
        case "create": {
          const listData = action.list || {
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
        case "update": {
          const listId = action.list?.id || action.listId;
          if (!listId) {
            console.error("更新清单缺少ID");
            return;
          }

          const updateData = action.list || {
            title: action.title,
            emoji: action.emoji,
            color: action.color,
          };

          // 发送API请求，但不阻塞UI
          updateTodoList(listId, updateData)
            .then((updatedList) => {
              // API调用成功后，通过SSE通知更新本地状态
              const event: ListUpdateEvent = {
                type: "update",
                listId: listId,
                list: updatedList,
                timestamp: new Date(),
              };

              message.success("清单更新成功");
            })
            .catch((error) => {
              console.error(`更新清单API调用失败 (ID: ${listId}):`, error);
              // API失败后，可以选择回滚本地状态
              message.error("更新清单失败");
            });
          break;
        }
        case "delete": {
          const listId = action.list?.id || action.listId;
          if (!listId) {
            console.error("删除清单缺少ID");
            return;
          }

          // 发送API请求，但不阻塞UI
          deleteTodoList(listId, action.targetListId, action.mode)
            .then(() => {
              // API调用成功后，通过SSE通知更新本地状态
              const event: ListUpdateEvent = {
                type: "delete",
                listId: listId,
                targetListId: action.targetListId,
                mode: action.mode,
                timestamp: new Date(),
              };
              message.success("清单删除成功");
            })
            .catch((error) => {
              console.error(`删除清单API调用失败 (ID: ${listId}):`, error);
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
