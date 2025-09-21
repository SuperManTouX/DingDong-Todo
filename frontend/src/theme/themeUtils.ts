import type { ThemeConfig } from "@/types/theme";

/**
 * 将主题配置应用到HTML文档
 * @param theme 主题配置对象
 */
export const applyThemeToDocument = (theme: ThemeConfig): void => {
  const root = document.documentElement;

  // 批量更新CSS变量，减少重排重绘次数
  const cssVars: Record<string, string> = {};
  Object.entries(theme).forEach(([key, value]) => {
    if (typeof value === "string" && key !== "key" && key !== "name") {
      cssVars[`--theme-${key}`] = value;
    }
  });

  // 使用CSS变量的批量更新方法
  Object.entries(cssVars).forEach(([name, value]) => {
    root.style.setProperty(name, value);
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
export const setupSystemThemeListener = (
  callback: (theme: "dark" | "light") => void,
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
  theme: ThemeConfig,
): Record<string, string> => {
  return {
    token: {
      colorPrimary: theme.primaryColor,
      colorSuccess: theme.successColor,
      colorWarning: theme.warningColor,
      colorError: theme.errorColor,
      colorInfo: theme.infoColor,
      colorBgBase: theme.bgColor,
      colorTextBase: theme.textColor,
    },
  };
};
