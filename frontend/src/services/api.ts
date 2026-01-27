import axios from "axios";

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3000', // 直接使用后端URL，取消/api路径
  timeout: 10000, // 请求超时时间
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器 - 添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // 统一错误处理
    if (error.response?.status === 401) {
      // 获取请求的URL路径
      const requestUrl = error.config?.url;
      
      // 对于登录、注册和发送验证码的请求，不执行重定向
      // 这些请求在未登录状态下返回401是正常的
      const isAuthRequest = requestUrl?.startsWith('/auth/login') || 
                            requestUrl?.startsWith('/auth/register') || 
                            requestUrl?.startsWith('/auth/send-code');
      
      // 只有非认证相关的请求，且不在登录页面时才执行重定向
      if (!isAuthRequest && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        // 未授权，清除token并跳转登录
        localStorage.removeItem("token");
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
