import React from "react";
import { Select } from "antd";
import { useThemeStore } from "@/store/themeStore";
import { AVAILABLE_THEMES } from "@/theme/themeConfig";
import type { ThemeConfig } from "@/types/theme";

const ThemeSwitcher: React.FC = () => {
  const { currentTheme, setTheme, customThemes } = useThemeStore();

  // 获取所有可用主题（内置主题 + 自定义主题）并转换为Select的items格式
  const themeItems = React.useMemo(() => {
    const allThemes = [...AVAILABLE_THEMES, ...customThemes];
    return allThemes.map((theme: ThemeConfig) => ({
      label: theme.name,
      value: theme.key,
    }));
  }, [customThemes]);

  // 处理主题变更
  const handleThemeChange = (themeKey: string) => {
    setTheme(themeKey);
  };

  return (
    <div style={{ marginRight: "16px" }}>
      <Select
        value={currentTheme.key}
        onChange={handleThemeChange}
        style={{
          width: 120,
          backgroundColor: "var(--theme-bgColor)",
          color: "var(--theme-textColor)",
        }}
        size="small"
        options={themeItems}
      />
    </div>
  );
};

export default ThemeSwitcher;
