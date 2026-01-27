import type { Habit, DateStatus, HabitStats } from "@/types";
import type { HabitState } from "../types";
import { habitService } from "@/services/habitService";

// 类型定义
type SetState = (partial: Partial<HabitState>) => void;
type GetState = () => HabitState;

export const habitActions = {
  // 加载所有习惯
  async loadHabits(set: SetState): Promise<void> {
    try {
      set({ isLoading: true, error: null });
      const habits = await habitService.getHabits();
      console.log(habits);
      set({ habits, isLoading: false });
    } catch (error) {
      console.error("加载习惯失败:", error);
      set({ error: "加载习惯失败", isLoading: false });
    }
  },

  // 加载习惯详情
  async loadHabitDetail(
    habitId: string,
    date?: string,
    set: SetState,
  ): Promise<void> {
    try {
      set({ isLoading: true, error: null });
      // 如果未提供date参数，自动使用当前年月（YYYY-MM格式）
      const currentDate = date || new Date().toISOString().substring(0, 7);
      const response = await habitService.getHabitById(habitId, currentDate);
      console.log(response);
      // 确保currentHabit的id与传入的habitId一致
      const habitWithCorrectId = response
        ? {
            ...response,
            id: habitId, // 明确设置为传入的habitId，防止被错误替换
          }
        : null;

      set({
        currentHabitId: habitId,
        currentHabit: habitWithCorrectId, // 更新currentHabit状态，确保id正确
        dateStatuses: response?.dateStatuses || [],
        habitStats: response?.stats || null,
        isLoading: false,
      });
      console.log("加载习惯详情，确保id正确:", habitId);
    } catch (error) {
      console.error("加载习惯详情失败:", error);
      set({ error: "加载习惯详情失败", isLoading: false });
    }
  },

  /**
   * 更新习惯打卡状态
   * 先更新本地状态以提供即时反馈，然后调用API
   * 不再立即重新加载数据，而是依赖SSE消息来更新状态
   */
  async updateHabitCheckIn(
    habitId: string,
    date: string,
    status: "completed" | "abandoned" | null,
    set: SetState,
    get: GetState,
  ): Promise<void> {
    try {
      set({ isLoading: true, error: null });

      // 立即更新本地状态以提供即时反馈
      const currentDateStatuses = get().dateStatuses;
      const existingIndex = currentDateStatuses.findIndex(
        (item) => item.date === date,
      );

      let newDateStatuses: DateStatus[];

      if (existingIndex >= 0) {
        if (status === null) {
          // 如果状态为null，删除记录
          newDateStatuses = currentDateStatuses.filter(
            (item) => item.date !== date,
          );
        } else {
          // 否则更新现有记录
          newDateStatuses = [...currentDateStatuses];
          newDateStatuses[existingIndex].status = status;
        }
      } else if (status !== null) {
        // 添加新的打卡记录
        newDateStatuses = [...currentDateStatuses, { date, status }];
      } else {
        // 如果状态为null且记录不存在，不做任何操作
        set({ isLoading: false });
        return;
      }

      set({ dateStatuses: newDateStatuses });
      console.log(habitId);
      // 直接传递status参数，包括null值
      await habitService.toggleCheckInStatus(habitId, date, status);

      console.log(
        `习惯 ${habitId} 在 ${date} 的打卡状态已切换为 ${status || "abandoned"}，等待SSE更新`,
      );

      // 不再立即重新加载数据，将由SSE事件处理更新
      set({ isLoading: false });
    } catch (error) {
      console.error("更新打卡状态失败:", error);

      // 如果API调用失败，回滚本地状态
      try {
        await this.loadHabitDetail(habitId, date.substring(0, 7), set);
      } catch (reloadError) {
        console.error("回滚状态失败:", reloadError);
      }

      set({ error: "更新打卡状态失败", isLoading: false });
    }
  },

  // 创建习惯
  async createHabit(
    habitData: Omit<Habit, "id" | "createdAt" | "updatedAt">,
    set: SetState,
    get: GetState,
  ): Promise<void> {
    try {
      set({ isLoading: true, error: null });
      const newHabit = await habitService.createHabit(habitData);

      // 更新本地状态
      const habits = get().habits;
      set({ habits: [...habits, newHabit], isLoading: false });
    } catch (error) {
      console.error("创建习惯失败:", error);
      set({ error: "创建习惯失败", isLoading: false });
    }
  },

  // 更新习惯
  async updateHabit(habit: Habit, set: SetState, get: GetState): Promise<void> {
    try {
      set({ isLoading: true, error: null });
      const updatedHabit = await habitService.updateHabit(habit);

      // 更新本地状态
      const habits = get().habits;
      const updatedHabits = habits.map((h) =>
        h.id === habit.id ? updatedHabit : h,
      );
      set({ habits: updatedHabits, isLoading: false });
    } catch (error) {
      console.error("更新习惯失败:", error);
      set({ error: "更新习惯失败", isLoading: false });
    }
  },

  // 删除习惯
  async deleteHabit(
    habitId: string,
    set: SetState,
    get: GetState,
  ): Promise<void> {
    try {
      set({ isLoading: true, error: null });
      await habitService.deleteHabit(habitId);

      // 更新本地状态
      const habits = get().habits;
      const updatedHabits = habits.filter((h) => h.id !== habitId);
      set({
        habits: updatedHabits,
        isLoading: false,
        // 如果删除的是当前选中的习惯，清除当前习惯ID
        currentHabitId:
          get().currentHabitId === habitId ? null : get().currentHabitId,
        dateStatuses: [],
        habitStats: null,
      });
    } catch (error) {
      console.error("删除习惯失败:", error);
      set({ error: "删除习惯失败", isLoading: false });
    }
  },
};
