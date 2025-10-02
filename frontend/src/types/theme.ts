// 主题配置接口
export interface ThemeConfig {
  key: string;
  name: string;
  primaryColor: string;
  secondaryColor: string; // 主色的浅色近似
  tertiaryColor: string;  // 主色的深色近似
  successColor: string;
  warningColor: string;
  errorColor: string;
  infoColor: string;
  bgColor: string;
  menuBgColor: string;
  textColor: string;
  hoverColor: string;
  menuHoverColor: string; // 菜单悬停颜色
  dateColor: string; // 日期颜色
}

// 自定义主题配置接口
export interface CustomThemeConfig extends ThemeConfig {
  // 用户自定义主题的标识
  isCustom: boolean;
}
