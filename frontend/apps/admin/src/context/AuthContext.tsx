import React, { createContext, useContext, useState } from 'react';
import type { UserInfo } from '../services/auth';

// 管理端登录态上下文。
interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  login: (token: string, userInfo: UserInfo) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(() => {
    const savedUser = localStorage.getItem('user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('token');
  });

  const login = (token: string, userInfo: UserInfo) => {
    // 登录成功后同步本地存储和内存状态。
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userInfo));
    setUser(userInfo);
    setIsAuthenticated(true);
  };

  const logout = () => {
    // 退出时清空本地登录态。
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
    // Provider 外使用时直接抛错，避免静默异常。
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
