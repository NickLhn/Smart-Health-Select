import React, { useState } from 'react';
import { Layout, Menu, Button, Badge, Dropdown, Avatar, Drawer } from 'antd';
import {
  MedicineBoxOutlined,
  MenuOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  ProfileOutlined,
  DollarCircleOutlined,
  HeartOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getCustomerTopNavKey } from '../../utils/navigation';

const { Header: AntHeader } = Layout;

const CartBadge = () => {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  return (
    <Badge count={totalItems} size="small" offset={[-4, 4]} color="#EF4444">
       <Button 
         type="text" 
         icon={<ShoppingCartOutlined className="text-xl text-gray-600 group-hover:text-primary transition-colors" />} 
         className="flex items-center justify-center hover:bg-primary-50 rounded-full w-10 h-10 group transition-all duration-300"
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
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  if (!isAuthenticated || !user) {
    return (
      <Button 
        type="primary" 
        shape="round" 
        icon={<UserOutlined />} 
        onClick={() => navigate('/login')}
        className="bg-primary hover:bg-primary-600 shadow-lg shadow-primary/20 border-none font-medium px-6 h-10"
      >
        登录/注册
      </Button>
    );
  }

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomRight" arrow overlayClassName="pt-2">
      <div className="flex items-center gap-2.5 cursor-pointer hover:bg-white py-1.5 px-2 rounded-full border border-transparent hover:border-gray-100 hover:shadow-sm transition-all duration-300 group">
        <Avatar 
          size="default" 
          icon={<UserOutlined />} 
          src={user.avatar} 
          className="bg-primary/10 text-primary border border-primary/20 group-hover:border-primary transition-colors" 
        />
        <span className="text-gray-700 font-medium text-sm hidden sm:block max-w-[100px] truncate group-hover:text-primary transition-colors">
          {user.nickname || user.username}
        </span>
      </div>
    </Dropdown>
  );
};

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/', label: '首页' },
    { key: '/medicine', label: '全部药品' },
    { key: '/category', label: '分类浏览' },
    { key: '/health', label: '健康资讯' },
    { key: '/orders', label: '我的订单' },
  ];

  return (
    <AntHeader className="bg-white/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between shadow-sm h-16 border-b border-gray-100/50 transition-all duration-300">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="bg-gradient-to-br from-primary to-primary-600 p-2 rounded-xl shadow-lg shadow-primary/20 group-hover:shadow-primary/30 group-hover:scale-105 transition-all duration-300">
             <MedicineBoxOutlined style={{ fontSize: '20px', color: '#fff' }} />
          </div>
          <span className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 tracking-tight">
            智健优选
          </span>
        </div>
        
        {/* Desktop Menu */}
        <Menu
          mode="horizontal"
          selectedKeys={[getCustomerTopNavKey(location.pathname)]}
          items={menuItems}
          onClick={(e) => navigate(e.key)}
          className="hidden md:flex flex-1 border-none bg-transparent ml-12 text-[15px] font-medium [&_.ant-menu-item]:text-gray-600 [&_.ant-menu-item-selected]:text-primary [&_.ant-menu-item-selected]:bg-primary/5 [&_.ant-menu-item-selected]:font-bold [&_.ant-menu-item]:rounded-lg [&_.ant-menu-item]:px-4"
        />

        <div className="flex items-center gap-3 md:gap-6">
           <div className="hidden md:block transform hover:scale-105 transition-transform duration-200">
             <CartBadge />
           </div>
           <UserMenu />
           <Button 
             className="md:hidden flex items-center justify-center border-none shadow-none text-gray-600 hover:bg-gray-50 rounded-lg w-10 h-10" 
             icon={<MenuOutlined style={{ fontSize: '20px' }} />} 
             onClick={() => setMobileMenuOpen(true)}
           />
        </div>

      <Drawer
        title={<span className="font-bold text-lg font-display text-gray-800">功能菜单</span>}
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={280}
        styles={{ header: { borderBottom: '1px solid #f0f0f0' } }}
        className="backdrop-blur-sm"
      >
        <Menu
          mode="vertical"
          selectedKeys={[getCustomerTopNavKey(location.pathname)]}
          items={menuItems}
          onClick={(e) => {
            navigate(e.key);
            setMobileMenuOpen(false);
          }}
          className="border-none text-[15px] [&_.ant-menu-item]:h-12 [&_.ant-menu-item]:leading-[48px] [&_.ant-menu-item]:rounded-xl [&_.ant-menu-item-selected]:bg-primary/10 [&_.ant-menu-item-selected]:text-primary"
        />
      </Drawer>
    </AntHeader>
  );
};

export default Header;
