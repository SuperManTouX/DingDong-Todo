import { create } from "zustand";
import { persist } from "zustand/middleware";
import usersData from "../data/user.json";

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
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      userId: "",
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        // 从user.json中查找用户
        const foundUser = usersData.find(
          (user) => user.username === username && user.password === password,
        );
        if (foundUser) {
          // 移除密码字段后设置用户信息
          const { password: _, ...userInfo } = foundUser;
          set({ user: userInfo, userId: userInfo.id, isAuthenticated: true });
          return Promise.resolve();
        } else {
          throw new Error("用户名或密码错误");
        }
      },

      register: async (username: string, email: string, password: string) => {
        // 在实际应用中，这里应该调用API进行注册
        // 这里仅作为示例
        if (username && email && password.length >= 6) {
          // 模拟注册成功 - 在实际应用中应该通过API创建用户并获取用户信息（包括头像）
          // 头像可以由服务端生成或允许用户上传
        } else {
          throw new Error("注册信息不完整或不符合要求");
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
    },
  ),
);
