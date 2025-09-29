// 获取所有任务组
import type { Group } from "@/types";
import api from "@/services/api";

export const getAllGroups = async (): Promise<void> => {
  try {
    const response = await api.get("/task-groups");
    return response;
  } catch (error) {
    console.error("获取任务组失败:", error);
    throw error;
  }
};
// 创建任务组
export const createGroup = async (group: Omit<Group, "id">): Promise<Group> => {
  try {
    const response = await api.post("/task-groups", group);
    return response;
  } catch (error) {
    console.error("创建任务组失败:", error);
    throw error;
  }
};
// 更新任务组
export const updateGroup = async (
  id: string,
  groupData: Partial<Group>,
): Promise<Group> => {
  try {
    const response = await api.put(`/task-groups/${id}`, groupData);
    return response;
  } catch (error) {
    console.error("更新任务组失败:", error);
    throw error;
  }
};
// 删除任务组
export const deleteGroup = async (id: string): Promise<void> => {
  try {
    await api.delete(`/task-groups/${id}`);
  } catch (error) {
    console.error("删除任务组失败:", error);
    throw error;
  }
};
