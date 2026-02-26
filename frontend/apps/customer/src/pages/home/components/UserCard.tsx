import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserOutlined, CreditCardOutlined, CarOutlined, WalletOutlined, SafetyCertificateOutlined, FileTextOutlined, BellOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Avatar, Tag } from 'antd';
import { useAuth } from '../../../context/AuthContext';

const UserCard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="glass-panel !bg-white/60 !border-0 rounded-2xl h-full p-5 shadow-lg flex flex-col justify-between relative overflow-hidden">
      {/* Decorative background circle */}
      <div className="absolute top-[-20%] right-[-20%] w-[150px] h-[150px] bg-primary-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      {/* Top: User Info */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <Avatar 
            size={56} 
            src={user?.avatar} 
            icon={<UserOutlined />} 
            className="bg-primary-50 text-primary border-2 border-white shadow-sm"
          />
          <div className="flex-1 overflow-hidden">
            <h3 className="font-bold text-gray-800 m-0 text-sm truncate font-display">
              {isAuthenticated ? (user?.nickname || user?.username) : 'Hi, 欢迎来到智健'}
            </h3>
            {isAuthenticated ? (
               <Tag className="mt-1 mr-0 text-[10px] border-none bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 px-2 rounded-full font-medium">
                 智健会员
               </Tag>
            ) : (
               <div className="flex gap-2 mt-2">
                 <Button type="primary" size="small" shape="round" className="bg-primary hover:bg-primary-600 border-none text-xs h-7 px-4 shadow-sm shadow-primary-200" onClick={() => navigate('/login')}>
                   登录
                 </Button>
                 <Button size="small" shape="round" className="text-xs h-7 px-4 text-gray-600 border-gray-200 hover:text-primary hover:border-primary-200" onClick={() => navigate('/register')}>
                   注册
                 </Button>
               </div>
            )}
          </div>
        </div>

        {/* Middle: Stats / Quick Actions */}
        {isAuthenticated && (
          <div className="grid grid-cols-3 gap-2 mb-6 text-center">
            <button type="button" className="bg-transparent border-0 cursor-pointer hover:bg-white/50 p-2 rounded-xl transition-all duration-200 group" onClick={() => navigate('/orders')}>
              <CreditCardOutlined className="text-xl text-gray-400 group-hover:text-primary mb-1.5 block transition-colors" />
              <div className="text-xs text-gray-500 group-hover:text-gray-700">待付款</div>
            </button>
            <button type="button" className="bg-transparent border-0 cursor-pointer hover:bg-white/50 p-2 rounded-xl transition-all duration-200 group" onClick={() => navigate('/orders')}>
              <CarOutlined className="text-xl text-gray-400 group-hover:text-primary mb-1.5 block transition-colors" />
              <div className="text-xs text-gray-500 group-hover:text-gray-700">待收货</div>
            </button>
            <button type="button" className="bg-transparent border-0 cursor-pointer hover:bg-white/50 p-2 rounded-xl transition-all duration-200 group" onClick={() => navigate('/profile/coupon')}>
              <WalletOutlined className="text-xl text-gray-400 group-hover:text-primary mb-1.5 block transition-colors" />
              <div className="text-xs text-gray-500 group-hover:text-gray-700">优惠券</div>
            </button>
          </div>
        )}

        {/* Core Services Links */}
        <div className="space-y-2.5">
          <button type="button" className="w-full bg-transparent border-0 text-left p-0 flex items-center justify-between text-xs text-gray-600 hover:text-primary cursor-pointer group transition-all bg-white/40 hover:bg-primary-50/50 p-2.5 rounded-xl border border-transparent hover:border-primary-100" onClick={() => navigate('/health')}>
            <span className="flex items-center gap-2.5 font-medium"><SafetyCertificateOutlined className="text-primary" /> 正品保障</span>
            <RightOutlined className="text-[10px] text-gray-300 group-hover:text-primary-400" />
          </button>
          <button type="button" className="w-full bg-transparent border-0 text-left p-0 flex items-center justify-between text-xs text-gray-600 hover:text-secondary cursor-pointer group transition-all bg-white/40 hover:bg-secondary-50/50 p-2.5 rounded-xl border border-transparent hover:border-secondary-100" onClick={() => navigate('/orders')}>
             <span className="flex items-center gap-2.5 font-medium"><FileTextOutlined className="text-secondary" /> 处方审核</span>
             <RightOutlined className="text-[10px] text-gray-300 group-hover:text-secondary-400" />
          </button>
        </div>
      </div>

      {/* Bottom: Announcements */}
      <div className="mt-4 pt-3 border-t border-gray-100 relative z-10">
        <div className="flex items-center gap-2 text-xs text-rose-500 mb-2 font-bold bg-rose-50 w-fit px-2 py-0.5 rounded-full">
          <BellOutlined /> <span>最新公告</span>
        </div>
        <div className="space-y-1.5">
           <button type="button" className="bg-transparent border-0 p-0 w-full text-left text-xs text-gray-500 truncate cursor-pointer hover:text-primary flex items-center gap-1.5 transition-colors" onClick={() => navigate('/health')}>
             <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> 智健优选新版上线通知
           </button>
           <button type="button" className="bg-transparent border-0 p-0 w-full text-left text-xs text-gray-500 truncate cursor-pointer hover:text-primary flex items-center gap-1.5 transition-colors" onClick={() => navigate('/health')}>
             <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> 夏季防暑降温药品特惠
           </button>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
