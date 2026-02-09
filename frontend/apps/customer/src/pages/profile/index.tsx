import React, { useState } from 'react';
import { Avatar, Button, List, Tag, Modal } from 'antd';
import { UserOutlined, ShoppingOutlined, EnvironmentOutlined, SafetyCertificateOutlined, LogoutOutlined, MessageOutlined, RightOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import AddressList from './address-list';
import OrderList from './order-list';
import ReviewList from './review-list';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-200/20 blur-3xl" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-teal-200/20 blur-3xl" />
        </div>

        <div className="text-center p-10 glass-panel !bg-white/70 rounded-3xl shadow-xl border border-white/60 relative z-10">
          <Avatar size={80} icon={<UserOutlined />} className="bg-white text-emerald-300 mb-6 shadow-inner border-4 border-emerald-50" />
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-2">欢迎来到智健系统</h2>
          <p className="mb-8 text-gray-500 text-base">登录以体验完整功能</p>
          <Button 
            type="primary" 
            size="large" 
            onClick={() => navigate('/login')} 
            className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none w-40 h-12 rounded-full text-lg font-bold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 transition-all"
          >
            去登录
          </Button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    Modal.confirm({
        title: '确认退出',
        content: '您确定要退出登录吗？',
        okText: '确认',
        cancelText: '取消',
        okButtonProps: { danger: true, shape: 'round' },
        cancelButtonProps: { shape: 'round' },
        centered: true,
        onOk: () => {
            logout();
            navigate('/login');
        }
    });
  };

  const menuItems = [
    {
        key: 'orders',
        label: '我的订单',
        icon: <ShoppingOutlined />,
        component: <OrderList active={activeTab === 'orders'} />
    },
    {
        key: 'reviews',
        label: '我的评价',
        icon: <MessageOutlined />,
        component: <ReviewList active={activeTab === 'reviews'} />
    },
    {
        key: 'address',
        label: '收货地址',
        icon: <EnvironmentOutlined />,
        component: <AddressList />
    },
    {
        key: 'security',
        label: '账号安全',
        icon: <SafetyCertificateOutlined />,
        component: (
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/60">
                <List
                    itemLayout="horizontal"
                    className="w-full"
                    dataSource={[
                    { title: '登录密码', description: '已设置', action: '修改' },
                    { title: '绑定手机', description: user.mobile || '未绑定', action: '修改' },
                    ]}
                    renderItem={(item) => (
                    <List.Item actions={[<Button type="link" key="edit" className="text-emerald-600 hover:text-emerald-700 font-medium">{item.action}</Button>]} className="px-6 py-4 hover:bg-white/40 transition-colors border-b border-white/40 last:border-0">
                        <List.Item.Meta
                        title={<span className="font-bold text-gray-700">{item.title}</span>}
                        description={<span className="text-gray-500">{item.description}</span>}
                        />
                    </List.Item>
                    )}
                />
            </div>
        )
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-12 relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-200/20 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-teal-200/20 blur-3xl" />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] rounded-full bg-cyan-200/20 blur-3xl" />
      </div>

      {/* Mobile Header Background */}
      <div className="md:hidden relative h-56 overflow-hidden rounded-b-[2.5rem] shadow-lg shadow-emerald-900/10 z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-600"></div>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>
      </div>

      <div className="max-w-6xl mx-auto md:py-12 relative z-10 px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
          
          {/* User Profile Sidebar */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="glass-panel !bg-white/70 rounded-3xl shadow-sm border border-white/60 overflow-hidden -mt-24 md:mt-0 relative transition-all duration-300 hover:shadow-md">
                {/* Mobile: Avatar overlaps header */}
                <div className="flex flex-col items-center pt-16 pb-6 px-4 md:py-10 relative">
                    <div className="absolute -top-16 md:static md:mb-6">
                         <div className="relative group">
                            <Avatar 
                                size={{ xs: 100, sm: 100, md: 100, lg: 100, xl: 100, xxl: 100 }} 
                                src={user.avatar} 
                                icon={<UserOutlined />} 
                                className="bg-white text-gray-300 border-[6px] border-white shadow-xl shadow-gray-200" 
                            />
                            <div className="absolute inset-0 rounded-full bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[1px]">
                                <span className="text-white text-xs font-bold">更换头像</span>
                            </div>
                         </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mt-2 md:mt-0">{user.nickname || user.username}</h2>
                    <Tag className="mt-2 border-0 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold text-xs shadow-sm">
                        {user.role === 'USER' ? '普通会员' : user.role}
                    </Tag>
                    
                    {/* Mobile Stats */}
                    <div className="w-full mt-6 pt-6 border-t border-gray-200/50 md:hidden">
                        <div className="grid grid-cols-3 gap-2 text-center divide-x divide-gray-200/50">
                            <div className="flex flex-col">
                                <span className="font-bold text-xl text-gray-800">0</span>
                                <span className="text-xs text-gray-400 mt-1">优惠券</span>
                            </div>
                             <div className="flex flex-col">
                                <span className="font-bold text-xl text-gray-800">0</span>
                                <span className="text-xs text-gray-400 mt-1">积分</span>
                            </div>
                             <div className="flex flex-col">
                                <span className="font-bold text-xl text-gray-800">0</span>
                                <span className="text-xs text-gray-400 mt-1">收藏</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Desktop Menu */}
                <div className="hidden md:block px-3 pb-6 space-y-1">
                     {menuItems.map(item => (
                         <div 
                            key={item.key}
                            onClick={() => setActiveTab(item.key)}
                            className={`
                                flex items-center gap-4 px-6 py-4 rounded-2xl cursor-pointer transition-all duration-300
                                ${activeTab === item.key 
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 translate-x-1' 
                                    : 'text-gray-600 hover:bg-white/60 hover:pl-7'}
                            `}
                         >
                             <span className="text-xl">{item.icon}</span>
                             <span className="font-bold">{item.label}</span>
                             {activeTab === item.key && <RightOutlined className="ml-auto text-xs opacity-60" />}
                         </div>
                     ))}
                     <div className="h-px bg-gray-200/50 my-4 mx-6" />
                     <div 
                        onClick={handleLogout}
                        className="flex items-center gap-4 px-6 py-4 rounded-2xl cursor-pointer transition-all text-gray-500 hover:bg-red-50 hover:text-red-500 hover:pl-7"
                     >
                         <LogoutOutlined className="text-xl" />
                         <span className="font-bold">退出登录</span>
                     </div>
                </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="md:col-span-8 lg:col-span-9">
             {/* Mobile Tabs */}
             <div className="md:hidden glass-panel !bg-white/80 rounded-2xl shadow-sm mb-6 p-2 flex justify-between mx-0 mt-4 border border-white/60">
                 {menuItems.map(item => (
                     <div 
                        key={item.key}
                        onClick={() => setActiveTab(item.key)}
                        className={`flex-1 flex flex-col items-center py-3 rounded-xl transition-all duration-300 ${activeTab === item.key ? 'text-emerald-600 bg-emerald-50 font-bold scale-105 shadow-sm' : 'text-gray-400'}`}
                     >
                         <span className="text-xl mb-1.5">{item.icon}</span>
                         <span className="text-xs">{item.label}</span>
                     </div>
                 ))}
             </div>

             <div className="glass-panel !bg-white/70 rounded-3xl shadow-sm border border-white/60 min-h-[600px] p-5 md:p-10 transition-all">
                <div className="mb-8 hidden md:block border-b border-gray-200/50 pb-4">
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <span className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-800 to-teal-700">{menuItems.find(i => i.key === activeTab)?.label}</span>
                    </h2>
                </div>
                
                <div className="animate-fade-in">
                    {menuItems.find(i => i.key === activeTab)?.component}
                </div>
             </div>
             
             {/* Mobile Logout Button */}
             <div className="md:hidden mt-8 px-4">
                 <Button block size="large" className="rounded-2xl h-14 bg-white/60 backdrop-blur border-none shadow-sm text-red-500 font-bold text-lg active:scale-95 transition-all" onClick={handleLogout}>
                     退出登录
                 </Button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
