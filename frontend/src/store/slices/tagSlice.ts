import { produce } from "immer";
import { v4 as uuidv4 } from "uuid";
import { createTag, updateTag, deleteTag } from "@/services/todoService";
import type { TagReducerAction, TodoState } from "../types";

export const tagActions = {
  dispatchTag: (
    action: TagReducerAction,
    set: any,
    get: any
  ): void => {
    set(
      produce((draftState: TodoState) => {
        switch (action.type) {
          case "addTag":
            // 使用action.payload中的数据
            const newTag: any = {
              id: uuidv4(),
              name: action.payload.name,
              color: action.payload.color || "#1890ff",
              parentId: action.payload.parentId || null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            draftState.todoTags.push(newTag);
            break;
          case "updateTag":
            // 使用action.payload中的数据
            const tagIndex = draftState.todoTags.findIndex(
              (tag: any) => tag.id === action.payload.id,
            );
            if (tagIndex !== -1) {
              draftState.todoTags[tagIndex] = {
                ...draftState.todoTags[tagIndex],
                ...action.payload.updates,
                updatedAt: new Date().toISOString(),
              };
            }
            break;
          case "deleteTag":
            // 使用action.payload作为tagId
            draftState.todoTags = draftState.todoTags.filter(
              (tag: any) => tag.id !== action.payload,
            );
            // 同时从所有任务中移除该标签
            draftState.tasks = draftState.tasks.map((task: any) => ({
              ...task,
              tags: task.tags?.filter((tagId: string) => tagId !== action.payload) || [],
            }));
            break;
          case "initializeTags":
            // 初始化标签列表
            if (action.payload) {
              draftState.todoTags = action.payload;
            }
            break;
          default:
            break;
        }
      }),
    );

    // 对于需要API调用的操作，在state更新后异步调用API
    const handleApiCall = async () => {
      try {
        switch (action.type) {
          case "addTag":
            await createTag({
              name: action.payload.name,
              color: action.payload.color,
              parentId: action.payload.parentId || null,
            });
            break;
          case "updateTag":
            await updateTag(action.payload.id, action.payload.updates);
            break;
          case "deleteTag":
            await deleteTag(action.payload);
            break;
        }
      } catch (error) {
        console.error(`标签API操作失败 (${action.type}):`, error);
      }
    };

    handleApiCall();
  },
};