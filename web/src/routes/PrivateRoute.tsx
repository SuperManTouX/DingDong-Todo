import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  // 如果正在加载认证状态，显示空白或加载指示器
  if (isLoading) {
    return null; // 或者返回一个加载指示器组件
  }

  // 认证状态加载完成后，再检查是否已认证
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children;
};

export default PrivateRoute;