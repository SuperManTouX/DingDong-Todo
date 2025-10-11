import { create } from "zustand";
import { persist } from "zustand/middleware";
import { login as apiLogin, register as apiRegister, logout as apiLogout, getUserInfo } from "../services/authService";
import sseService from "../services/sseService";

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
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<{ id: string; username: string; email: string }>;
  logout: () => void;
  loadUserInfo: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      userId: "",
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        try {
          const response = await apiLogin({ username, password });
          set({ 
            user: response.user, 
            userId: response.user.id, 
            isAuthenticated: true 
          });console.log(response);
          // 登录成功后建立SSE连接
          console.log("登录成功，建立SSE连接");
          sseService.connect();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "登录失败";
          throw new Error(errorMessage);
        }
      },

      register: async (username: string, email: string, password: string) => {
        try {
          const response = await apiRegister({ username, email, password });
          set({ 
            user: response.user, 
            userId: response.user.id, 
            isAuthenticated: true 
          });
          // 注册成功后建立SSE连接
          console.log("注册成功，建立SSE连接");
          sseService.connect();
          return response.user;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "注册失败";
          throw new Error(errorMessage);
        }
      },

      logout: async () => {
        try {
          await apiLogout();
        } finally {
          set({ user: null, isAuthenticated: false, userId: "" });
          // 登出时断开SSE连接
          console.log("登出，断开SSE连接");
          sseService.disconnect();
        }
      },

      loadUserInfo: async () => {
        try {
          const userInfo = await getUserInfo();
          set({ 
            user: userInfo, 
            userId: userInfo.id, 
            isAuthenticated: true 
          });
        } catch (error) {
          console.error('加载用户信息失败:', error);
          set({ user: null, isAuthenticated: false, userId: "" });
        }
      }
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        // 不保存敏感信息到本地存储
        user: null,
        userId: state.userId,
        isAuthenticated: state.isAuthenticated
      })
    },
  ),
);
