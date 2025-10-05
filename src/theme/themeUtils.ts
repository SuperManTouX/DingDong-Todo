import type { ThemeConfig } from "@/types/theme";
import { lightTheme, darkTheme, greenTheme, redTheme, yellowTheme } from "./themeConfig";

// 主题映射
const themeMap: Record<string, ThemeConfig> = {
  light: lightTheme,
  dark: darkTheme,
  green: greenTheme,
  red: redTheme,
  yellow: yellowTheme,
};

/**
 * 将主题配置应用到HTML文档
 * @param theme 主题配置对象
 */
export const applyThemeToDocument = (theme: ThemeConfig): void => {
  const root = document.documentElement;
  
  // 遍历主题的所有属性
  Object.entries(theme).forEach(([key, value]) => {
    // 跳过key, name等非颜色属性
    if (key !== 'key' && key !== 'name') {
      // 设置CSS变量
      root.style.setProperty(`--theme-${key}`, String(value));
    }
  });
  
  // 设置data-theme属性，方便CSS选择器使用
  root.setAttribute("data-theme", theme.key);
};

/**
 * 获取当前系统的主题偏好
 * @returns 'dark' 或 'light'
 */
export const getSystemThemePreference = (): "dark" | "light" => {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
};

/**
 * 监听系统主题变化
 * @param callback 系统主题变化时的回调函数
 * @returns 清理函数，用于移除事件监听
 */
export const listenForThemeChanges = (
  callback: (theme: "dark" | "light") => void
): (() => void) => {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handleChange = (e: MediaQueryListEvent) => {
    callback(e.matches ? "dark" : "light");
  };

  mediaQuery.addEventListener("change", handleChange);

  // 返回清理函数
  return () => {
    mediaQuery.removeEventListener("change", handleChange);
  };
};

/**
 * 将主题配置转换为Ant Design主题配置
 * @param theme 主题配置对象
 * @returns Ant Design主题配置对象
 */
export const convertToAntdTheme = (
  themeConfig: ThemeConfig
) => {
  return {
    token: {
      colorPrimary: themeConfig.primaryColor,
      colorSuccess: themeConfig.successColor,
      colorWarning: themeConfig.warningColor,
      colorError: themeConfig.errorColor,
      colorInfo: themeConfig.infoColor,
      colorBgBase: themeConfig.bgColor,
      colorBgLayout: themeConfig.bgLayoutColor,
      colorTextBase: themeConfig.textColor,
    },
  };
};

// 所有可用的主题
export const allThemes = [lightTheme, darkTheme, greenTheme, redTheme, yellowTheme];

// 导出主题配置
export { lightTheme, darkTheme, greenTheme, redTheme, yellowTheme };

// 根据主题ID获取主题配置
export const getThemeConfig = (themeId: string): ThemeConfig | undefined => {
  return themeMap[themeId];
};
