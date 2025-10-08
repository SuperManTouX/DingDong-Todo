// 获取回收站内容
import api from "@/services/api";
import type { Todo } from "@/types";

export const getBinItems = async (): Promise<Todo[]> => {
  try {
    const response = await api.get("/bin");
    return response;
  } catch (error) {
    console.error("获取回收站内容失败:", error);
    throw error;
  }
};
// 将任务移至回收站
export const moveTaskToBin = async (
  id: string,
): Promise<{ message: string; binId: string }> => {
  try {
    const response = await api.delete(`/todos/${id}`);
    return response;
  } catch (error) {
    console.error(`移动任务 ${id} 到回收站失败:`, error);
    throw error;
  }
};
// 从回收站恢复任务
export const restoreFromBin = async (
  id: string,
): Promise<{ message: string; taskId: string }> => {
  try {
    const response = await api.post(`/bin/restore/${id}`);
    return response;
  } catch (error) {
    console.error(`恢复回收站任务 ${id} 失败:`, error);
    throw error;
  }
};
// 从回收站永久删除任务
export const deleteFromBin = async (
  id: string,
): Promise<{ message: string }> => {
  try {
    const response = await api.delete(`/bin/${id}`);
    return response;
  } catch (error) {
    console.error(`永久删除回收站任务 ${id} 失败:`, error);
    throw error;
  }
};
// 清空回收站
export const emptyBin = async (): Promise<{ message: string }> => {
  try {
    const response = await api.delete("/bin");
    return response;
  } catch (error) {
    console.error("清空回收站失败:", error);
    throw error;
  }
};
