// 主题配置接口
export interface ThemeConfig {
  key: string;
  name: string;
  primaryColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  infoColor: string;
  bgColor: string;
  textColor: string;
  hoverColor: string;
}

// 自定义主题配置接口
export interface CustomThemeConfig extends ThemeConfig {
  // 用户自定义主题的标识
  isCustom: boolean;
}
