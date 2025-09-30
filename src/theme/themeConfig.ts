import type { ThemeConfig } from "@/types/theme";

// 浅色主题配置
export const lightTheme: ThemeConfig = {
  key: "light",
  name: "浅色主题",
  primaryColor: "#1890ff",
  secondaryColor: "#40a9ff", // 主色的浅色近似
  tertiaryColor: "#096dd9", // 主色的深色近似
  successColor: "#52c41a",
  warningColor: "#faad14",
  errorColor: "#f5222d",
  infoColor: "#1890ff",
  bgColor: "#ffffff", // 更浅的背景色，接近白色
  menuBgColor: "#f0f0f0", // 加深的菜单背景色
  textColor: "#333333",
  hoverColor: "#1890ff4d", // 主色调的浅色版本 (0.3透明度)
  dateColor: "#1890ff", // 使用主题色
};

// 深色主题配置
export const darkTheme: ThemeConfig = {
  key: "dark",
  name: "深色主题",
  primaryColor: "#177ddc",
  secondaryColor: "#4096ff", // 主色的浅色近似
  tertiaryColor: "#0050b3", // 主色的深色近似
  successColor: "#4eb583",
  warningColor: "#faad14",
  errorColor: "#ff4d4f",
  infoColor: "#177ddc",
  bgColor: "#1e1e1e", // 更浅的深色背景
  menuBgColor: "#050505", // 加深的菜单背景色
  textColor: "#ffffff",
  hoverColor: "#177ddc4d", // 主色调的深色版本 (0.3透明度)
  dateColor: "#177ddc", // 使用主题色
};

// 绿色主题配置
export const greenTheme: ThemeConfig = {
  key: "green",
  name: "绿色主题",
  primaryColor: "#3DC9AA", // 主色调 - 绿色(RGB:61,201,170)
  secondaryColor: "#66D4BB", // 主色的浅色近似
  tertiaryColor: "#2A9E86", // 主色的深色近似
  successColor: "#3DC9AA", // 成功色 - 绿色(RGB:61,201,170)
  warningColor: "#eab308", // 警告色 - 黄色
  errorColor: "#ef4444", // 错误色 - 红色
  infoColor: "#22d3ee", // 信息色 - 青色
  bgColor: "#edf1ec", // 更浅的背景色
  menuBgColor: "#bcf5e4", // 加深的菜单背景色
  textColor: "#1e293b", // 文本色 - 深灰色
  hoverColor: "#3DC9AA4D", // 主色调的浅色透明版本 (0.30透明度)
  dateColor: "#3DC9AA", // 使用主题色
};

// 红色主题配置
export const redTheme: ThemeConfig = {
  key: "red",
  name: "红色主题",
  primaryColor: "#ef4444", // 主色调 - 红色
  secondaryColor: "#f87171", // 主色的浅色近似
  tertiaryColor: "#b91c1c", // 主色的深色近似
  successColor: "#22c55e", // 成功色 - 绿色
  warningColor: "#f59e0b", // 警告色 - 琥珀色
  errorColor: "#dc2626", // 错误色 - 深红色
  infoColor: "#3b82f6", // 信息色 - 蓝色
  bgColor: "#fff1f2", // 更浅的背景色
  menuBgColor: "#fecaca", // 加深的菜单背景色
  textColor: "#374151", // 文本色 - 深灰色
  hoverColor: "#ef44444d", // 主色调的浅色版本 (0.30透明度)
  dateColor: "#3b82f6", // 红色主题使用蓝色
};

// 所有可用主题
export const AVAILABLE_THEMES: ThemeConfig[] = [
  lightTheme,
  darkTheme,
  greenTheme,
  redTheme,
];

// 根据主题ID获取主题配置
export const getThemeById = (themeId: string): ThemeConfig | undefined => {
  return AVAILABLE_THEMES.find((theme) => theme.key === themeId);
};

// 根据当前主题生成Ant Design的Design Token配置
export const generateAntdThemeConfig = (currentTheme: ThemeConfig) => {
  return {
    token: {
      colorPrimary: currentTheme.primaryColor || "#1890ff",
      colorSuccess: currentTheme.successColor || "#52c41a",
      colorWarning: currentTheme.warningColor || "#faad14",
      colorError: currentTheme.errorColor || "#f5222d",
      colorInfo: currentTheme.infoColor || "#1890ff",
      colorBgBase: currentTheme.bgColor || "#ffffff",
      colorTextBase: currentTheme.textColor || "#333333",
    },
    components: {
      Select: {
        colorPrimary: currentTheme.primaryColor || "#1890ff",
        controlItemBgActive: currentTheme.bgColor || "#ffffff",
        controlItemBgHover:
          currentTheme.hoverColor || "rgba(24, 144, 255, 0.08)",
      },
      Input: {
        colorBgContainer: "transparent",
        controlItemBgActive: "transparent",
        controlItemBgHover: "transparent",
        controlItemBgFocus: "transparent",
        activeBg: "transparent",
        hoverBg: "transparent",
      },
      Menu: {
        colorPrimary: currentTheme.primaryColor || "#1890ff",
        itemColor: currentTheme.textColor || "#333333",
        itemHoverColor: currentTheme.textColor || "#1890ff",
        itemHoverBg: currentTheme.hoverColor,
        itemSelectedBg: currentTheme.hoverColor,
        itemSelectedColor: currentTheme.textColor,
        subMenuItemColor: currentTheme.textColor || "#333333",
        subMenuItemHoverColor: currentTheme.primaryColor || "#1890ff",
        subMenuItemHoverBg: currentTheme.hoverColor,
      },
      DatePicker: {
        activeBg: "transparent",
      },
    },
  };
};
