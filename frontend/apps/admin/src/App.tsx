import React, { useState, useEffect } from 'react';
import { Layout, Menu, Breadcrumb, theme, ConfigProvider, Avatar, Dropdown, App as AntdApp } from 'antd';
import {
  DesktopOutlined,
  PieChartOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  ShoppingOutlined,
  LogoutOutlined,
  KeyOutlined,
  PictureOutlined,
  ReadOutlined,
  GiftOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Outlet } from 'react-router-dom';
import Dashboard from './pages/dashboard';
import UserList from './pages/user';
import MerchantAudit from './pages/user/audit';
import CategoryList from './pages/medicine/category';
import MedicineList from './pages/medicine/list';
import Login from './pages/login';
import Register from './pages/register';
import ForgotPassword from './pages/forgot-password';
import Password from './pages/password';
import SystemSetting from './pages/system/setting';
import BannerList from './pages/operation/banner';
import ArticleList from './pages/operation/article';
import CouponList from './pages/marketing/coupon';
import { AuthProvider, useAuth } from './context/AuthContext';

import OrderList from './pages/order/list';
import RefundList from './pages/order/refund';

const { Header, Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem('工作台', '/dashboard', <PieChartOutlined />),
  getItem('用户管理', '/user', <UserOutlined />, [
    getItem('普通用户', '/user/user-list'),
    getItem('商家审核', '/user/merchant-audit'),
  ]),
  getItem('药品管理', '/medicine', <MedicineBoxOutlined />, [
    getItem('药品库', '/medicine/list'),
    getItem('分类管理', '/medicine/category'),
  ]),
  getItem('订单管理', '/order', <ShoppingOutlined />, [
    getItem('订单列表', '/order/order-list'),
    getItem('售后处理', '/order/refund'),
  ]),
  getItem('营销管理', '/marketing', <GiftOutlined />, [
    getItem('优惠券管理', '/marketing/coupon'),
  ]),
  getItem('运营管理', '/operation', <DesktopOutlined />, [
    getItem('轮播图管理', '/operation/banner', <PictureOutlined />),
    getItem('健康资讯', '/operation/article', <ReadOutlined />),
  ]),
  getItem('系统设置', '/system/setting', <DesktopOutlined />),
];

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const onClick: MenuProps['onClick'] = (e) => {
    navigate(e.key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'password',
      label: '修改密码',
      icon: <KeyOutlined />,
      onClick: () => navigate('/password'),
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  // Find current selected key and open keys
  const selectedKey = location.pathname === '/' ? '/dashboard' : location.pathname;
  // Simple logic to find open key based on path structure like /user/user-list -> /user
  const openKey = '/' + selectedKey.split('/')[1];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div className="demo-logo-vertical" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 16 }}>
             <h1 style={{ color: 'white', margin: 0, fontSize: collapsed ? '12px' : '18px', transition: 'all 0.2s', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {collapsed ? '智健' : '智健优选管理端'}
             </h1>
        </div>
        <Menu 
          theme="dark" 
          defaultSelectedKeys={[selectedKey]} 
          selectedKeys={[selectedKey]}
          defaultOpenKeys={[openKey]}
          mode="inline" 
          items={items} 
          onClick={onClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Breadcrumb items={[{ title: '首页' }, { title: '工作台' }]} />
            <Dropdown menu={{ items: userMenuItems }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#00B96B' }} src={user?.avatar} />
                  <span>{user?.nickname || user?.username || '管理员'}</span>
              </div>
            </Dropdown>
        </Header>
        <Content style={{ margin: '16px 16px' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
        <Footer className="text-center text-gray-400 text-sm bg-transparent py-6 hidden md:block">
        <p>Zhijian System ©{new Date().getFullYear()} 智健优选</p>
        <p className="text-xs mt-1 opacity-60">致力于为您提供最专业的医疗健康服务</p>
      </Footer>
      </Layout>
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
          borderRadius: 6,
        },
      }}
    >
      <AntdApp>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="user/user-list" element={<UserList />} />
                <Route path="user/merchant-audit" element={<MerchantAudit />} />
                <Route path="medicine/category" element={<CategoryList />} />
                <Route path="medicine/list" element={<MedicineList />} />
                <Route path="order/order-list" element={<OrderList />} />
                <Route path="order/refund" element={<RefundList />} />
                <Route path="marketing/coupon" element={<CouponList />} />
                <Route path="operation/banner" element={<BannerList />} />
                <Route path="operation/article" element={<ArticleList />} />
                <Route path="system/setting" element={<SystemSetting />} />
                <Route path="password" element={<Password />} />
                <Route path="*" element={<div>页面开发中...</div>} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
