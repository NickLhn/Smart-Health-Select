import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppstoreOutlined, RightOutlined } from '@ant-design/icons';
import type { Category } from '../../../services/home';
import { getCategoryColor } from '../../../utils/color';

interface CategoryMenuProps {
  categories: Category[];
}

const CategoryMenu: React.FC<CategoryMenuProps> = ({ categories }) => {
  const navigate = useNavigate();

  return (
    <div className="glass-panel !bg-white/60 !border-0 rounded-2xl h-full shadow-lg flex flex-col overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-primary to-primary-600 text-white flex items-center gap-2 font-bold text-base shadow-sm">
        <AppstoreOutlined />
        <span>全部分类</span>
      </div>
      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {categories.slice(0, 10).map((cat) => (
          <div 
            key={cat.id}
            className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-primary-50 hover:text-primary group transition-all duration-200"
            onClick={() => navigate(`/medicine?categoryId=${cat.id}`)}
          >
            <div className="flex items-center gap-3">
               {/* Placeholder for category icon if not available */}
               {cat.icon ? (
                 <img src={cat.icon} className="w-4 h-4 object-contain opacity-60 group-hover:opacity-100 transition-opacity" />
               ) : (
                 <div 
                   className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                   style={{ backgroundColor: getCategoryColor(cat.name) }}
                 >
                   {cat.name.charAt(0)}
                 </div>
               )}
               <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700">{cat.name}</span>
            </div>
            <RightOutlined className="text-[10px] text-gray-300 group-hover:text-primary-400 transform group-hover:translate-x-1 transition-all" />
          </div>
        ))}
        <div 
          className="px-4 py-3 flex items-center justify-center cursor-pointer hover:bg-gray-50 text-gray-500 text-xs border-t border-gray-50 mt-auto transition-colors"
          onClick={() => navigate('/category')}
        >
          查看更多分类 <RightOutlined className="ml-1 text-[10px]" />
        </div>
      </div>
    </div>
  );
};

export default CategoryMenu;
