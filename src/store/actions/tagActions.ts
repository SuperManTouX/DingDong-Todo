import { produce } from "immer";
import type { TagReducerAction, TodoState } from "../types";
import { message } from "@/utils/antdStatic";
import { createTag, deleteTag, updateTag } from "@/services/tagService";

export const tagActions = {
  dispatchTag: async (
    action: TagReducerAction,
    set: any,
    get: () => TodoState,
  ): Promise<void> => {
    try {
      // 先执行API调用
      switch (action.type) {
        case "addTag": {
          // 先发送API请求
          const createdTag = await createTag({
            name: action.payload.name,
            color: action.payload.color,
            parentId: action.payload.parentId || null,
          });

          // API成功后更新本地状态
          set(
            produce((draftState: TodoState) => {
              draftState.todoTags.push(createdTag);
            }),
          );
          message.success("标签创建成功");
          break;
        }
        case "updateTag": {
          // 先发送API请求
          const updatedTag = await updateTag(
            action.payload.id,
            action.payload.updates,
          );

          // API成功后更新本地状态
          set(
            produce((draftState: TodoState) => {
              const tagIndex = draftState.todoTags.findIndex(
                (tag: any) => tag.id === action.payload.id,
              );
              if (tagIndex !== -1) {
                draftState.todoTags[tagIndex] = updatedTag;
              }
            }),
          );
          message.success("标签更新成功");
          break;
        }
        case "deleteTag": {
          // 先发送API请求
          await deleteTag(action.payload);

          // API成功后更新本地状态
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
          message.success("标签删除成功");
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
  },
};
