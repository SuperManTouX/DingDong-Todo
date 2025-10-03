import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/currentCSS.css";
import "@ant-design/v5-patch-for-react-19";
import { App, ConfigProvider } from "antd";
import React, { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { AntdStaticHolder } from "./utils/antdStatic";
import { initializeTheme, useThemeStore } from "./store/themeStore";
import { AppRouter } from "./routes";
import { useAuthStore } from "./store/authStore";
import { HotkeysProvider } from "react-hotkeys-hook";
import A from "./Test";
import {
  initializeResponsiveListener,
  useGlobalSettingsStore,
} from "./store/globalSettingsStore";

// 初始化主题
initializeTheme();

// 创建一个包装组件，用于获取主题配置并应用到ConfigProvider
const AppWithTheme: React.FC = () => {
  const { getAntdTheme } = useThemeStore();
  const { loadUserInfo } = useAuthStore();

  // 应用启动时，检查本地是否有token，如果有则自动获取用户信息
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      loadUserInfo();
    }
  }, [loadUserInfo]);

  // 初始化响应式监听器
  useEffect(() => {
    const cleanup = initializeResponsiveListener();
    return cleanup;
  }, []);
  const { isMobile, setCollapsed } = useGlobalSettingsStore();

  //若响应式模式变化
  useEffect(() => {
    setCollapsed(isMobile);
  }, [isMobile]);

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
    <HotkeysProvider>
      <AppWithTheme />
    </HotkeysProvider>
    {/*<A></A>*/}
  </StrictMode>,
);
