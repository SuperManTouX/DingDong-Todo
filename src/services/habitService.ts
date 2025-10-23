// 习惯接口定义
export interface Habit {
  id: string;
  user_id: string;
  title: string;
  description: string;
  frequency: string;
  custom_frequency_days: number | null;
  start_date: string;
  target_days: number;
  reminder_time: string;
  is_reminder_enabled: number;
  color: string;
  emoji: string;
  is_deleted: number;
  created_at: string;
  updated_at: string;
  currentStreak: number;
  totalDays: number;
  isCompletedToday: boolean;
}

export interface HabitDetailResponse {
  habit: Habit;
  dateStatuses?: DateStatus[];
  stats?: HabitStats;
}

export interface DateStatus {
  date: string; // YYYY-MM-DD格式
  status: "completed" | "abandoned" | null;
}

export interface HabitStats {
  monthCompletedDays: number;
  monthCompletionRate: number;
  totalDays: number;
  currentStreak: number;
  longestStreak: number;
}

import api from "./api";

class HabitService {
  // 获取所有习惯
  async getHabits(): Promise<Habit[]> {
    const response = await api.get<Habit[]>("/habits");
    return response;
  }

  // 获取习惯详情（包括打卡记录和统计数据）
  async getHabitById(
    habitId: string,
    date?: string,
  ): Promise<HabitDetailResponse> {
    const params = date ? { date } : {};
    const response = await api.get<HabitDetailResponse>(`/habits/${habitId}`, {
      params,
    });
    return response;
  }

  // 创建习惯
  async createHabit(
    habitData: Omit<Habit, "id" | "createdAt" | "updatedAt">,
  ): Promise<Habit> {
    const response = await api.post<Habit>("/habits", habitData);
    return response;
  }

  // 更新习惯
  async updateHabit(habit: Habit): Promise<Habit> {
    const { id, ...updateData } = habit;
    const response = await api.put<Habit>(`/habits/${id}`, updateData);
    return response;
  }

  // 删除习惯
  async deleteHabit(habitId: string): Promise<void> {
    await api.delete(`/habits/${habitId}`);
  }

  // 切换打卡状态（使用新接口）
  async toggleCheckInStatus(
    habitId: string,
    date: string,
    status?: "completed" | "abandoned" | null,
  ): Promise<any> {
    const endpoint = `/habits/${habitId}/toggle-check-in`;
    const response = await api.post(endpoint, {
      checkInDate: date,
      status,
    });
    return response;
  }

  // 更新习惯打卡状态（保留兼容）
  async updateHabitCheckIn(
    habitId: string,
    date: string,
    status: "completed" | "abandoned" | null,
  ): Promise<void> {
    // 使用新的切换接口，直接传递status（包括null值）
    await this.toggleCheckInStatus(habitId, date, status);
  }

  // 获取习惯的打卡记录（特定月份）
  async getHabitCheckIns(
    habitId: string,
    month: string,
  ): Promise<DateStatus[]> {
    const response = await api.get<DateStatus[]>(
      `/habits/${habitId}/check-ins`,
      {
        params: { month },
      },
    );
    return response.data;
  }

  // 获取习惯统计数据
  async getHabitStats(habitId: string): Promise<HabitDetailResponse["stats"]> {
    const response = await api.get<HabitDetailResponse["stats"]>(
      `/habits/${habitId}/stats`,
    );
    return response.data;
  }
}

export const habitService = new HabitService();
