import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ThemeConfig, CustomThemeConfig } from "@/types/theme";
import { theme } from "antd";
import {
  AVAILABLE_THEMES,
  getThemeById,
  lightTheme,
  darkTheme,
} from "@/theme/themeConfig";
import {
  applyThemeToDocument,
  getSystemThemePreference,
} from "@/theme/themeUtils";

// 主题存储接口
interface ThemeStore {
  currentTheme: ThemeConfig;
  customThemes: CustomThemeConfig[];
  setTheme: (themeKey: string) => void;
  saveCustomTheme: (
    customTheme: Omit<CustomThemeConfig, "key" | "isCustom">,
  ) => string;
  deleteCustomTheme: (themeKey: string) => void;
  exportThemeConfig: (themeKey: string) => string | null;
  importThemeConfig: (encodedConfig: string) => string | null;

  // 将主题配置转换为Ant Design的theme格式
  getAntdTheme: () => { token: Record<string, string> };
}

// 创建主题存储
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // 初始化时根据系统主题偏好设置主题
      currentTheme: getThemeById(getSystemThemePreference()) || lightTheme,
      customThemes: [],

      // 设置主题
      setTheme: (themeKey: string) => {
        // 首先在内置主题中查找
        let theme = getThemeById(themeKey);

        // 如果内置主题中没有找到，则在自定义主题中查找
        if (!theme) {
          const { customThemes } = get();
          theme = customThemes.find((t) => t.key === themeKey);
        }

        // 如果找到了主题，则应用主题
        if (theme) {
          set({ currentTheme: theme });
          applyThemeToDocument(theme);
        }
      },

      // 将当前主题配置转换为Ant Design的theme格式
      getAntdTheme: () => {
        const { currentTheme } = get();
        return {
          token: {
            colorPrimary: currentTheme.primaryColor,
            colorInfo: currentTheme.infoColor,
            colorTextBase: currentTheme.textColor,
            // 可以根据需要添加更多的Ant Design主题token
          },
          algorithm:
            currentTheme.key === "dark" ? theme.darkAlgorithm : undefined,
        };
      },

      // 以下是已有的其他方法

      // 保存自定义主题
      saveCustomTheme: (
        customTheme: Omit<CustomThemeConfig, "key" | "isCustom">,
      ) => {
        const newKey = `custom-${Date.now()}`;
        const theme: CustomThemeConfig = {
          ...customTheme,
          key: newKey,
          name:
            customTheme.name || `自定义主题 ${new Date().toLocaleDateString()}`,
          isCustom: true,
        };

        set((state) => ({
          customThemes: [...state.customThemes, theme],
        }));

        return newKey;
      },

      // 删除自定义主题
      deleteCustomTheme: (themeKey: string) => {
        set((state) => ({
          customThemes: state.customThemes.filter(
            (theme) => theme.key !== themeKey,
          ),
        }));
      },

      // 导出主题配置
      exportThemeConfig: (themeKey: string) => {
        const theme = getThemeById(themeKey);
        if (!theme) return null;

        // 创建可分享的主题配置对象
        const shareableConfig = {
          version: "1.0",
          createdAt: new Date().toISOString(),
          theme: {
            name: theme.name,
            colors: {
              primary: theme.primaryColor,
              success: theme.successColor,
              warning: theme.warningColor,
              error: theme.errorColor,
              info: theme.infoColor,
              bg: theme.bgColor,
              text: theme.textColor,
            },
          },
        };

        // 转换为Base64编码的字符串，方便分享
        const encoded = btoa(JSON.stringify(shareableConfig));
        const shareUrl = `${window.location.origin}${window.location.pathname}?theme=${encoded}`;

        return shareUrl;
      },

      // 导入主题配置
      importThemeConfig: (encodedConfig: string) => {
        try {
          const configStr = atob(encodedConfig);
          const config = JSON.parse(configStr);

          // 验证配置格式
          if (!config.theme || !config.theme.colors) {
            throw new Error("无效的主题配置格式");
          }

          // 创建新的自定义主题
          const newTheme: CustomThemeConfig = {
            key: `imported-${Date.now()}`,
            name:
              config.theme.name ||
              `导入主题 ${new Date().toLocaleDateString()}`,
            primaryColor: config.theme.colors.primary,
            successColor: config.theme.colors.success,
            warningColor: config.theme.colors.warning,
            errorColor: config.theme.colors.error,
            infoColor: config.theme.colors.info,
            bgColor: config.theme.colors.bg,
            textColor: config.theme.colors.text,
            isCustom: true,
          };

          // 保存导入的主题
          set((state) => ({
            customThemes: [...state.customThemes, newTheme],
          }));

          return newTheme.key;
        } catch (error) {
          console.error("导入主题失败:", error);
          return null;
        }
      },
    }),
    {
      name: "theme-storage", // 存储键名
      partialize: (state) => ({
        currentTheme: state.currentTheme,
        customThemes: state.customThemes,
      }), // 只持久化需要的数据
      onRehydrateStorage: (state) => {
        // 当从存储中恢复状态时，应用主题
        if (state) {
          applyThemeToDocument(state.currentTheme);
        }
      },
    },
  ),
);

// 初始化主题
export const initializeTheme = (): void => {
  const themeStore = useThemeStore.getState();
  applyThemeToDocument(themeStore.currentTheme);
};
