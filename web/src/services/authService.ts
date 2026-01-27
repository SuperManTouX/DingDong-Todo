import api from "./api";
import { message } from "@/utils/antdStatic";

interface LoginParams {
  username: string;
  password: string;
}

interface RegisterParams {
  username: string;
  email: string;
  password: string;
  code: string; // 新增验证码字段
  nickname?: string; // 新增昵称字段
}

interface SendCodeParams {
  email: string;
}

interface UserInfo {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  nickname?: string;
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
    const response = await api.post("/auth/login", params);
    // 保存token到本地存储
    if (response.access_token) {
      localStorage.setItem("token", response.access_token);
    }
    return response;
  } catch (error: any) {
    // 尝试从错误响应中提取message字段
    const errorMessage =
      error.response?.data?.message || error.message || "登录失败";
    console.error("登录失败:", errorMessage);
    // 使用message组件显示错误信息
    message.error(errorMessage);

    // 创建包含原始错误信息的新错误对象并抛出
    const customError = new Error(errorMessage);
    // 保留原始错误的属性（如果有）
    Object.assign(customError, error);
    throw customError;
  }
};

// 发送验证码
export const sendVerificationCode = async (
  params: SendCodeParams,
): Promise<{ message: string }> => {
  try {
    const response = await api.post("/auth/send-code", params);
    return response;
  } catch (error: any) {
    // 尝试从错误响应中提取message字段
    const errorMessage =
      error.response?.data?.message || error.message || "发送验证码失败";
    console.error("发送验证码失败:", errorMessage);
    // 使用message组件显示错误信息
    message.error(errorMessage);

    // 创建包含原始错误信息的新错误对象并抛出
    const customError = new Error(errorMessage);
    // 保留原始错误的属性（如果有）
    Object.assign(customError, error);
    throw customError;
  }
};

// 用户注册
export const register = async (
  params: RegisterParams,
): Promise<AuthResponse> => {
  try {
    const response = await api.post("/auth/register", params);
    // 保存token到本地存储
    if (response.access_token) {
      localStorage.setItem("token", response.access_token);
    }
    return response;
  } catch (error: any) {
    // 尝试从错误响应中提取message字段
    const errorMessage =
      error.response?.data?.message || error.message || "注册失败";
    console.error("注册失败:", errorMessage);
    // 使用message组件显示错误信息
    message.error(errorMessage);

    // 创建包含原始错误信息的新错误对象并抛出
    const customError = new Error(errorMessage);
    // 保留原始错误的属性（如果有）
    Object.assign(customError, error);
    throw customError;
  }
};

// 获取用户信息
export const getUserInfo = async () => {
  try {
    const response = await api.get("/auth/profile");
    return response.data;
  } catch (error: any) {
    // 尝试从错误响应中提取message字段
    const errorMessage =
      error.response?.data?.message || error.message || "获取用户信息失败";
    console.error("获取用户信息失败:", errorMessage);
    // 使用message组件显示错误信息
    message.error(errorMessage);

    // 创建包含原始错误信息的新错误对象并抛出
    const customError = new Error(errorMessage);
    // 保留原始错误的属性（如果有）
    Object.assign(customError, error);
    throw customError;
  }
};

// 用户登出
export const logout = async (): Promise<void> => {
  try {
    // 调用后端logout接口
    await api.post("/auth/logout");
    // 清除本地存储的token
    localStorage.removeItem("token");
    // 可以在这里添加其他清理操作，如清除用户信息等
    // 跳转到登录页
    window.location.href = "/login";
  } catch (error) {
    console.error("登出处理失败:", error);
    // 即使出错，也清除本地token
    localStorage.removeItem("token");
  }
};
