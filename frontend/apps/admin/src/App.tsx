import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Layout, Menu, Breadcrumb, theme, ConfigProvider, Avatar, Dropdown, App as AntdApp, Button } from 'antd';
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
  GiftOutlined,
  RobotOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
const Dashboard = lazy(() => import('./pages/dashboard'));
const UserList = lazy(() => import('./pages/user'));
const MerchantAudit = lazy(() => import('./pages/user/audit'));
const CategoryList = lazy(() => import('./pages/medicine/category'));
const MedicineList = lazy(() => import('./pages/medicine/list'));
const Login = lazy(() => import('./pages/login'));
const Register = lazy(() => import('./pages/register'));
const ForgotPassword = lazy(() => import('./pages/forgot-password'));
const Password = lazy(() => import('./pages/password'));
const BannerList = lazy(() => import('./pages/operation/banner'));
const ArticleList = lazy(() => import('./pages/operation/article'));
const CouponList = lazy(() => import('./pages/marketing/coupon'));
const SystemSetting = lazy(() => import('./pages/system/setting'));
const AdminAgent = lazy(() => import('./pages/system/agent'));
const OrderList = lazy(() => import('./pages/order/list'));
const RefundList = lazy(() => import('./pages/order/refund'));

const { Header, Content, Footer, Sider } = Layout;
const RouteFallback = () => <div className="py-12 text-center text-gray-500">页面加载中...</div>;

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
  getItem('智能体', '/agent', <RobotOutlined />),
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
  getItem('系统管理', '/system', <SettingOutlined />, [
    getItem('系统设置', '/system/setting'),
  ]),
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

  const currentTitle = (() => {
    const map: Record<string, string> = {
      '/dashboard': '工作台',
      '/user/user-list': '普通用户',
      '/user/merchant-audit': '商家审核',
      '/medicine/list': '药品库',
      '/medicine/category': '分类管理',
      '/order/order-list': '订单列表',
      '/order/refund': '售后处理',
      '/marketing/coupon': '优惠券管理',
      '/operation/banner': '轮播图管理',
      '/operation/article': '健康资讯',
      '/system/setting': '系统设置',
      '/agent': '智能体',
      '/system/agent': '智能体',
      '/password': '修改密码',
    };
    return map[selectedKey] || '管理端';
  })();

  const breadcrumbItems = [
    {
      title: (
        <button
          type="button"
          className="bg-transparent border-0 p-0 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => navigate('/dashboard')}
        >
          首页
        </button>
      ),
    },
    { title: currentTitle },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <Sider
        collapsed={collapsed}
        trigger={null}
        width={264}
        collapsedWidth={84}
        className="a-sider"
        style={{ background: '#ffffff', borderRight: '1px solid rgba(15, 23, 42, 0.08)' }}
      >
        <div className="a-siderLogo">
          <button
            type="button"
            className="a-siderLogoBtn"
            onClick={() => navigate('/dashboard')}
            aria-label="返回工作台"
          >
            <span className="a-siderLogoMark" aria-hidden="true" />
            <span className="a-siderLogoText">{collapsed ? '智健' : '智健优选管理端'}</span>
          </button>
        </div>
        <Menu 
          theme="light" 
          defaultSelectedKeys={[selectedKey]} 
          selectedKeys={[selectedKey]}
          defaultOpenKeys={[openKey]}
          mode="inline" 
          items={items} 
          onClick={onClick}
          className="a-menu"
          style={{ borderInlineEnd: 'none' }}
        />
      </Sider>
      <Layout>
        <Header
          className="a-header"
          style={{
            padding: '0 24px',
            background: 'rgba(248,250,252,0.78)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(15, 23, 42, 0.08)'
          }}
        >
            <div className="a-headerLeft">
              <Button
                type="text"
                className="a-collapseBtn"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed((v) => !v)}
                aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
              />
              <div className="a-headerMeta">
                <div className="a-pageTitle">{currentTitle}</div>
                <Breadcrumb items={breadcrumbItems} />
              </div>
            </div>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <button type="button" className="a-userBtn" aria-label="用户菜单">
                  <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#2563eb' }} src={user?.avatar} />
                  <span>{user?.nickname || user?.username || '管理员'}</span>
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
              boxShadow: '0 18px 45px rgba(2, 6, 23, 0.06)',
            }}
          >
            <Outlet />
          </div>
        </Content>
        <Footer className="text-center text-gray-400 text-sm bg-transparent py-6 hidden md:block">
          <p>2025-2026 Zhijianshangcheng.cn Liuhaonan Tech co.Ltd</p>
          <p className="text-xs mt-1 opacity-60">黑ICP备2026000416号</p>
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
          colorPrimary: '#2563eb',
          borderRadius: 6,
        },
      }}
    >
      <AntdApp>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
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
                  <Route path="agent" element={<AdminAgent />} />
                  <Route path="system/agent" element={<AdminAgent />} />
                  <Route path="password" element={<Password />} />
                  <Route path="*" element={<div>页面开发中...</div>} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
