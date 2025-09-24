import axios from "axios";

// 创建axios实例
const api = axios.create({
  baseURL: "http://localhost:3000", // 后端服务地址
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
    // // 统一错误处理
    // if (error.response?.status === 401) {
    //   // 未授权，清除token并跳转登录
    //   localStorage.removeItem("token");
    //   window.location.href = '/login';
    // }
    return Promise.reject(error);
  },
);

export default api;
