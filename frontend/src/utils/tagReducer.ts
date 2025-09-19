import type { Tag } from "@/types";
import todoTags from "@/data/todoTags.json";

export interface TagAction {
  type: string;
  payload?: any;
}

export interface AddTagAction extends TagAction {
  type: "addTag";
  payload: Omit<Tag, "id"> & { id?: string };
}

export interface UpdateTagAction extends TagAction {
  type: "updateTag";
  payload: { id: string; updates: Partial<Tag> };
}

export interface DeleteTagAction extends TagAction {
  type: "deleteTag";
  payload: string;
}

export interface InitializeTagsAction extends TagAction {
  type: "initializeTags";
  payload?: Tag[];
}

export type TagReducerAction =
  | AddTagAction
  | UpdateTagAction
  | DeleteTagAction
  | InitializeTagsAction;

// 创建标签ID的辅助函数
function generateTagId(existingTags: Tag[]): string {
  // 找到最大的ID数值
  const maxId = existingTags.reduce((max, tag) => {
    const idNum = parseInt(tag.id);
    return isNaN(idNum) ? max : Math.max(max, idNum);
  }, 0);
  // 返回下一个ID
  return (maxId + 1).toString();
}

// 标签reducer函数
export default function tagReducer(
  draft: Tag[],
  action: TagReducerAction,
): Tag[] {
  switch (action.type) {
    case "initializeTags":
      // 初始化标签数据，如果没有提供初始数据则使用默认的todoTags
      return action.payload || [...todoTags];

    case "addTag": {
      const { payload } = action;
      // 如果没有提供ID，则生成一个新的ID
      const newTag: Tag = {
        ...payload,
        id: payload.id || generateTagId(draft),
      };
      console.log(newTag);
      draft.push(newTag);
      return draft;
    }

    case "updateTag": {
      const { id, updates } = action.payload;
      const tagIndex = draft.findIndex((tag) => tag.id === id);
      if (tagIndex !== -1) {
        draft[tagIndex] = { ...draft[tagIndex], ...updates };
      }
      return draft;
    }

    case "deleteTag": {
      const tagId = action.payload;
      // 不允许删除有子标签的标签
      const hasChildTags = draft.some((tag) => tag.parentId === tagId);
      if (hasChildTags) {
        // 可以选择抛出错误或返回原始状态
        console.warn("Cannot delete a tag with child tags");
        return draft;
      }
      return draft.filter((tag) => tag.id !== tagId);
    }

    default:
      return draft;
  }
}

// 获取初始标签数据的辅助函数
export function getInitialTags(): Tag[] {
  return [...todoTags];
}

// 获取标签树结构的辅助函数
export function getHierarchicalTags(tags: Tag[]): Tag[] {
  const rootTags = tags.filter(
    (tag) => tag.parentId === null || tag.parentId === "null",
  );

  // 为每个根标签添加子标签
  const buildTagTree = (parentId: string): Tag[] => {
    return tags
      .filter((tag) => tag.parentId === parentId)
      .map((tag) => ({
        ...tag,
        subTags: buildTagTree(tag.id),
      }));
  };

  return rootTags.map((tag) => ({
    ...tag,
    subTags: buildTagTree(tag.id),
  }));
}
