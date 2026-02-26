import React from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { antdTheme } from './theme/antdTheme';
import MainLayout from './layouts/MainLayout';
import RequireAuth from './components/auth/RequireAuth';

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { AIProvider } from './context/AIContext';

import Home from './pages/home';
import MedicineList from './pages/medicine';
import HealthPage from './pages/health';
import HealthArticleDetail from '@/pages/health/detail/index';
import ProductDetail from '@/pages/product/detail/index';
import OrderList from '@/pages/order/list/index';
import OrderDetail from './pages/order/detail';
import Cart from './pages/cart';
import Checkout from './pages/order/checkout';
import Login from './pages/login';
import Register from './pages/register';
import ForgotPassword from './pages/forgot-password';
import AIConsultation from './pages/ai-consultation';
import Profile from './pages/profile';
import PatientList from '@/pages/profile/patient/index';
import ShopDetail from './pages/shop/detail';
import RefundApplyPage from './pages/refund/apply';
import CouponPage from './pages/profile/coupon';
import FavoritePage from './pages/profile/favorite';
import CommentPage from './pages/profile/comment';
import PaymentPage from './pages/payment';

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={antdTheme}
    >
      <AntdApp>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <AIProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  
                  <Route path="/" element={<MainLayout />}>
                    <Route index element={<Home />} />
                    <Route path="medicine" element={<MedicineList />} />
                    <Route path="category" element={<Navigate to="/medicine" replace />} />
                    <Route path="health" element={<HealthPage />} />
                    <Route path="health/article/:id" element={<HealthArticleDetail />} />
                    <Route path="product/:id" element={<ProductDetail />} />
                    <Route path="shop/:id" element={<ShopDetail />} />
                    <Route path="orders" element={<RequireAuth><OrderList /></RequireAuth>} />
                    <Route path="order/list" element={<RequireAuth><OrderList /></RequireAuth>} />
                    <Route path="order/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />
                    <Route path="cart" element={<Cart />} />
                    <Route path="order/checkout" element={<Checkout />} />
                    <Route path="payment/:orderId" element={<PaymentPage />} />
                    <Route path="refund/apply/:orderId" element={<RefundApplyPage />} />
                    <Route path="ai-consultation" element={<AIConsultation />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="profile/coupon" element={<CouponPage />} />
                    <Route path="profile/favorite" element={<FavoritePage />} />
                    <Route path="profile/comment" element={<CommentPage />} />
                    <Route path="profile/patient" element={<PatientList />} />
                    <Route path="*" element={<div className="text-center mt-20">页面开发中...</div>} />
                  </Route>
                </Routes>
              </AIProvider>
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
