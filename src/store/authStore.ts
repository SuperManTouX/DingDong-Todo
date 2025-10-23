import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getUserInfo,
} from "../services/authService";
import sseService from "../services/sseService";
import { devtools } from "zustand/middleware";
import { useTodoStore } from "./index";

interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  nickname?: string;
}
interface AvatarInfo {
  fileName: string;
  objectKey: string;
  url: string;
  createdAt: string;
  fileSize: number;
}

interface AuthState {
  user: User | null;
  userId: string;
  isAuthenticated: boolean;
  isLoading: boolean; // 添加加载状态
  avatarHistory: AvatarInfo[]; // 历史头像列表
  login: (username: string, password: string) => Promise<void>;
  register: ({
    username,
    email,
    password,
    code,
    nickname,
  }: {
    username: string;
    email: string;
    password: string;
    code: string;
    nickname?: string;
  }) => Promise<{
    id: string;
    username: string;
    email: string;
    nickname?: string;
  }>;
  logout: () => void;
  loadUserInfo: () => Promise<void>;
}

// 添加调试信息，查看store初始化时的状态
const initialState = {
  user: null,
  userId: "",
  isAuthenticated: false,
  isLoading: true, // 初始为加载中
  avatarHistory: [], // 初始历史头像为空数组
};

export const useAuthStore = create<AuthState>()(
  devtools(
    // persist(
    (set, get) => ({
      ...initialState,

      login: async (username: string, password: string) => {
        try {
          const response = await apiLogin({ username, password });
          const newState = {
            user: response.user,
            userId: response.user.id,
            isAuthenticated: true,
            isLoading: false,
          };
          set(newState);
          // 登录成功后建立SSE连接，连接成功后会自动订阅所有事件
          sseService.connect();
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "登录失败";
          set({ isLoading: false });
          throw new Error(errorMessage);
        }
      },

      register: async ({
        username,
        email,
        password,
        code,
        nickname,
      }: {
        username: string;
        email: string;
        password: string;
        code: string;
        nickname?: string;
      }) => {
        try {
          const response = await apiRegister({
            username,
            email,
            password,
            code,
            nickname,
          });

          // 恢复状态更新逻辑
          const newState = {
            user: response.user,
            userId: response.user.id,
            isAuthenticated: true,
            isLoading: false,
          };
          set(newState);

          // 注册成功后建立SSE连接，连接成功后会自动订阅所有事件
          sseService.connect();

          return response.user;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "注册失败";
          set({ isLoading: false });
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
            userId: "",
          };
          set(newState);

          // 登出时断开SSE连接（disconnect方法会清除所有订阅）
          console.log("登出，断开SSE连接");
          sseService.disconnect();
        }
      },

      loadUserInfo: async () => {
        try {
          set({ isLoading: true }); // 开始加载
          const userInfo = await getUserInfo();
          const newState = {
            user: userInfo.user,
            userId: userInfo.user.id,
            avatarHistory: userInfo.avatarHistory,
            isAuthenticated: true,
            isLoading: false, // 加载完成
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
          set({
            user: null,
            isAuthenticated: false,
            userId: "",
            isLoading: false,
          }); // 加载失败
        }
      },
    }),

    {
      name: "AuthStore",
    },
  ),
);
