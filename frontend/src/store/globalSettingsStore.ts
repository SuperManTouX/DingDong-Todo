import { create } from "zustand";
import { devtools } from "zustand/middleware";

// 定义全局设置的状态类型
export interface GlobalSettingsState {
  // 是否显示任务详情
  showTaskDetails: boolean;
  // 是否隐藏已完成任务
  hideCompletedTasks: boolean;
  // 待办编辑抽屉是否打开
  isTodoDrawerOpen: boolean;
  
  // 设置方法
  setShowTaskDetails: (show: boolean) => void;
  setHideCompletedTasks: (hide: boolean) => void;
  setIsTodoDrawerOpen: (open: boolean) => void;
  toggleShowTaskDetails: () => void;
  toggleHideCompletedTasks: () => void;
  toggleTodoDrawer: () => void;
}

// 创建全局设置store
export const useGlobalSettingsStore = create<GlobalSettingsState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      showTaskDetails: true, // 默认显示详情
      hideCompletedTasks: false, // 默认不隐藏已完成任务
      isTodoDrawerOpen: false, // 默认关闭编辑抽屉
      
      // 设置显示详情
      setShowTaskDetails: (show: boolean) => {
        set({ showTaskDetails: show });
      },
      
      // 设置隐藏已完成任务
      setHideCompletedTasks: (hide: boolean) => {
        set({ hideCompletedTasks: hide });
      },
      
      // 设置编辑抽屉状态
      setIsTodoDrawerOpen: (open: boolean) => {
        set({ isTodoDrawerOpen: open });
      },
      
      // 切换显示详情
      toggleShowTaskDetails: () => {
        const current = get().showTaskDetails;
        set({ showTaskDetails: !current });
      },
      
      // 切换隐藏已完成任务
      toggleHideCompletedTasks: () => {
        const current = get().hideCompletedTasks;
        set({ hideCompletedTasks: !current });
      },
      
      // 切换编辑抽屉状态
      toggleTodoDrawer: () => {
        const current = get().isTodoDrawerOpen;
        set({ isTodoDrawerOpen: !current });
      },
    }),
    { name: "GlobalSettingsStore" }
  )
);