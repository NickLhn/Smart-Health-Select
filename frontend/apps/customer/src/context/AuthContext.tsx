import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserInfo } from '../services/auth';

// 用户端登录态上下文，负责在本地存储与 React 状态之间保持同步。
interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  login: (token: string, userInfo: UserInfo) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 首次挂载时从 localStorage 恢复登录状态。
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      } catch (e) {
        // 本地缓存损坏时直接清理，避免后续页面拿到脏数据。
        console.error('Failed to parse user info', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = (token: string, userInfo: UserInfo) => {
    // 登录成功后，同时更新本地存储和内存状态。
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userInfo));
    setUser(userInfo);
    setIsAuthenticated(true);
  };

  const logout = () => {
    // 退出登录时清空本地登录态。
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // 统一要求在 Provider 内部使用，避免页面误用时静默失败。
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
