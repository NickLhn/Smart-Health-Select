import React, { useState, useEffect } from 'react';
import { Layout, Menu, theme, ConfigProvider, Avatar, Breadcrumb, Dropdown, App as AntdApp, Button } from 'antd';
import {
  DesktopOutlined,
  ShopOutlined,
  UserOutlined,
  FileTextOutlined,
  CommentOutlined,
  LogoutOutlined,
  KeyOutlined,
  MessageOutlined,
  RobotOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
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
import AiAdvisorPage from './pages/ai/advisor';
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
  getItem('评价管理', '/review', <CommentOutlined />, [
      getItem('全部评价', '/review/list'),
  ]),
  getItem('消息中心', '/im', <MessageOutlined />),
  getItem('AI助手', '/ai/advisor', <RobotOutlined />),
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

  const currentTitle = (() => {
    if (selectedKey.startsWith('/product/edit')) return '编辑商品';
    const map: Record<string, string> = {
      '/dashboard': '商家工作台',
      '/product/list': '商品列表',
      '/product/add': '添加商品',
      '/order/pending': '待发货',
      '/order/list': '全部订单',
      '/review/list': '全部评价',
      '/im': '消息中心',
      '/ai/advisor': 'AI助手',
      '/store/setting': '店铺设置',
      '/password': '修改密码',
    };
    return map[selectedKey] || '商家中心';
  })();

  const breadcrumbItems = [
    {
      title: (
        <button
          type="button"
          className="bg-transparent border-0 p-0 cursor-pointer hover:text-emerald-700 transition-colors"
          onClick={() => navigate('/dashboard')}
        >
          首页
        </button>
      ),
    },
    { title: currentTitle },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#ECFDF5' }}>
      <Sider
        collapsed={collapsed}
        trigger={null}
        width={264}
        collapsedWidth={84}
        className="m-sider"
        style={{
          background: 'linear-gradient(180deg, #022c22 0%, #064e3b 45%, #047857 100%)',
          borderRight: 'none',
        }}
      >
        <div
          className="m-siderLogo"
        >
          <button
            type="button"
            className="m-siderLogoBtn"
            onClick={() => navigate('/dashboard')}
            aria-label="返回商家工作台"
          >
            <span className="m-siderLogoMark" aria-hidden="true" />
            <span className="m-siderLogoText">{collapsed ? '智健' : '智健商家端'}</span>
          </button>
        </div>
        <Menu
          theme="dark"
          defaultSelectedKeys={[selectedKey]}
          selectedKeys={[selectedKey]}
          defaultOpenKeys={[openKey]}
          mode="inline"
          items={items}
          onClick={onClick}
          className="m-menu"
          style={{
            background: 'transparent',
            borderInlineEnd: 'none',
          }}
        />
      </Sider>
      <Layout>
        <Header
          className="m-header"
          style={{
            padding: '0 24px',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div className="m-headerLeft">
            <Button
              type="text"
              className="m-collapseBtn"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
            />

            <div className="m-headerMeta">
              <div className="m-pageTitle">{currentTitle}</div>
              <Breadcrumb items={breadcrumbItems} />
            </div>
          </div>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
            <button type="button" className="m-userBtn" aria-label="用户菜单">
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#00B96B' }} src={user?.avatar} />
              <span style={{ fontWeight: 500 }}>{user?.nickname || user?.username || '商家用户'}</span>
            </button>
          </Dropdown>
        </Header>
        <Content style={{ margin: '16px 16px' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              boxShadow: '0 18px 45px rgba(15, 118, 110, 0.08)',
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
                  <Route path="im" element={<ImPage />} />
                  <Route path="ai/advisor" element={<AiAdvisorPage />} />
                  <Route path="store/setting" element={<StoreSetting />} />
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
