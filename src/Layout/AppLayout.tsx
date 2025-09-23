import Sider from "antd/es/layout/Sider";
import React from "react";
import SidebarNav from "./SidebarNav";

import { Layout, ConfigProvider } from "antd";

import ThemeSwitcher from "../components/ThemeSwitcher"; // 导入主题切换组件
import { useThemeStore } from "@/store/themeStore"; // 导入主题状态管理
import { generateAntdThemeConfig } from "@/theme/themeConfig"; // 导入主题配置生成函数
import { Outlet } from "react-router-dom";

/**
 * 应用布局组件
 * 封装了Ant Design的Layout结构，包含侧边栏和主内容区域
 */
export default function AppLayout() {
  const { currentTheme } = useThemeStore(); // 获取当前主题

  // 使用提取的函数生成Ant Design的Design Token配置
  const themeConfig = generateAntdThemeConfig(currentTheme);

  // 主题切换器容器样式
  const themeSwitcherContainerStyle: React.CSSProperties = {
    position: "absolute",
    top: "16px",
    right: "16px",
    zIndex: 1000,
  };

  return (
    <ConfigProvider theme={themeConfig}>
      <Layout className="w-100 h-100">
        {/* 主题切换器 - 不修改原有结构，只添加新的组件 */}
        <div style={themeSwitcherContainerStyle}>
          <ThemeSwitcher />
        </div>

        <Sider collapsed={true} width="4%">
          {/* 使用侧边栏导航组件 */}
          <SidebarNav />
        </Sider>
        <Layout className={"overflow-y-auto"}>
          {/* 使用Outlet组件显示子路由内容 */}
          <Outlet />
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
