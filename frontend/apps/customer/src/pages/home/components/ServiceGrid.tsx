import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RobotOutlined, 
  SearchOutlined, 
  ReadOutlined, 
  FileTextOutlined, 
  ShoppingCartOutlined, 
  GiftOutlined, 
  HeartOutlined, 
  TeamOutlined 
} from '@ant-design/icons';
import { useAI } from '../../../context/AIContext';

const ServiceGrid: React.FC = () => {
  const navigate = useNavigate();
  const { openAI } = useAI();

  const services = [
    { name: '智能客服', icon: <RobotOutlined />, path: '/ai-consultation', color: '#1890ff' },
    { name: '找药品', icon: <SearchOutlined />, path: '/medicine', color: '#00B96B' },
    { name: '健康资讯', icon: <ReadOutlined />, path: '/health', color: '#faad14' },
    { name: '我的订单', icon: <FileTextOutlined />, path: '/orders', color: '#ff4d4f' },
    { name: '购物车', icon: <ShoppingCartOutlined />, path: '/cart', color: '#722ed1' },
    { name: '领券中心', icon: <GiftOutlined />, path: '/profile/coupon', color: '#eb2f96' },
    { name: '我的收藏', icon: <HeartOutlined />, path: '/profile/favorite', color: '#ff7a45' },
    { name: '就诊人', icon: <TeamOutlined />, path: '/profile/patient', color: '#13c2c2' },
  ];

  return (
    <div className="glass-panel !bg-white/60 !border-0 rounded-2xl p-5 md:p-8 shadow-lg mb-8">
      <div className="grid grid-cols-4 md:grid-cols-8 gap-y-6 gap-x-4">
        {services.map((item, index) => (
          <div 
            key={index}
            className="flex flex-col items-center justify-center cursor-pointer group"
            onClick={() => item.path === '/ai-consultation' ? openAI() : navigate(item.path)}
          >
            <div 
              className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1 shadow-sm group-hover:shadow-md bg-opacity-10 backdrop-blur-sm"
              style={{ backgroundColor: `${item.color}15` }}
            >
              <span style={{ color: item.color, fontSize: '24px' }} className="transition-transform duration-300 group-hover:rotate-6">{item.icon}</span>
            </div>
            <span className="text-xs md:text-sm text-gray-600 font-medium group-hover:text-gray-900 transition-colors">
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceGrid;
