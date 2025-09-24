import api from "./api";
import type { Todo } from "@/types";

/**
 * 获取当前用户的回收站内容
 * @returns 回收站中的任务列表
 */
export const getBinItems = async (): Promise<Todo[]> => {
  try {
    const response = await api.get("/bin");
    return response;
  } catch (error) {
    console.error("获取回收站内容失败:", error);
    throw error;
  }
};

/**
 * 从回收站恢复指定任务
 * @param id 回收站项目ID
 * @returns 恢复成功的响应信息
 */
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

/**
 * 从回收站永久删除指定任务
 * @param id 回收站项目ID
 * @returns 删除成功的响应信息
 */
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

/**
 * 清空回收站
 * @returns 清空成功的响应信息
 */
export const emptyBin = async (): Promise<{ message: string }> => {
  try {
    const response = await api.delete("/bin");
    return response;
  } catch (error) {
    console.error("清空回收站失败:", error);
    throw error;
  }
};
