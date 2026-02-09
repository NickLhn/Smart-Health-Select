import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SearchOutlined, PlusOutlined, FilterOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button, Input, Spin, Badge, message, Empty, Tag } from 'antd';
import { getCategoryList, getMedicineList } from '../../services/medicine';
import { addToCart } from '../../services/cart';

// Helper to generate consistent colors for categories without icons
const getCategoryColor = (name: string) => {
  const colors = [
    '#00B96B', '#1677FF', '#FF8F1F', '#F5222D', '#722ED1', 
    '#EB2F96', '#13C2C2', '#52C41A', '#FAAD14', '#2F54EB'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const CategoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');
  const [medicineList, setMedicineList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  
  // Initialize from URL params if available
  useEffect(() => {
    const categoryId = searchParams.get('id');
    if (categoryId) {
      setActiveCategoryId(categoryId);
    }
  }, [searchParams]);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getCategoryList();
        // Check if res.data is array directly or inside a property
        // The service returns request.get<Category[]> which usually returns Result<Category[]>
        // Assuming res.data is the array based on usage
        const list = Array.isArray(res.data) ? res.data : [];
        if (list.length > 0) {
          setCategories(list);
          // If no active category selected, select the first one
          if (!activeCategoryId && !searchParams.get('id')) {
            setActiveCategoryId(String(list[0].id));
          }
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        message.error('获取分类失败');
      }
    };
    fetchCategories();
  }, [activeCategoryId, searchParams]);

  // Fetch Medicines when category or page changes
  useEffect(() => {
    if (!activeCategoryId) return;

    const fetchMedicines = async (isRefresh = false) => {
      if (isRefresh) {
        setPage(1);
        setHasMore(true);
      }
      
      if (!isRefresh && !hasMore) return;

      setLoading(true);
      try {
        const currentPage = isRefresh ? 1 : page;
        // Ensure activeCategoryId is number if needed, but service takes number usually.
        // If activeCategoryId is string, convert it.
        const res = await getMedicineList({
          categoryId: Number(activeCategoryId),
          page: currentPage,
          size: 10, // medicine.ts uses 'size', not 'pageSize' in MedicineQuery interface (though typically mapped)
          keyword: searchText
        });

        if (res.success) {
          const newList = res.data.records || []; // PageResult has 'records', not 'list'
          setMedicineList(prev => isRefresh ? newList : [...prev, ...newList]);
          setHasMore(newList.length >= 10);
          if (!isRefresh && newList.length > 0) {
             // Only increment page if we got results
          }
        }
      } catch (error) {
        console.error('Failed to fetch medicines:', error);
        message.error('获取商品失败');
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines(page === 1);
  }, [activeCategoryId, page, searchText]);

  // Handle Category Click
  const handleCategoryClick = (id: string) => {
    if (id === activeCategoryId) return;
    setActiveCategoryId(id);
    setPage(1);
    setMedicineList([]);
    setHasMore(true);
    // Reset scroll
    const scrollDiv = document.getElementById('scrollableDiv');
    if (scrollDiv) scrollDiv.scrollTop = 0;
  };

  // Handle Search
  const handleSearch = (val: string) => {
    setSearchText(val);
    setPage(1);
    setMedicineList([]);
    setHasMore(true);
  };

  // Handle Load More
  const loadMore = () => {
    if (loading || !hasMore) return;
    setPage(prev => prev + 1);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 50 && !loading && hasMore) {
      loadMore();
    }
  };

  // Add to Cart
  const handleAddToCart = async (e: React.MouseEvent, medicine: any) => {
    e.stopPropagation();
    try {
      const res = await addToCart({
        medicineId: medicine.id,
        quantity: 1
      });
      if (res.success) {
        message.success('已加入购物车');
      } else {
        message.error(res.message || '加入失败');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      message.error('加入购物车失败');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row h-screen overflow-hidden relative">
      {/* Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-200/20 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-teal-200/20 blur-3xl" />
      </div>

      {/* Mobile Search Header (Fixed) */}
      <div className="md:hidden glass-panel !bg-white/60 sticky top-0 z-20 px-4 py-3 border-b border-white/20 shadow-sm relative">
        <div className="relative">
          <Input 
            prefix={<SearchOutlined className="text-gray-400" />}
            className="w-full !bg-white/50 !rounded-full !border-white/50 hover:!bg-white focus:!bg-white"
            placeholder="搜索药品名称、功效..."
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
          />
        </div>
      </div>

      {/* Sidebar (Desktop) / Top Horizontal Bar (Mobile) */}
      <div className="
        flex-shrink-0 glass-panel !bg-white/40 md:h-full md:w-72 md:border-r md:border-white/20 z-10
        flex md:flex-col overflow-x-auto md:overflow-y-auto scrollbar-hide
        border-b border-white/20 md:border-b-0 shadow-sm md:shadow-none backdrop-blur-md
      ">
        <div className="hidden md:block p-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-800 to-teal-700">药品分类</span>
          </h2>
          <div className="mt-4 relative">
             <Input 
                prefix={<SearchOutlined className="text-gray-400" />}
                className="w-full !bg-white/50 !border-white/50 !rounded-xl hover:!bg-white focus:!bg-white"
                placeholder="搜索分类..."
             />
          </div>
        </div>

        <div className="flex md:flex-col p-2 md:p-4 gap-2 md:gap-1">
          {categories.map(category => (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(String(category.id))}
              className={`
                relative flex-shrink-0 cursor-pointer group transition-all duration-300
                rounded-full md:rounded-xl px-4 py-2 md:py-3 md:px-4
                flex items-center gap-2 md:gap-3 border
                ${activeCategoryId === String(category.id)
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 border-transparent' 
                  : 'bg-white/40 border-transparent hover:bg-white/60 text-gray-600 hover:shadow-sm'
                }
              `}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-transform duration-300
                ${activeCategoryId === String(category.id) ? 'bg-white/20 text-white scale-110' : 'bg-white/60 text-gray-500 group-hover:scale-110'}
              `}>
                 {category.icon ? (
                    <img src={category.icon} alt="" className="w-5 h-5 object-contain" />
                 ) : (
                    category.name.charAt(0)
                 )}
              </div>
              
              <span className={`text-sm md:text-base font-medium whitespace-nowrap ${activeCategoryId === String(category.id) ? 'text-white' : 'text-gray-700'}`}>
                {category.name}
              </span>
              
              {/* Active Indicator for Desktop */}
              {activeCategoryId === String(category.id) && (
                <div className="hidden md:block absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 h-full overflow-hidden flex flex-col relative">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between px-8 py-6 glass-panel !bg-white/60 border-b border-white/20 z-10">
           <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {categories.find(c => String(c.id) === activeCategoryId)?.name || '全部商品'}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                共找到 {medicineList.length} 件相关商品
              </p>
           </div>
           <div className="relative w-96">
              <Input 
                prefix={<SearchOutlined className="text-gray-400" />}
                className="w-full !bg-white/50 !border-white/50 !rounded-full !py-2 hover:!bg-white focus:!bg-white shadow-sm"
                placeholder="搜索药品名称、品牌、功效..."
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
           </div>
        </div>

        {/* Scrollable Product List */}
        <div 
          className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-8" 
          id="scrollableDiv"
          onScroll={handleScroll}
        >
            {loading && page === 1 ? (
               <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                  <p className="text-gray-400 text-sm">正在加载商品...</p>
               </div>
            ) : medicineList.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <Empty description="暂无相关商品" />
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-20 md:pb-8">
                {medicineList.map(medicine => (
                  <div 
                    key={medicine.id}
                    onClick={() => navigate(`/product/${medicine.id}`)}
                    className="group glass-panel !bg-white/70 rounded-2xl p-4 md:p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-white/40 flex flex-row md:flex-col gap-4 cursor-pointer relative overflow-hidden"
                  >
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Image Section */}
                    <div className="w-24 h-24 md:w-full md:h-48 flex-shrink-0 bg-white/50 rounded-xl overflow-hidden relative shadow-inner">
                       {medicine.mainImage ? (
                          <img 
                            src={medicine.mainImage} 
                            alt={medicine.name} 
                            className="w-full h-full object-contain p-2 md:p-4 mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                          />
                       ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                             <span className="text-xs">暂无图片</span>
                          </div>
                       )}
                       {medicine.prescriptionType && (
                          <div className={`
                            absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold border
                            ${medicine.prescriptionType === 'OTC' 
                                ? 'bg-green-50 text-green-600 border-green-200' 
                                : 'bg-red-50 text-red-600 border-red-200'}
                          `}>
                            {medicine.prescriptionType}
                          </div>
                       )}
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 flex flex-col justify-between">
                       <div>
                          <h3 className="text-base md:text-lg font-bold text-gray-800 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                            {medicine.name}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-500 mt-1 line-clamp-1">
                            {medicine.manufacturer}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(medicine.tags || []).slice(0, 2).map((tag: string, idx: number) => (
                              <Tag key={idx} className="mr-0">
                                {tag}
                              </Tag>
                            ))}
                          </div>
                       </div>
                       
                       <div className="flex items-center justify-between mt-3 md:mt-4">
                          <div className="flex items-baseline gap-1">
                             <span className="text-xs text-red-500 font-bold">¥</span>
                             <span className="text-lg md:text-xl font-bold text-red-500">{medicine.price}</span>
                          </div>
                          <Button 
                            type="primary"
                            shape="circle"
                            size="small"
                            className="!bg-gradient-to-r !from-emerald-500 !to-teal-600 !border-none !shadow-md !shadow-emerald-200 hover:!shadow-lg hover:!scale-105 active:!scale-95 transition-all flex items-center justify-center"
                            onClick={(e) => handleAddToCart(e, medicine)}
                            icon={<PlusOutlined />}
                          />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {loading && page > 1 && (
               <div className="text-center py-4 text-gray-400 text-sm">
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 20 }} spin />} /> 加载更多...
               </div>
            )}
            {!hasMore && medicineList.length > 0 && (
               <div className="text-center py-4 text-gray-400 text-sm">
                  没有更多了
               </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
