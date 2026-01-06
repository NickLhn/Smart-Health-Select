import React, { useState, useEffect } from 'react';
import { Layout, Menu, theme, ConfigProvider, Avatar, Breadcrumb, Dropdown, App as AntdApp } from 'antd';
import {
  DesktopOutlined,
  ShopOutlined,
  UserOutlined,
  FileTextOutlined,
  LogoutOutlined,
  KeyOutlined,
  MessageOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Outlet } from 'react-router-dom';
import Dashboard from './pages/dashboard';
import ProductList from './pages/product/list';
import ProductEdit from './pages/product/edit';
import OrderList from './pages/order/list';
import ReviewList from './pages/review/list';
import ImPage from './pages/im';
import Login from './pages/login';
import Register from './pages/register';
import ForgotPassword from './pages/forgot-password';
import Password from './pages/password';
import StoreApply from './pages/store/apply';
import StoreSetting from './pages/store/setting';
import NotFound from './pages/not-found';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getMyStore } from './services/store';
import PrivateRoute from './components/private-route';
import LandingPage from './pages/landing';

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
  getItem('商家工作台', '/dashboard', <DesktopOutlined />),
  getItem('商品管理', '/product', <ShopOutlined />, [
    getItem('商品列表', '/product/list'),
    getItem('添加商品', '/product/add'),
  ]),
  getItem('订单管理', '/order', <FileTextOutlined />, [
    getItem('待发货', '/order/pending'),
    getItem('全部订单', '/order/list'),
  ]),
  getItem('评价管理', '/review', <FileTextOutlined />, [
      getItem('全部评价', '/review/list'),
  ]),
  getItem('消息中心', '/im', <MessageOutlined />),
  getItem('店铺设置', '/store/setting', <UserOutlined />),
];

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    const checkStoreStatus = async () => {
      try {
        const res = await getMyStore();
        // 如果返回成功但没有数据，说明未入驻
        if (res.code === 200 && !res.data) {
          navigate('/store/apply');
        }
      } catch (error) {
        console.error(error);
      }
    };

    // 简单做一个检查，实际项目可能需要更严谨的路由守卫
    // 只有在访问非 apply 页面时才检查
    checkStoreStatus();
  }, [user, navigate]);

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

  const selectedKey = location.pathname === '/' ? '/dashboard' : location.pathname;
  const openKey = '/' + selectedKey.split('/')[1];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div className="demo-logo-vertical" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 16 }}>
             <h1 style={{ color: 'white', margin: 0, fontSize: collapsed ? '12px' : '18px', transition: 'all 0.2s', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {collapsed ? '智健' : '智健商家端'}
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
            <Breadcrumb items={[{ title: '首页' }, { title: '商家中心' }]} />
            <Dropdown menu={{ items: userMenuItems }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#00B96B' }} src={user?.avatar} />
                  <span>{user?.nickname || user?.username || '商家用户'}</span>
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
        <Footer style={{ textAlign: 'center' }}>
          Zhijian System ©{new Date().getFullYear()} Created by Trae AI
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
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* 商家入驻/信息完善页面 (需要登录但不需要 MainLayout) */}
              <Route path="/store/apply" element={
                <PrivateRoute>
                  <StoreApply />
                </PrivateRoute>
              } />

              {/* Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="product/list" element={<ProductList />} />
                  <Route path="product/add" element={<ProductEdit />} />
                  <Route path="product/edit/:id" element={<ProductEdit />} />
                  <Route path="order/list" element={<OrderList />} />
                  <Route path="order/pending" element={<OrderList />} />
                  <Route path="review/list" element={<ReviewList />} />
                  <Route path="store/setting" element={<StoreSetting />} />
                  <Route path="im" element={<ImPage />} />
                  <Route path="password" element={<Password />} />
                  <Route path="*" element={<div>页面开发中...</div>} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
