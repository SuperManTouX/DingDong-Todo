import api from "./api";
import type { Tag } from "@/types";

// 获取所有标签
export const getAllTags = async (): Promise<Tag[]> => {
  try {
    const response = await api.get("/todo-tags");
    return response;
  } catch (error) {
    console.error("获取标签失败:", error);
    throw error;
  }
};
// 创建标签
export const createTag = async (
  tagData: Omit<Tag, "id" | "createdAt" | "updatedAt">,
): Promise<Tag> => {
  try {
    const response = await api.post("/todo-tags", {
      name: tagData.name,
      color: tagData.color,
      parentId: tagData.parentId,
    });
    return response;
  } catch (error) {
    console.error("创建标签失败:", error);
    throw error;
  }
};
// 更新标签
export const updateTag = async (
  id: string,
  updates: Partial<Tag>,
): Promise<Tag> => {
  try {
    const response = await api.put(`/todo-tags/${id}`, updates);
    return response;
  } catch (error) {
    console.error(`更新标签 ${id} 失败:`, error);
    throw error;
  }
};
export const deleteTag = async (id: string): Promise<void> => {
  try {
    await api.delete(`/todo-tags/${id}`);
  } catch (error) {
    console.error(`删除标签 ${id} 失败:`, error);
    throw error;
  }
};
