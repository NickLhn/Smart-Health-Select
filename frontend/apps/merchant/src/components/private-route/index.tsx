import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spin } from 'antd';

interface PrivateRouteProps {
  children?: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // 可以在这里添加一个 loading 状态，如果 AuthContext 正在初始化
  // 但目前的 AuthContext 是同步从 localStorage 读取的，所以不需要

  if (!isAuthenticated) {
    // 重定向到登录页，并保留原路径以便登录后跳转
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default PrivateRoute;
