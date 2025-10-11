import { produce } from "immer";
import type { TagReducerAction, TodoState, Tag } from "../types";
import { message } from "@/utils/antdStatic";
import { createTag, deleteTag, updateTag } from "@/services/tagService";

import { useAuthStore } from "@/store/authStore";

// 仅更新本地状态的方法
export const updateTagLocalState = (
  action: TagReducerAction,
  set: any,
  get: () => TodoState,
): void => {
  try {
    // 只更新本地状态，不发送API请求
    switch (action.type) {
      case "addTag": {
        // 添加标签到本地状态
        if (action.payload) {
          set(
            produce((draftState: TodoState) => {
              draftState.todoTags.push(action.payload);
            }),
          );
        }
        break;
      }
      case "updateTag": {
        // 更新本地状态中的标签
        if (action.payload && action.payload.id && action.payload.updates) {
          set(
            produce((draftState: TodoState) => {
              const tagIndex = draftState.todoTags.findIndex(
                (tag: any) => tag.id === action.payload!.id,
              );
              if (tagIndex !== -1) {
                draftState.todoTags[tagIndex] = {
                  ...draftState.todoTags[tagIndex],
                  ...action.payload!.updates,
                };
              }
            }),
          );
        }
        break;
      }
      case "deleteTag": {
        // 从本地状态中删除标签
        set(
          produce((draftState: TodoState) => {
            draftState.todoTags = draftState.todoTags.filter(
              (tag: any) => tag.id !== action.payload,
            );
            // 同时从所有任务中移除该标签
            draftState.tasks = draftState.tasks.map((task: any) => ({
              ...task,
              tags:
                task.tags?.filter(
                  (tagId: string) => tagId !== action.payload,
                ) || [],
            }));
          }),
        );
        break;
      }
      case "initializeTags":
        // 初始化标签列表，直接更新本地状态
        set(
          produce((draftState: TodoState) => {
            if (action.payload) {
              draftState.todoTags = action.payload;
            }
          }),
        );
        break;
      case "add": {
        // SSE专用：添加完整标签对象
        if (action.tag && action.tag.id) {
          set(
            produce((draftState: TodoState) => {
              // 检查标签是否已存在，避免重复
              const exists = draftState.todoTags.some(
                (t) => t.id === action.tag!.id,
              );
              if (!exists) {
                draftState.todoTags.push(action.tag!);
              }
            }),
          );
        }
        break;
      }
      case "update": {
        // SSE专用：更新完整标签对象
        if (action.tag && action.tag.id) {
          set(
            produce((draftState: TodoState) => {
              const tagIndex = draftState.todoTags.findIndex(
                (tag: any) => tag.id === action.tag!.id,
              );
              if (tagIndex !== -1) {
                draftState.todoTags[tagIndex] = action.tag!;
              }
            }),
          );
        }
        break;
      }
      case "delete": {
        // SSE专用：通过ID删除标签
        if (action.tagId) {
          set(
            produce((draftState: TodoState) => {
              draftState.todoTags = draftState.todoTags.filter(
                (tag: any) => tag.id !== action.tagId,
              );
              // 同时从所有任务中移除该标签
              draftState.tasks = draftState.tasks.map((task: any) => ({
                ...task,
                tags:
                  task.tags?.filter(
                    (tagId: string) => tagId !== action.tagId,
                  ) || [],
              }));
            }),
          );
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error(`标签本地状态更新失败 (${action.type}):`, error);
  }
};

// 仅发送API请求的方法
export const sendTagApiRequest = async (
  action: TagReducerAction,
): Promise<Tag | null> => {
  const authState = useAuthStore.getState();
  const { userId } = authState;
  if (!userId) return null;

  try {
    // 只发送API请求，不更新本地状态
    switch (action.type) {
      case "addTag": {
        // 发送创建标签API请求
        if (action.payload) {
          const createdTag = await createTag({
            name: action.payload.name,
            color: action.payload.color,
            parentId: action.payload.parentId || null,
          });
          message.success("标签创建成功");
          return createdTag;
        }
        break;
      }
      case "updateTag": {
        // 发送更新标签API请求
        if (action.payload && action.payload.id && action.payload.updates) {
          const updatedTag = await updateTag(
            action.payload.id,
            action.payload.updates,
          );
          message.success("标签更新成功");
          return updatedTag;
        }
        break;
      }
      case "deleteTag": {
        // 发送删除标签API请求
        await deleteTag(action.payload);
        message.success("标签删除成功");
        return null;
      }
      default:
        break;
    }
  } catch (error) {
    console.error(`标签API操作失败 (${action.type}):`, error);
    message.error(
      `标签${action.type === "addTag" ? "创建" : action.type === "updateTag" ? "更新" : "删除"}失败，请重试`,
    );
    throw error; // 向上抛出错误，让调用者知道操作失败
  }

  return null;
};

// 整合方法 - 发送API请求并更新本地状态（保持原有功能）
export const tagActions = {
  dispatchTag: async (
    action: TagReducerAction,
    set: any,
    get: () => TodoState,
  ): Promise<void> => {
    // 发送API请求
    const result = await sendTagApiRequest(action);

    // 根据API结果更新本地状态
    // 对于创建和更新操作，使用API返回的完整对象
    if (result && (action.type === "addTag" || action.type === "updateTag")) {
      const localAction = {
        type: action.type === "addTag" ? "add" : "update",
        tag: result,
      } as TagReducerAction;
      updateTagLocalState(localAction, set, get);
    }
    // 对于删除操作，直接使用payload
    else if (action.type === "deleteTag") {
      updateTagLocalState(action, set, get);
    }
    // 对于初始化操作，直接更新本地状态
    else if (action.type === "initializeTags") {
      updateTagLocalState(action, set, get);
    }
  },

  // 仅更新本地状态的方法（供SSE使用）
  updateLocal: updateTagLocalState,

  // 仅发送API请求的方法（供需要单独发送请求的场景使用）
  sendApiRequest: sendTagApiRequest,
};
