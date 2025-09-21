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

// 主题分类枚举
export enum ThemeCategory {
  GENERAL = 'general', // 通用主题
  PROGRAMMING = 'programming', // 编程风格主题
  NATURE = 'nature', // 自然风格主题
  MINIMALIST = 'minimalist', // 极简风格主题
  VIBRANT = 'vibrant', // 鲜艳风格主题
  PASTEL = 'pastel', // 柔和风格主题
  DARK = 'dark', // 深色主题
  LIGHT = 'light' // 浅色主题
}