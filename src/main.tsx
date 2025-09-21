import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/currentCSS.css";
import "@ant-design/v5-patch-for-react-19";
import { ConfigProvider } from "antd";
import React, { StrictMode } from "react";
// import App from './TicTacToe.tsx'
// import TaskApp from "./TaskApp";
// import NestedList from "./Test";
import AppLayout from "./Layout/AppLayout";
import { initializeTheme, useThemeStore } from "./store/themeStore"; // 导入主题初始化函数和store

// 初始化主题
initializeTheme();

// 创建一个包装组件，用于获取主题配置并应用到ConfigProvider
const AppWithTheme: React.FC = () => {
  const { getAntdTheme } = useThemeStore();

  return (
    <ConfigProvider theme={getAntdTheme()}>
      <AppLayout />
    </ConfigProvider>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWithTheme />
    {/*<NestedList></NestedList>*/}
  </StrictMode>,
);
