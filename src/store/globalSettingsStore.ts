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
  // 是否为移动端视图
  isMobile: boolean;
  // 菜单栏是否收起
  collapsed: boolean;

  // 设置方法
  setShowTaskDetails: (show: boolean) => void;
  setHideCompletedTasks: (hide: boolean) => void;
  setIsTodoDrawerOpen: (open: boolean) => void;
  setIsMobile: (isMobile: boolean) => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleShowTaskDetails: () => void;
  toggleHideCompletedTasks: () => void;
  toggleTodoDrawer: () => void;
  toggleCollapsed: () => void;
}

// 定义响应式阈值
const MOBILE_BREAKPOINT = 960;

// 创建全局设置store
export const useGlobalSettingsStore = create<GlobalSettingsState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      showTaskDetails: true, // 默认显示详情
      hideCompletedTasks: false, // 默认不隐藏已完成任务
      isTodoDrawerOpen: false, // 默认关闭编辑抽屉
      isMobile: window.innerWidth <= MOBILE_BREAKPOINT, // 初始判断是否为移动端
      collapsed: false, // 默认展开菜单栏

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

      // 设置移动端状态
      setIsMobile: (isMobile: boolean) => {
        set({ isMobile });
      },

      // 设置菜单栏收起状态
      setCollapsed: (collapsed: boolean) => {
        set({ collapsed });
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

      // 切换菜单栏收起状态
      toggleCollapsed: () => {
        const current = get().collapsed;
        set({ collapsed: !current });
      },
    }),
    { name: "GlobalSettingsStore" },
  ),
);

// 在应用启动时添加响应式监听
export const initializeResponsiveListener = () => {
  // 检查屏幕宽度并设置状态的函数
  const checkScreenWidth = () => {
    const screenWidth = window.innerWidth;
    const isMobile = screenWidth <= MOBILE_BREAKPOINT;
    console.log(isMobile);
    // 使用store的setIsMobile方法更新状态
    useGlobalSettingsStore.getState().setIsMobile(isMobile);
  };

  // 初始化时检查一次
  checkScreenWidth();

  // 添加resize事件监听器
  window.addEventListener("resize", checkScreenWidth);

  // 返回清理函数
  return () => {
    window.removeEventListener("resize", checkScreenWidth);
  };
};
