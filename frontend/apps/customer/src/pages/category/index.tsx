import React, { useEffect, useState } from 'react';
import { Spin, Empty, Input } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SearchOutlined, MedicineBoxOutlined, RightOutlined } from '@ant-design/icons';
import { getCategoryList } from '../../services/medicine';
import type { Category } from '../../services/medicine';
import { getCategoryColor } from '../../utils/color';

const CategoryBrowse: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await getCategoryList();
      if (res.code === 200 && res.data) {
        setCategories(res.data);
        // Default to first category or from URL
        const urlId = searchParams.get('categoryId');
        if (urlId) {
            setActiveCategoryId(Number(urlId));
        } else if (res.data.length > 0) {
            setActiveCategoryId(res.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (id: number) => {
    setActiveCategoryId(id);
  };

  const handleSubCategoryClick = (id: number) => {
    navigate(`/medicine?categoryId=${id}`);
  };

  const activeCategory = categories.find(c => c.id === activeCategoryId);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        {/* Header / Search */}
        <div className="bg-white sticky top-0 z-10 shadow-sm">
            <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center gap-4">
                 <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-2 transition-all hover:bg-gray-200">
                    <SearchOutlined className="text-gray-400 text-lg mr-2" />
                    <input 
                        type="text" 
                        placeholder="搜索药品分类..." 
                        className="bg-transparent border-none outline-none flex-1 text-sm text-gray-700 placeholder-gray-400"
                        onKeyDown={(e) => {
                            if(e.key === 'Enter') {
                                navigate(`/medicine?keyword=${e.currentTarget.value}`);
                            }
                        }}
                    />
                 </div>
            </div>
        </div>

      <div className="max-w-[1200px] mx-auto md:px-4 md:py-6 flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)]">
        
        {/* Sidebar (Desktop) / Top Tabs (Mobile) */}
        <div className="w-full md:w-64 bg-white md:rounded-2xl md:shadow-sm overflow-hidden flex-shrink-0 flex md:flex-col md:h-full overflow-x-auto md:overflow-y-auto scrollbar-hide border-b md:border-b-0 border-gray-100">
            {loading ? (
                <div className="p-4 flex justify-center"><Spin /></div>
            ) : (
                categories.map(category => (
                    <div
                        key={category.id}
                        onClick={() => handleCategoryClick(category.id)}
                        className={`
                            flex-shrink-0 px-4 py-3 md:py-4 md:px-6 cursor-pointer flex items-center gap-3 transition-all relative
                            ${activeCategoryId === category.id 
                                ? 'bg-[#00B96B]/5 text-[#00B96B] font-bold' 
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                        `}
                    >
                        {activeCategoryId === category.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 md:h-full md:w-1 md:right-auto bg-[#00B96B]" />
                        )}
                        <span className="text-xl md:text-lg flex items-center justify-center">
                            {category.icon ? (
                                <img src={category.icon} alt="" className="w-6 h-6 object-contain" />
                            ) : (
                                <div 
                                    className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
                                    style={{ backgroundColor: getCategoryColor(category.name) }}
                                >
                                    {category.name.charAt(0)}
                                </div>
                            )}
                        </span>
                        <span className="whitespace-nowrap text-sm md:text-base">{category.name}</span>
                    </div>
                ))
            )}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white md:rounded-2xl md:shadow-sm p-4 md:p-6 overflow-y-auto h-full">
            {loading ? (
                 <div className="flex justify-center items-center h-full"><Spin size="large" /></div>
            ) : activeCategory ? (
                <div className="animate-fade-in">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                             <h2 className="text-xl font-bold text-gray-800">{activeCategory.name}</h2>
                             <p className="text-gray-400 text-sm mt-1">找到 {activeCategory.children?.length || 0} 个子分类</p>
                        </div>
                        <div 
                            className="text-[#00B96B] text-sm flex items-center cursor-pointer hover:underline"
                            onClick={() => navigate(`/medicine?categoryId=${activeCategory.id}`)}
                        >
                            查看全部商品 <RightOutlined className="ml-1 text-xs" />
                        </div>
                    </div>

                    {activeCategory.children && activeCategory.children.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                            {activeCategory.children.map(sub => (
                                <div 
                                    key={sub.id}
                                    className="flex flex-col items-center gap-2 cursor-pointer group"
                                    onClick={() => handleSubCategoryClick(sub.id)}
                                >
                                    {sub.icon ? (
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-50 group-hover:bg-[#00B96B]/5 flex items-center justify-center transition-colors">
                                            <img src={sub.icon} alt="" className="w-8 h-8 object-contain" />
                                        </div>
                                    ) : (
                                        <div 
                                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm"
                                            style={{ backgroundColor: getCategoryColor(sub.name) }}
                                        >
                                            <span className="text-white text-2xl font-bold">
                                                {sub.name.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    <span className="text-xs sm:text-sm text-gray-600 text-center group-hover:text-[#00B96B] transition-colors line-clamp-2">
                                        {sub.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Empty description="暂无子分类" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    )}
                </div>
            ) : (
                <Empty description="请选择分类" />
            )}
        </div>
      </div>
    </div>
  );
};

export default CategoryBrowse;
