import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/currentCSS.css";
import "@ant-design/v5-patch-for-react-19";
import { App, ConfigProvider } from "antd";
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AntdStaticHolder } from "./utils/antdStatic";
import { initializeTheme, useThemeStore } from "./store/themeStore";
import { AppRouter } from "./routes";

// 初始化主题
initializeTheme();

// 创建一个包装组件，用于获取主题配置并应用到ConfigProvider
const AppWithTheme: React.FC = () => {
  const { getAntdTheme } = useThemeStore();

  return (
    <ConfigProvider theme={getAntdTheme()}>
      <App className={"w-100 h-100"}>
        <AntdStaticHolder />
        <AppRouter />
      </App>
    </ConfigProvider>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWithTheme />
  </StrictMode>,
);
