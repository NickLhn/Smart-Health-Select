import React from 'react';
import { Spin } from 'antd';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RequireAuth: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { isAuthenticated, isReady } = useAuth();
  const location = useLocation();

  // 首次加载时先等本地登录态恢复，避免 Stripe 回跳刷新后被误判成未登录。
  if (!isReady) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // 未登录时把当前路径带到 state，登录后可以按需回跳。
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

export default RequireAuth;
