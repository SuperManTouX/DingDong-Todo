import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getUserInfo,
} from "../services/authService";
import sseService from "../services/sseService";
import { useTodoStore } from "./index";

interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
}

interface AuthState {
  user: User | null;
  userId: string;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: ({
    username,
    email,
    password,
    code,
  }: {
    username: string;
    email: string;
    password: string;
    code: string;
  }) => Promise<{ id: string; username: string; email: string }>;
  logout: () => void;
  loadUserInfo: () => Promise<void>;
}

// 添加调试信息，查看store初始化时的状态
const initialState = {
  user: null,
  userId: "",
  isAuthenticated: false, // 初始为false，但PrivateRoute已注释重定向
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: async (username: string, password: string) => {
        try {
          const response = await apiLogin({ username, password });
          const newState = {
            user: response.user,
            userId: response.user.id,
            isAuthenticated: true,
          };
          set(newState);
          // 登录成功后建立SSE连接，连接成功后会自动订阅所有事件
          sseService.connect();
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "登录失败";
          throw new Error(errorMessage);
        }
      },

      register: async ({
        username,
        email,
        password,
        code,
      }: {
        username: string;
        email: string;
        password: string;
        code: string;
      }) => {
        try {
          const response = await apiRegister({
            username,
            email,
            password,
            code,
          });

          // 恢复状态更新逻辑
          const newState = {
            user: response.user,
            userId: response.user.id,
            isAuthenticated: true,
          };
          set(newState);

          // 注册成功后建立SSE连接，连接成功后会自动订阅所有事件
          sseService.connect();

          return response.user;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "注册失败";
          throw new Error(errorMessage);
        }
      },

      logout: async () => {
        try {
          await apiLogout();
        } finally {
          const newState = { 
            user: null, 
            isAuthenticated: false, 
            userId: ""
          };
          set(newState);
          
          // 登出时断开SSE连接（disconnect方法会清除所有订阅）
          console.log("登出，断开SSE连接");
          sseService.disconnect();
        }
      },

      loadUserInfo: async () => {
        try {
          const userInfo = await getUserInfo();
          const newState = {
            user: userInfo,
            userId: userInfo.id,
            isAuthenticated: true,
          };

          set(newState);
          // 加载用户信息成功后，如果有token，建立SSE连接，连接成功后会自动订阅所有事件
          const token = localStorage.getItem("token");
          if (token) {
            console.log("加载用户信息成功，建立SSE连接");
            sseService.connect();
          }
        } catch (error) {
          console.error("加载用户信息失败:", error);
          set({ user: null, isAuthenticated: false, userId: "" });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        // 不保存敏感信息到本地存储
        user: null,
        userId: state.userId,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
