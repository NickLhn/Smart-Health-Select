import React, { useState } from 'react';
import { Layout, Menu, Button, Input, Badge, theme, ConfigProvider, Drawer, FloatButton, Dropdown, Avatar, Space, App as AntdApp } from 'antd';
import {
  ShoppingCartOutlined,
  UserOutlined,
  MenuOutlined,
  MedicineBoxOutlined,
  RobotOutlined,
  LogoutOutlined,
  ProfileOutlined,
  DollarCircleOutlined,
  HeartOutlined
} from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Outlet } from 'react-router-dom';
import Home from './pages/home';
import MedicineList from './pages/medicine';
import CategoryBrowse from './pages/category';
import HealthPage from './pages/health';
import HealthArticleDetail from '@/pages/health/detail/index';
import { CartProvider, useCart } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AIProvider, useAI } from './context/AIContext';
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

const { Header, Content, Footer } = Layout;
const { Search } = Input;

// Bottom Navigation Component for Mobile
const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();

  const hidePaths = ['/product/', '/cart', '/order/checkout', '/login', '/register', '/forgot-password', '/ai-consultation'];
  if (hidePaths.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  const navItems = [
    { key: '/', icon: <MedicineBoxOutlined />, label: '首页' },
    { key: '/category', icon: <MenuOutlined />, label: '分类' },
    { key: '/cart', icon: <ShoppingCartOutlined />, label: '购物车', badge: totalItems },
    { key: '/profile', icon: <UserOutlined />, label: '我的' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 flex justify-between items-center md:hidden z-50 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.key;
        return (
          <div
            key={item.key}
            className={`flex flex-col items-center justify-center space-y-1 cursor-pointer w-16 transition-colors duration-200 ${
              isActive ? 'text-[#00B96B]' : 'text-gray-400'
            }`}
            onClick={() => navigate(item.key)}
          >
            <div className="relative">
              <span className={`text-xl ${isActive ? 'scale-110' : ''} transition-transform duration-200`}>
                {item.icon}
              </span>
              {item.badge ? (
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[16px] text-center border border-white">
                  {item.badge}
                </span>
              ) : null}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const CartBadge = () => {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  return (
    <Badge count={totalItems} size="small" offset={[-2, 2]}>
       <Button 
         type="text" 
         icon={<ShoppingCartOutlined className="text-xl text-gray-600" />} 
         className="flex items-center justify-center hover:bg-gray-100 rounded-full w-10 h-10"
         onClick={() => navigate('/cart')} 
       />
    </Badge>
  );
};

const UserMenu = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: 'profile',
      label: '个人中心',
      icon: <ProfileOutlined />,
      onClick: () => navigate('/profile'),
    },
    {
      key: 'coupon',
      label: '我的优惠券',
      icon: <DollarCircleOutlined />,
      onClick: () => navigate('/profile/coupon'),
    },
    {
      key: 'favorite',
      label: '我的收藏',
      icon: <HeartOutlined />,
      onClick: () => navigate('/profile/favorite'),
    },
    {
      key: 'comment',
      label: '我的评价',
      icon: <ProfileOutlined />,
      onClick: () => navigate('/profile/comment'),
    },
    {
      key: 'patient',
      label: '就诊人管理',
      icon: <UserOutlined />,
      onClick: () => navigate('/profile/patient'),
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  if (!isAuthenticated || !user) {
    return (
      <Button type="primary" shape="round" icon={<UserOutlined />} onClick={() => navigate('/login')}>
        登录/注册
      </Button>
    );
  }

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomRight" arrow>
      <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 py-1 px-2 rounded-full border border-transparent hover:border-gray-200 transition-all">
        <Avatar size="default" icon={<UserOutlined />} src={user.avatar} style={{ backgroundColor: '#00B96B' }} />
        <span className="text-gray-700 font-medium text-sm hidden sm:block max-w-[100px] truncate">
          {user.nickname || user.username}
        </span>
      </div>
    </Dropdown>
  );
};

const MainLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { openAI } = useAI();
  
  // Only show menu items on desktop or drawer
  const menuItems = [
    { key: '/', label: '首页' },
    { key: '/medicine', label: '全部药品' },
    { key: '/category', label: '分类浏览' },
    { key: '/health', label: '健康资讯' },
    { key: '/orders', label: '我的订单' },
  ];

  return (
    <Layout className="layout min-h-screen bg-[#f5f7fa]">
      <Header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-6 flex items-center justify-between shadow-sm h-16 border-b border-gray-100">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="bg-gradient-to-br from-[#00B96B] to-[#009456] p-1.5 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300">
             <MedicineBoxOutlined style={{ fontSize: '20px', color: '#fff' }} />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00B96B] to-[#007F4F]">
            智健优选
          </span>
        </div>
        
        {/* Desktop Menu */}
        <Menu
          theme="light"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={(e) => navigate(e.key)}
          className="hidden md:flex flex-1 border-none bg-transparent ml-8 text-[15px] font-medium"
        />

        <div className="flex items-center gap-3 md:gap-6">
           <div className="hidden md:block">
             <CartBadge />
           </div>
           <UserMenu />
           <Button 
             className="md:hidden flex items-center justify-center border-none shadow-none text-gray-600" 
             icon={<MenuOutlined style={{ fontSize: '20px' }} />} 
             onClick={() => setMobileMenuOpen(true)}
           />
        </div>
      </Header>

      <Drawer
        title={<span className="font-bold text-lg">功能菜单</span>}
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={280}
        styles={{ header: { borderBottom: '1px solid #f0f0f0' } }}
      >
        <Menu
          mode="vertical"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={(e) => {
            navigate(e.key);
            setMobileMenuOpen(false);
          }}
          className="border-none text-[15px]"
        />
      </Drawer>

      <Content className="md:px-6 md:py-6 pb-20 md:pb-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </Content>

      <Footer className="text-center text-gray-400 text-sm bg-transparent py-6 hidden md:block">
        <p>Zhijian System ©{new Date().getFullYear()} 智健医疗</p>
        <p className="text-xs mt-1 opacity-60">致力于为您提供最专业的医疗健康服务</p>
      </Footer>
      
      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* AI Consultation Float Button */}
      <FloatButton 
        icon={<RobotOutlined />} 
        type="primary" 
        style={{ right: 24, bottom: 90 }} 
        className="w-12 h-12 md:w-14 md:h-14 shadow-lg shadow-[#00B96B]/30"
        onClick={openAI}
        tooltip="AI 导诊"
      />
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#00B96B',
          borderRadius: 8,
        },
      }}
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
                  <Route path="category" element={<CategoryBrowse />} />
                  <Route path="health" element={<HealthPage />} />
                  <Route path="health/article/:id" element={<HealthArticleDetail />} />
                  <Route path="product/:id" element={<ProductDetail />} />
                  <Route path="shop/:id" element={<ShopDetail />} />
                  <Route path="orders" element={<OrderList />} />
                  <Route path="order/list" element={<OrderList />} />
                  <Route path="order/:id" element={<OrderDetail />} />
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
