import { create } from "zustand";
import { persist } from "zustand/middleware";
import { login as apiLogin, register as apiRegister, logout as apiLogout, getUserInfo } from "../services/authService";
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
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<{ id: string; username: string; email: string }>;
  logout: () => void;
  loadUserInfo: () => Promise<void>;
}

// 保存订阅的取消函数
let unsubscribeTagUpdates: (() => void) | null = null;
let unsubscribeListUpdates: (() => void) | null = null;
let unsubscribeTodoUpdates: (() => void) | null = null;

// 取消所有订阅的辅助函数
const unsubscribeAllEvents = () => {
  // 使用新的clearSubscriptionsByType方法清理所有订阅
  sseService.clearSubscriptionsByType("tagUpdate");
  sseService.clearSubscriptionsByType("listUpdate");
  sseService.clearSubscriptionsByType("todoUpdate");
  
  // 同时调用保存的取消订阅函数作为双重保障
  if (unsubscribeTagUpdates) {
    unsubscribeTagUpdates();
    unsubscribeTagUpdates = null;
  }
  if (unsubscribeListUpdates) {
    unsubscribeListUpdates();
    unsubscribeListUpdates = null;
  }
  if (unsubscribeTodoUpdates) {
    unsubscribeTodoUpdates();
    unsubscribeTodoUpdates = null;
  }
};

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
          });
          console.log(response);
          // 登录成功后建立SSE连接并订阅所有事件
          console.log("登录成功，建立SSE连接并订阅事件");
          
          // 先取消可能存在的旧订阅
          unsubscribeAllEvents();
          
          sseService.connect();
          // 订阅所有必要的事件，并保存取消订阅函数
          unsubscribeTagUpdates = useTodoStore.getState().subscribeToTagUpdates();
          unsubscribeListUpdates = useTodoStore.getState().subscribeToListUpdates();
          unsubscribeTodoUpdates = useTodoStore.getState().subscribeToTodoUpdates();
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
          // 注册成功后建立SSE连接并订阅所有事件
          console.log("注册成功，建立SSE连接并订阅事件");
          
          // 先取消可能存在的旧订阅
          unsubscribeAllEvents();
          
          sseService.connect();
          // 订阅所有必要的事件，并保存取消订阅函数
          unsubscribeTagUpdates = useTodoStore.getState().subscribeToTagUpdates();
          unsubscribeListUpdates = useTodoStore.getState().subscribeToListUpdates();
          unsubscribeTodoUpdates = useTodoStore.getState().subscribeToTodoUpdates();
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
          // 登出时断开SSE连接并取消所有订阅
          console.log("登出，断开SSE连接并取消订阅");
          unsubscribeAllEvents();
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
          // 加载用户信息成功后，如果有token，建立SSE连接并订阅事件
          const token = localStorage.getItem("token");
          if (token) {
            console.log("加载用户信息成功，建立SSE连接并订阅事件");
            
            // 先取消可能存在的旧订阅
            unsubscribeAllEvents();
            
            sseService.connect();
            // 订阅所有必要的事件，并保存取消订阅函数
            unsubscribeTagUpdates = useTodoStore.getState().subscribeToTagUpdates();
            unsubscribeListUpdates = useTodoStore.getState().subscribeToListUpdates();
            unsubscribeTodoUpdates = useTodoStore.getState().subscribeToTodoUpdates();
          }
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
