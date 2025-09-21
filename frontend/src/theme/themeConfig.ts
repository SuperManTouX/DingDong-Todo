import { ThemeConfig } from "@/types/theme";

// 浅色主题配置
export const lightTheme: ThemeConfig = {
  key: "light",
  name: "浅色主题",
  primaryColor: "#1890ff",
  successColor: "#52c41a",
  warningColor: "#faad14",
  errorColor: "#f5222d",
  infoColor: "#1890ff",
  bgColor: "#ffffff",
  textColor: "#333333",
  hoverColor: "rgba(24, 144, 255, 0.08)", // 主色调的浅色版本
};

// 深色主题配置
export const darkTheme: ThemeConfig = {
  key: "dark",
  name: "深色主题",
  primaryColor: "#177ddc",
  successColor: "#4eb583",
  warningColor: "#faad14",
  errorColor: "#ff4d4f",
  infoColor: "#177ddc",
  bgColor: "#141414",
  textColor: "#ffffff",
  hoverColor: "rgba(23, 125, 220, 0.2)", // 主色调的深色版本
};

// 绿色主题配置
export const greenTheme: ThemeConfig = {
  key: "green",
  name: "绿色主题",
  primaryColor: "#22c55e", // 主色调 - 绿色
  successColor: "#4ade80", // 成功色 - 浅绿色
  warningColor: "#eab308", // 警告色 - 黄色
  errorColor: "#ef4444", // 错误色 - 红色
  infoColor: "#22d3ee", // 信息色 - 青色
  bgColor: "#f8fafc", // 背景色 - 浅灰色
  textColor: "#1e293b", // 文本色 - 深灰色
  hoverColor: "rgba(34, 197, 94, 0.08)", // 主色调的浅色版本
};

// 所有可用主题
export const AVAILABLE_THEMES: ThemeConfig[] = [
  lightTheme,
  darkTheme,
  greenTheme,
];

// 根据主题ID获取主题配置
export const getThemeById = (themeId: string): ThemeConfig | undefined => {
  return AVAILABLE_THEMES.find((theme) => theme.key === themeId);
};

// 根据当前主题生成Ant Design的Design Token配置
export const generateAntdThemeConfig = (currentTheme: ThemeConfig) => {
  return {
    token: {
      colorPrimary: currentTheme.primaryColor || '#1890ff',
      colorSuccess: currentTheme.successColor || '#52c41a',
      colorWarning: currentTheme.warningColor || '#faad14',
      colorError: currentTheme.errorColor || '#f5222d',
      colorInfo: currentTheme.infoColor || '#1890ff',
      colorBgBase: currentTheme.bgColor || '#ffffff',
      colorTextBase: currentTheme.textColor || '#333333',
    },
    components: {
      Select: {
        colorPrimary: currentTheme.primaryColor || '#1890ff',
        controlItemBgActive: currentTheme.bgColor || '#ffffff',
        controlItemBgHover: currentTheme.hoverColor || 'rgba(24, 144, 255, 0.08)',
      },
      Menu: {
        colorPrimary: currentTheme.primaryColor || '#1890ff',
        itemColor: currentTheme.textColor || '#333333',
        itemHoverColor: currentTheme.primaryColor || '#1890ff',
        itemHoverBg: currentTheme.hoverColor,
        itemSelectedBg: currentTheme.hoverColor,
        subMenuItemBg: currentTheme.bgColor || '#ffffff',
        subMenuItemColor: currentTheme.textColor || '#333333',
        subMenuItemHoverColor: currentTheme.primaryColor || '#1890ff',
        subMenuItemHoverBg: currentTheme.hoverColor,
      },
    },
  };
};
