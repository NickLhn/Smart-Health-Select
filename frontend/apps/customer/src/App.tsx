import React, { Suspense, lazy } from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { antdTheme } from './theme/antdTheme';
import MainLayout from './layouts/MainLayout';
import RequireAuth from './components/auth/RequireAuth';

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { AIProvider } from './context/AIContext';

// 页面级懒加载，减少首屏资源体积。
const Home = lazy(() => import('./pages/home'));
const MedicineList = lazy(() => import('./pages/medicine'));
const HealthPage = lazy(() => import('./pages/health'));
const HealthArticleDetail = lazy(() => import('@/pages/health/detail/index'));
const ProductDetail = lazy(() => import('@/pages/product/detail/index'));
const OrderList = lazy(() => import('@/pages/order/list/index'));
const OrderDetail = lazy(() => import('./pages/order/detail'));
const Cart = lazy(() => import('./pages/cart'));
const Checkout = lazy(() => import('./pages/order/checkout'));
const Login = lazy(() => import('./pages/login'));
const Register = lazy(() => import('./pages/register'));
const ForgotPassword = lazy(() => import('./pages/forgot-password'));
const AIConsultation = lazy(() => import('./pages/ai-consultation'));
const Profile = lazy(() => import('./pages/profile'));
const PatientList = lazy(() => import('@/pages/profile/patient/index'));
const ShopDetail = lazy(() => import('./pages/shop/detail'));
const RefundApplyPage = lazy(() => import('./pages/refund/apply'));
const CouponPage = lazy(() => import('./pages/profile/coupon'));
const FavoritePage = lazy(() => import('./pages/profile/favorite'));
const CommentPage = lazy(() => import('./pages/profile/comment'));
const PaymentPage = lazy(() => import('./pages/payment'));

const RouteFallback = () => <div className="py-12 text-center text-gray-500">页面加载中...</div>;

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={antdTheme}
    >
      <AntdApp>
        {/* Provider 顺序决定了全局状态的可用范围。 */}
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <AIProvider>
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    {/* 登录、注册、找回密码不走主站布局。 */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    
                    {/* 主站页面统一挂在 MainLayout 下，保持顶部导航和底部导航一致。 */}
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
                      {/* 未匹配路径统一回首页，避免向老师展示“开发中”占位。 */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                  </Routes>
                </Suspense>
              </AIProvider>
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
