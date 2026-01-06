import React, { useState } from 'react';
import { Card, Avatar, Button, Tabs, List, Tag, Modal } from 'antd';
import { UserOutlined, ShoppingOutlined, EnvironmentOutlined, SafetyCertificateOutlined, LogoutOutlined, RightOutlined, MessageOutlined } from '@ant-design/icons';
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
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
          <Avatar size={64} icon={<UserOutlined />} className="bg-gray-100 text-gray-400 mb-4" />
          <p className="mb-6 text-gray-500 text-lg">您尚未登录</p>
          <Button type="primary" size="large" onClick={() => navigate('/login')} className="bg-[#00B96B] hover:bg-[#009456] w-32 rounded-full">去登录</Button>
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
            <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
                <List
                    itemLayout="horizontal"
                    className="w-full"
                    dataSource={[
                    { title: '登录密码', description: '已设置', action: '修改' },
                    { title: '绑定手机', description: user.mobile || '未绑定', action: '修改' },
                    ]}
                    renderItem={(item) => (
                    <List.Item actions={[<Button type="link" key="edit" className="text-[#00B96B]">{item.action}</Button>]} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <List.Item.Meta
                        title={<span className="font-medium text-gray-700">{item.title}</span>}
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
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Mobile Header Background */}
      <div className="md:hidden bg-gradient-to-r from-[#004d2c] to-[#00B96B] h-48 absolute top-0 left-0 right-0 z-0 rounded-b-[2rem]" />

      <div className="max-w-5xl mx-auto md:py-8 relative z-10 px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* User Profile Card */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm md:shadow-md overflow-hidden mt-20 md:mt-0 relative">
                {/* Mobile: Avatar overlaps header */}
                <div className="flex flex-col items-center pt-12 pb-6 px-4 md:py-8 relative">
                    <div className="absolute -top-12 md:static md:mb-4">
                         <Avatar 
                            size={96} 
                            src={user.avatar} 
                            icon={<UserOutlined />} 
                            className="bg-white text-gray-300 border-4 border-white shadow-lg" 
                         />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mt-2 md:mt-0">{user.nickname || user.username}</h2>
                    <Tag color="success" className="mt-2 border-0 bg-green-50 text-green-600 px-3 py-1 rounded-full">{user.role === 'USER' ? '普通用户' : user.role}</Tag>
                    
                    <div className="w-full mt-6 pt-6 border-t border-gray-50 md:hidden">
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="flex flex-col">
                                <span className="font-bold text-lg text-gray-800">0</span>
                                <span className="text-xs text-gray-400">优惠券</span>
                            </div>
                             <div className="flex flex-col">
                                <span className="font-bold text-lg text-gray-800">0</span>
                                <span className="text-xs text-gray-400">积分</span>
                            </div>
                             <div className="flex flex-col">
                                <span className="font-bold text-lg text-gray-800">0</span>
                                <span className="text-xs text-gray-400">收藏</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Desktop Menu */}
                <div className="hidden md:block px-2 pb-4">
                     {menuItems.map(item => (
                         <div 
                            key={item.key}
                            onClick={() => setActiveTab(item.key)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all mb-1 ${activeTab === item.key ? 'bg-[#00B96B] text-white shadow-md shadow-[#00B96B]/20' : 'text-gray-600 hover:bg-gray-50'}`}
                         >
                             <span className="text-lg">{item.icon}</span>
                             <span className="font-medium">{item.label}</span>
                         </div>
                     ))}
                     <div className="h-px bg-gray-100 my-2 mx-4" />
                     <div 
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all text-red-500 hover:bg-red-50"
                     >
                         <LogoutOutlined className="text-lg" />
                         <span className="font-medium">退出登录</span>
                     </div>
                </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="md:col-span-8 lg:col-span-9">
             {/* Mobile Tabs */}
             <div className="md:hidden bg-white rounded-xl shadow-sm mb-4 p-2 flex justify-between">
                 {menuItems.map(item => (
                     <div 
                        key={item.key}
                        onClick={() => setActiveTab(item.key)}
                        className={`flex-1 flex flex-col items-center py-2 rounded-lg transition-colors ${activeTab === item.key ? 'text-[#00B96B] bg-green-50' : 'text-gray-500'}`}
                     >
                         <span className="text-xl mb-1">{item.icon}</span>
                         <span className="text-xs">{item.label}</span>
                     </div>
                 ))}
             </div>

             <div className="bg-white md:rounded-2xl md:shadow-sm min-h-[500px] p-4 md:p-8 rounded-xl shadow-sm">
                <div className="mb-6 hidden md:block">
                    <h2 className="text-2xl font-bold text-gray-800">{menuItems.find(i => i.key === activeTab)?.label}</h2>
                </div>
                
                <div className="animate-fade-in">
                    {menuItems.find(i => i.key === activeTab)?.component}
                </div>
             </div>
             
             {/* Mobile Logout Button */}
             <div className="md:hidden mt-6 px-4">
                 <Button block size="large" danger className="rounded-xl h-12 bg-white border-none shadow-sm text-red-500 font-bold" onClick={handleLogout}>
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
