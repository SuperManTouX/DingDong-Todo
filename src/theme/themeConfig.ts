import type { ThemeConfig } from "@/types/theme";

// 浅色主题配置 - 现代简约风格，降低视觉疲劳
export const lightTheme: ThemeConfig = {
  key: "light",
  name: "浅色主题",
  primaryColor: "#3b82f6", // 现代蓝色，更柔和舒适
  infoColor: "#6366f1", // 紫色调，区分信息提示
  menuBgColor: "#f3f4f6", // 稍深灰色菜单背景
  textColor: "#1f2937", // 深灰色文本，提高可读性
  hoverColor: "#3b82f620", // 主色调的更浅色透明版本
  menuHoverColor: "#dbeafe", // 菜单悬停颜色，与主色调呼应
  bgLayoutColor: "#f3f4f6",
  dateColor: "#3b82f6", // 使用主色调
};

// 深色主题配置 - 改善对比度和层次感 不要删除，会变全黑（我也不知道为什么）
export const darkTheme: ThemeConfig = {
  key: "dark",
  name: "深色主题",
  primaryColor: "#60a5fa", // 亮蓝色主色调，在深色背景中更突出
  infoColor: "#818cf8", // 浅紫色，区分信息提示
  bgLayoutColor: "#111827", // 深石板灰色，比纯黑更护眼
  bgContainerColor: "#111827",
  menuBgColor: "#1f2937", // 稍浅灰色菜单背景，创建层次
  textColor: "#f9fafb", // 近白色文本，提高可读性
  hoverColor: "#60a5fa20", // 主色调的更浅色透明版本
  menuHoverColor: "#1e40af", // 菜单悬停颜色，加深版本
  dateColor: "#60a5fa", // 使用主色调
};

// 绿色主题配置 - 采用自然和谐的绿色系
export const greenTheme: ThemeConfig = {
  key: "green",
  name: "自然绿主题",
  primaryColor: "#a3b899", // 主色调 - 自然绿色
  infoColor: "#a3b899", // 信息色 - 紫色
  bgLayoutColor: "#f8faf8", // 信息色 - 紫色
  textColor: "#1e293b", // 文本色 - 深灰色
  hoverColor: "rgba(227,232,215,0.55)", // 主色调的更浅色透明版本
  menuBgColor: "rgb(228,233,223)", // 主色调的更浅色透明版本
  menuHoverColor: "rgb(217,224,211)", // 主色调的更浅色透明版本
  dateColor: "#a3b899", // 使用主题色
}; // 绿色主题配置 - 采用自然和谐的绿色系
export const yellowTheme: ThemeConfig = {
  key: "yellow",
  name: "温暖黄主题",
  primaryColor: "rgb(243,192,107)", // 主色调 - 温暖黄色
  infoColor: "rgb(243,192,107)", // 信息色 - 与主色一致
  menuBgColor: "rgb(252,240,219)", // 加深的菜单背景色
  bgLayoutColor: "rgb(254,252,247)", // 布局背景色
  textColor: "#1e293b", // 文本色 - 深灰色
  hoverColor: "rgba(253,244,234,0.55)", // 主色调的更浅色透明版本
  menuHoverColor: "rgb(250,229,205)", // 主色调的更浅色透明版本
  dateColor: "rgb(243,192,107)", // 使用主题色
  gradientColor:
    "linear-gradient(to bottom, rgb(243,194,104), rgb(244,170,139))",
  listGradientColor:
    "linear-gradient(to bottom, rgb(252,240,218), rgb(252,234,227))",
};

// 红色主题配置 - 改进为更温暖、不刺眼的红色系
export const redTheme: ThemeConfig = {
  key: "red",
  name: "活力红主题",
  primaryColor: "#C46A9F", // 现代粉红色，更柔和
  infoColor: "#C46A9F", // 信息色 - 蓝色
  bgLayoutColor: "rgb(255,248,250)", // 信息色 - 蓝色
  textColor: "#374151", // 文本色 - 深灰色
  hoverColor: "#ec489920", // 主色调的更浅色版本
  menuBgColor: "rgb(228,233,223)", // 主色调的更浅色透明版本
  menuHoverColor: "rgb(254,208,218)", // 主色调的更浅色透明版本
  dateColor: "#60a5fa", // 使用主色调
  gradientColor:
    "linear-gradient(to bottom, rgb(255,121,164), rgb(255,175,166))", // 粉色渐变
  listGradientColor:
    "linear-gradient(to bottom, rgb(255,222,233), rgb(255,236,233))", // 浅色粉色渐变
};

// 所有可用主题
export const AVAILABLE_THEMES: ThemeConfig[] = [
  lightTheme,
  darkTheme,
  greenTheme,
  redTheme,
  yellowTheme,
];

// 根据主题ID获取主题配置
export const getThemeById = (themeId: string): ThemeConfig | undefined => {
  return AVAILABLE_THEMES.find((theme) => theme.key === themeId);
};

// 根据当前主题生成Ant Design的Design Token配置
export const generateAntdThemeConfig = (currentTheme: ThemeConfig) => {
  return {
    token: {
      colorPrimary: currentTheme.primaryColor,
      colorInfo: currentTheme.infoColor,
      colorTextBase: currentTheme.textColor,
      colorBgLayout: currentTheme.bgLayoutColor,
      colorBgContainer: currentTheme.bgContainerColor || "#ffffff",
    },
    components: {
      Select: {
        colorPrimary: currentTheme.primaryColor,
        controlItemBgHover: currentTheme.hoverColor,
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
        itemBg: currentTheme.menuBgColor,
        itemSelectedBg: currentTheme.menuHoverColor,
        itemSelectedColor: currentTheme.textColor,
      },

      DatePicker: {
        activeBg: "transparent",
      },
      Table: {
        colorBgContainer: currentTheme.bgLayoutColor,
      },
    },
  };
};
