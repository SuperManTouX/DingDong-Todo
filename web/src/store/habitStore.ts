import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { HabitState } from "./types";
import { habitActions } from "./actions/habitActions";
import sseService from "../services/sseService";

// 初始状态
const initialState: HabitState = {
  habits: [
    {
      id: "habit-005",
      user_id: "user-001",
      title: "每日喝水",
      description: "每天至少喝8杯水",
      frequency: "daily",
      custom_frequency_days: null,
      start_date: "2024-01-17T16:00:00.000Z",
      target_days: 21,
      reminder_time: "09:00:00",
      is_reminder_enabled: 1,
      color: "#4299e1",
      emoji: "💧",
      is_deleted: 0,
      created_at: "2025-10-11T12:10:46.000Z",
      updated_at: "2025-10-11T12:10:46.000Z",
      currentStreak: 10,
      totalDays: 10,
      isCompletedToday: true,
    },
  ],
  currentHabit: null,
  loading: false,
  error: null,
  dateStatuses: [],
  stats: null,
};

// 创建习惯store
export const useHabitStore = create<HabitState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // 设置习惯列表
      setHabits: (habits) => set({ habits }),

      // 设置当前习惯ID
      setCurrentHabitId: (currentHabitId) => set({ currentHabitId }),

      // 设置当前习惯
      setCurrentHabit: (currentHabit) => set({ currentHabit }),

      // 设置日期状态
      setDateStatuses: (dateStatuses) => set({ dateStatuses }),

      // 订阅习惯更新事件
      subscribeToHabitUpdates: () => {
        // 添加习惯更新事件监听器
        sseService.onHabitUpdate((event) => {
          console.log("habitStore收到习惯更新事件:", event);

          const state = get();
          
          // 处理习惯创建事件
          if (event.action === "created" && event.data && event.habitId) {
            console.log("收到习惯创建事件，更新习惯列表:", event.data);
            
            // 将新创建的习惯添加到习惯列表中
            const newHabit = {
              ...event.data,
              // 确保添加统计信息
              currentStreak: event.stats?.currentStreak || 0,
              totalDays: event.stats?.totalDays || 0,
              isCompletedToday: event.stats?.isCompletedToday || false
            };
            
            // 避免重复添加
            const existingIndex = state.habits.findIndex(h => h.id === event.habitId);
            if (existingIndex === -1) {
              set({ habits: [...state.habits, newHabit] });
              console.log("新习惯已添加到列表中");
            } else {
              // 如果已存在，更新它
              const updatedHabits = [...state.habits];
              updatedHabits[existingIndex] = newHabit;
              set({ habits: updatedHabits });
              console.log("习惯已更新");
            }
            
            return;
          }

          // 检查是否是打卡记录更新（created、updated、deleted）
          if (event.data?.checkInDate || event.action === "deleted") {
            const { habitId, data, action } = event;

            // 更新日期状态
            const updatedDateStatuses = [...state.dateStatuses];
            const checkInDate = data?.checkInDate;
            const existingIndex = checkInDate
              ? updatedDateStatuses.findIndex(
                  (status) => status.date === checkInDate,
                )
              : -1;

            if (action === "created" || (action === "updated" && checkInDate)) {
              // 处理created或updated事件，包括null状态
              const status = data?.status;
              if (
                status === null ||
                status === "completed" ||
                status === "abandoned"
              ) {
                // 创建或更新打卡记录，不包含habitId
                const newStatus = { date: checkInDate, status };
                if (existingIndex >= 0) {
                  updatedDateStatuses[existingIndex] = newStatus;
                } else {
                  updatedDateStatuses.push(newStatus);
                }
                console.log(
                  `已${action === "created" ? "创建" : "更新"}习惯 ${habitId} 在 ${checkInDate} 的打卡状态为: ${status === null ? "null" : status}`,
                );
              }
            } else if (action === "deleted" && checkInDate) {
              // 删除打卡记录
              if (existingIndex >= 0) {
                updatedDateStatuses.splice(existingIndex, 1);
                console.log(
                  `已删除习惯 ${habitId} 在 ${checkInDate} 的打卡记录`,
                );
              }
            }

            // 确保更新currentHabit时保留原始的id属性
            const originalId = state.currentHabit?.id;
            set({
              currentHabit: { ...state.currentHabit, id: originalId, ...event.stats },
              dateStatuses: updatedDateStatuses,
            });
            console.log('更新currentHabit，保留原始id:', originalId);
          }

          // 如果有连续打卡统计信息，更新它
          if (event.data?.streak) {
            const { habitId, data } = event;
            const stats = data.streak;

            // 更新习惯列表中的统计信息
            const updatedHabits = state.habits.map((habit) => {
              if (habit.id === habitId) {
                return {
                  ...habit,
                  currentStreak: stats.currentStreak,
                  longestStreak: stats.longestStreak,
                  totalDays: stats.totalDays,
                  isCompletedToday: stats.isCompletedToday || false,
                };
              }
              return habit;
            });
            set({ habits: updatedHabits });

            // 更新当前习惯的统计信息，确保保留原始的id属性
            if (state.currentHabit?.id === habitId) {
              const originalId = state.currentHabit.id;
              set({
                currentHabit: {
                  ...state.currentHabit,
                  id: originalId, // 明确保留原始id
                  currentStreak: stats.currentStreak,
                  longestStreak: stats.longestStreak,
                  totalDays: stats.totalDays,
                  isCompletedToday: stats.isCompletedToday || false,
                },
              });
              console.log('更新当前习惯统计信息，保留原始id:', originalId);
            }

            // 构造并计算符合HabitStats接口的统计数据对象
            // 计算完成率等额外统计信息，同时兼容新旧数据格式
            const today = new Date();
            const startDate = state.currentHabit?.start_date ? new Date(state.currentHabit.start_date) : today;
            const daysSinceStart = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            
            // 兼容不同格式的streak数据
            const currentStreak = stats.currentStreak || (typeof stats === 'number' ? stats : 0);
            const longestStreak = stats.longestStreak || 0;
            const totalDays = stats.totalDays || 0;
            const lastCheckInDate = stats.lastCheckInDate || null;
            const isCompletedToday = stats.isCompletedToday || false;
            
            const completionRate = daysSinceStart > 0 ? Math.round((totalDays / daysSinceStart) * 100) : 0;
            
            const formattedStats: any = {
              currentStreak,
              longestStreak,
              totalDays,
              completionRate,
              daysSinceStart,
              lastCheckInDate,
              isCompletedToday
            };
            
            // 更新习惯统计数据
            set({ habitStats: formattedStats });
            set({ stats: formattedStats }); // 确保同时更新stats状态
            console.log('已计算并更新统计数据:', formattedStats);

            console.log(`已更新习惯 ${habitId} 的连续打卡统计信息`);
          }
        });

        console.log("habitStore已订阅习惯更新事件");
      },

      // 设置习惯统计
      setHabitStats: (habitStats) => set({ habitStats }),

      // 设置加载状态
      setLoading: (isLoading) => set({ isLoading }),

      // 设置错误信息
      setError: (error) => set({ error }),

      // API方法
      loadHabits: async () => habitActions.loadHabits(set),

      loadHabitDetail: async (habitId: string, date?: string) =>
        habitActions.loadHabitDetail(habitId, date, set),
      // 更新习惯打卡状态
      updateHabitCheckIn: async (
        habitId: string,
        date: string,
        status: "completed" | "abandoned" | null,
      ) => habitActions.updateHabitCheckIn(habitId, date, status, set, get),

      // 更新单个日期的打卡状态（用于优化本地UI响应）
      updateSingleDateStatus: (
        habitId: string,
        date: string,
        status: "completed" | "abandoned" | null,
      ) => {
        const state = get();
        const updatedDateStatuses = [...state.dateStatuses];
        const existingIndex = updatedDateStatuses.findIndex(
          (s) => s.date === date,
        );

        // 无论status是completed、abandoned还是null，都创建或更新记录
        // 只有当不需要记录时才删除（这里不删除null状态的记录）
        const newStatus = { date, status };
        if (existingIndex >= 0) {
          updatedDateStatuses[existingIndex] = newStatus;
        } else {
          updatedDateStatuses.push(newStatus);
        }

        set({ dateStatuses: updatedDateStatuses });
        console.log(
          `本地更新习惯 ${habitId} 在 ${date} 的打卡状态为: ${status === null ? "null" : status}`,
        );
      },

      createHabit: async (
        habitData: Omit<
          HabitState["habits"][0],
          "id" | "createdAt" | "updatedAt"
        >,
      ) => habitActions.createHabit(habitData, set, get),

      updateHabit: async (habit: HabitState["habits"][0]) =>
        habitActions.updateHabit(habit, set, get),

      deleteHabit: async (habitId: string) =>
        habitActions.deleteHabit(habitId, set, get),
    }),
    {
      name: "habitStore",
    },
  ),
);

// 兼容性包装器，方便在类组件中使用
export const habitStore = {
  getState: useHabitStore.getState,
  setState: useHabitStore.setState,
  subscribe: useHabitStore.subscribe,
};

// 便捷hooks
export const useHabits = () => useHabitStore((state) => state.habits);
export const useCurrentHabit = () =>
  useHabitStore(
    (state) =>
      state.currentHabit ||
      state.habits.find((h) => h.id === state.currentHabitId),
  );
export const useDateStatuses = () =>
  useHabitStore((state) => state.dateStatuses);
export const useHabitStats = () => useHabitStore((state) => state.habitStats);
export const useHabitLoading = () => useHabitStore((state) => state.isLoading);
export const useHabitError = () => useHabitStore((state) => state.error);
export const useHabitActions = () =>
  useHabitStore((state) => ({
    loadHabits: state.loadHabits,
    loadHabitDetail: state.loadHabitDetail,
    updateHabitCheckIn: state.updateHabitCheckIn,
    updateSingleDateStatus: state.updateSingleDateStatus,
    subscribeToHabitUpdates: state.subscribeToHabitUpdates,
    createHabit: state.createHabit,
    updateHabit: state.updateHabit,
    deleteHabit: state.deleteHabit,
  }));
