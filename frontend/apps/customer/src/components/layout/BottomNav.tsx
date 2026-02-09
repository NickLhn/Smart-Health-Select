import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { MedicineBoxOutlined, MenuOutlined, ShoppingCartOutlined, UserOutlined } from '@ant-design/icons';
import { getCustomerBottomNavKey, shouldHideCustomerBottomNav } from '../../utils/navigation';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();

  if (shouldHideCustomerBottomNav(location.pathname)) {
    return null;
  }

  const navItems = [
    { key: '/', icon: <MedicineBoxOutlined />, label: '首页' },
    { key: '/category', icon: <MenuOutlined />, label: '分类' },
    { key: '/cart', icon: <ShoppingCartOutlined />, label: '购物车', badge: totalItems },
    { key: '/profile', icon: <UserOutlined />, label: '我的' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 px-6 py-2 flex justify-between items-center md:hidden z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.03)] transition-all duration-300">
      {navItems.map((item) => {
        const isActive = getCustomerBottomNavKey(location.pathname) === item.key;
        return (
          <div
            key={item.key}
            className={`flex flex-col items-center justify-center space-y-1 cursor-pointer w-16 transition-all duration-300 ${
              isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
            }`}
            onClick={() => navigate(item.key)}
          >
            <div className="relative group">
              <span className={`text-2xl mb-0.5 block transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : 'group-hover:scale-105'}`}>
                {item.icon}
              </span>
              {item.badge ? (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-fade-in">
                  {item.badge}
                </span>
              ) : null}
            </div>
            <span className={`text-[10px] font-medium transition-colors duration-300 ${isActive ? 'text-primary font-bold' : ''}`}>
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default BottomNav;
