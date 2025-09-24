import { create } from "zustand";
import { persist } from "zustand/middleware";
import { login as apiLogin, register as apiRegister, logout as apiLogout, getUserInfo } from "../services/authService";

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
  ) => Promise<void>;
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
