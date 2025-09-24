import api from './api';

import api from "./api";

interface LoginParams {
  username: string;
  password: string;
}

interface RegisterParams {
  username: string;
  email: string;
  password: string;
}

interface UserInfo {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  access_token: string;
  user: UserInfo;
}

// 用户登录
export const login = async (params: LoginParams): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/login', params);
    // 保存token到本地存储
    if (response.access_token) {
      localStorage.setItem('token', response.access_token);
    }
    return response;
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
};

// 用户注册
export const register = async (params: RegisterParams): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/register', params);
    // 保存token到本地存储
    if (response.access_token) {
      localStorage.setItem('token', response.access_token);
    }
    return response;
  } catch (error) {
    console.error('注册失败:', error);
    throw error;
  }
};

// 获取用户信息
export const getUserInfo = async (): Promise<UserInfo> => {
  try {
    const response = await api.get('/auth/profile');
    return response;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    throw error;
  }
};

// 用户登出
export const logout = async (): Promise<void> => {
  try {
    // 清除本地存储的token
    localStorage.removeItem('token');
    // 可以在这里添加其他清理操作，如清除用户信息等
    // 跳转到登录页
    window.location.href = '/login';
  } catch (error) {
    console.error('登出处理失败:', error);
    // 即使出错，也清除本地token
    localStorage.removeItem('token');
  }
};