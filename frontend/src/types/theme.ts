// 主题配置接口
export interface ThemeConfig {
  key: string;
  name: string;
  primaryColor: string;
  infoColor: string;
  textColor: string;
  hoverColor: string;
  dateColor: string; // 日期颜色
  menuBgColor: string; // 菜单背景色
  menuHoverColor: string; // 菜单背景色
  bgLayoutColor: string; // 菜单背景色
  gradientColor?: string; //特殊主题才有渐变色
  listGradientColor?: string; //特殊主题才有渐变色
  bgContainerColor?: string; //黑暗主题才有黑色
  accentColor?: string; // 强调色，非深色主题为白色，深色主题为黑色
  inverseAccentColor?: string; // 反强调色，非深色主题为黑色，深色主题为白色
}

// 自定义主题配置接口
export interface CustomThemeConfig extends ThemeConfig {
  // 用户自定义主题的标识
  isCustom: boolean;
}
