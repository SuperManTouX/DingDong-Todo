import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/currentCSS.css";
import "@ant-design/v5-patch-for-react-19";
import { App, ConfigProvider } from "antd";
import React, { StrictMode, useEffect, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import { AntdStaticHolder } from "./utils/antdStatic";
import { initializeTheme, useThemeStore } from "./store/themeStore";
import { AppRouter } from "./routes";
import { useAuthStore } from "./store/authStore";
import { HotkeysProvider } from "react-hotkeys-hook";
import {
  initializeResponsiveListener,
  useGlobalSettingsStore,
} from "./store/globalSettingsStore";
import { websocketService } from "./services/websocketService";

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

  // 用户ID变化时，初始化或断开WebSocket连接
  const userId = useAuthStore((state) => state.userId);
  useEffect(() => {
    if (userId) {
      console.log(`初始化 WebSocket 连接，用户ID: ${userId}`);
      websocketService.connect(userId);
    }

    return () => {
      // 组件卸载或用户ID变化时断开连接
      websocketService.disconnect();
    };
  }, [userId]);

  // 防抖函数
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  // 初始化响应式监听器（带防抖）
  useEffect(() => {
    const cleanup = initializeResponsiveListener();
    return cleanup;
  }, []);
  const { isMobile, setCollapsed } = useGlobalSettingsStore();

  // 创建防抖版本的setCollapsed
  const debouncedSetCollapsed = useRef(
    debounce((value: boolean) => {
      setCollapsed(value);
    }, 200), // 200ms的延迟
  ).current;

  //若响应式模式变化
  useEffect(() => {
    debouncedSetCollapsed(isMobile);
  }, [isMobile, debouncedSetCollapsed]);

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
  </StrictMode>,
);
