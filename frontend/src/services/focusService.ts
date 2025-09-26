import api from "./api";
// 专注记录接口定义
export interface FocusRecord {
  id: string;
  user_id: string;
  task_id: string;
  start_time: string;
  end_time: string | null;
  notes: string | null;
  completed: boolean;
  mode: "pomodoro" | "normal";
  created_at: string;
  updated_at: string;
}

// 创建专注记录的数据结构
export interface CreateFocusRecordData {
  task_id: string;
  start_time: string;
  end_time: string;
  notes?: string;
  completed?: boolean;
  mode: "pomodoro" | "normal";
}

// 更新专注记录的数据结构
export interface UpdateFocusRecordData {
  task_id?: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  completed?: boolean;
  mode?: "pomodoro" | "normal";
}

// 专注统计数据结构
export interface FocusStatistics {
  total_records: number;
  total_pomodoros: number;
  total_normal_sessions: number;
  total_minutes: number;
  total_hours: number;
}

class FocusService {
  // 创建专注记录
  async createFocusRecord(data: CreateFocusRecordData): Promise<FocusRecord> {
    try {
      const response = await api.post("/focus-records", data);
      return response.data;
    } catch (error) {
      console.error("创建专注记录失败:", error);
      throw error;
    }
  }

  // 获取所有专注记录
  async getAllFocusRecords(): Promise<FocusRecord[]> {
    try {
      const response = await api.get("/focus-records");
      return response;
    } catch (error) {
      console.error("获取专注记录失败:", error);
      throw error;
    }
  }

  // 获取单个专注记录
  async getFocusRecord(id: string): Promise<FocusRecord> {
    try {
      const response = await api.get(`/focus-records/${id}`);
      return response.data;
    } catch (error) {
      console.error(`获取专注记录 ${id} 失败:`, error);
      throw error;
    }
  }

  // 更新专注记录
  async updateFocusRecord(
    id: string,
    data: UpdateFocusRecordData,
  ): Promise<FocusRecord> {
    try {
      const response = await api.put(`/focus-records/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`更新专注记录 ${id} 失败:`, error);
      throw error;
    }
  }

  // 删除专注记录
  async deleteFocusRecord(id: string): Promise<void> {
    try {
      await api.delete(`/focus-records/${id}`);
    } catch (error) {
      console.error(`删除专注记录 ${id} 失败:`, error);
      throw error;
    }
  }

  // 获取指定任务的专注记录
  async getFocusRecordsByTaskId(taskId: string): Promise<FocusRecord[]> {
    try {
      const response = await api.get(`/focus-records/task/${taskId}`);
      return response;
    } catch (error) {
      console.error(`获取任务 ${taskId} 的专注记录失败:`, error);
      throw error;
    }
  }

  // 获取专注统计信息
  async getFocusStatistics(): Promise<FocusStatistics> {
    try {
      const response = await api.get("/focus-records/stats/summary");
      return response;
    } catch (error) {
      console.error("获取专注统计失败:", error);
      throw error;
    }
  }
}

export const focusService = new FocusService();
