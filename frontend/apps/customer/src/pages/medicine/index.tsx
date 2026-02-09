import React, { useState, useEffect } from 'react';
import { Layout, Input, List, Card, Row, Col, Select, Empty, Pagination, Spin, Button, Breadcrumb, Menu, Rate, Tag, Divider, Drawer } from 'antd';
import { SearchOutlined, FilterOutlined, AppstoreOutlined, BarsOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMedicineList, getCategoryList } from '../../services/medicine';
import type { Medicine, Category } from '../../services/medicine';

const { Sider, Content } = Layout;
const { Search } = Input;
const { Option } = Select;

const MedicineList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [loading, setLoading] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Query Params
  const keyword = searchParams.get('keyword') || '';
  const categoryId = Number(searchParams.get('categoryId')) || undefined;
  const page = Number(searchParams.get('page')) || 1;
  const size = Number(searchParams.get('size')) || 12;
  const sort = searchParams.get('sort') || 'default';

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getCategoryList();
        if (res.code === 200) {
          setCategories(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Medicines
  useEffect(() => {
    const fetchMedicines = async () => {
      setLoading(true);
      try {
        const res = await getMedicineList({
          page,
          size,
          keyword,
          categoryId,
          sort
        });
        if (res.code === 200) {
          setMedicines(res.data.records);
          setTotal(res.data.total);
        }
      } catch (error) {
        console.error('Failed to fetch medicines:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMedicines();
  }, [keyword, categoryId, page, size, sort]);

  // Handlers
  const handleSearch = (value: string) => {
    setSearchParams({ ...Object.fromEntries(searchParams), keyword: value, page: '1' });
  };

  const handleCategoryChange = (id: string) => {
    setSearchParams({ ...Object.fromEntries(searchParams), categoryId: id, page: '1' });
    setMobileFilterOpen(false);
  };

  const handleSortChange = (value: string) => {
    setSearchParams({ ...Object.fromEntries(searchParams), sort: value, page: '1' });
  };

  const handlePageChange = (p: number, s: number) => {
    setSearchParams({ ...Object.fromEntries(searchParams), page: String(p), size: String(s) });
  };

  const clearFilters = () => {
    setSearchParams({ page: '1', size: String(size) });
  };

  // Render Category Menu
  const renderCategoryMenu = (mode: 'inline' | 'vertical' = 'inline') => {
    const items = [
      { key: 'all', label: '全部商品', onClick: () => handleCategoryChange('') },
      ...categories.map(cat => ({
        key: String(cat.id),
        label: cat.name,
        children: cat.children?.map(child => ({
          key: String(child.id),
          label: child.name,
          onClick: () => handleCategoryChange(String(child.id))
        })),
        onClick: cat.children ? undefined : () => handleCategoryChange(String(cat.id))
      }))
    ];

    return (
      <Menu
        mode={mode}
        selectedKeys={[categoryId ? String(categoryId) : 'all']}
        style={{ borderRight: 0, background: 'transparent' }}
        items={items}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 md:p-6">
      <div className="max-w-[1200px] mx-auto">
        <Breadcrumb className="mb-4" items={[
          { title: <a href="/" className="hover:text-emerald-600 transition-colors">首页</a> },
          { title: '全部药品' }
        ]} />

        <Layout className="bg-transparent">
          {/* Sidebar Filters (Desktop) */}
          <Sider width={260} className="hidden md:block glass-panel mr-6 p-4 h-fit !bg-white/60 !border-0 rounded-2xl" theme="light">
            <div className="mb-4 font-bold text-lg text-gray-800 flex items-center px-4">
              <AppstoreOutlined className="mr-2 text-emerald-600" /> 
              <span className="text-gradient-primary">商品分类</span>
            </div>
            {renderCategoryMenu()}
          </Sider>

          <Content>
            {/* Toolbar */}
            <div className="glass-panel p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 !bg-white/60 !border-0 rounded-2xl">
              <div className="flex items-center gap-4 w-full md:w-auto">
                 <Button 
                    className="md:hidden border-emerald-200 text-emerald-600" 
                    icon={<FilterOutlined />} 
                    onClick={() => setMobileFilterOpen(true)}
                 >
                   分类
                 </Button>
                 <div className="font-medium text-gray-600">
                   共 <span className="text-emerald-600 font-bold">{total}</span> 件商品
                 </div>
                 {(keyword || categoryId) && (
                   <Button type="link" size="small" onClick={clearFilters} className="text-gray-500 hover:text-emerald-600">
                     清除筛选
                   </Button>
                 )}
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <Select 
                  defaultValue="default" 
                  value={sort} 
                  style={{ width: 140 }} 
                  onChange={handleSortChange}
                  popupClassName="rounded-xl"
                >
                  <Option value="default">默认排序</Option>
                  <Option value="price_asc">价格从低到高</Option>
                  <Option value="price_desc">价格从高到低</Option>
                  <Option value="sales_desc">销量从高到低</Option>
                </Select>
                <Search
                  placeholder="搜索药品..."
                  onSearch={handleSearch}
                  defaultValue={keyword}
                  style={{ width: 200 }}
                  allowClear
                  className="rounded-full"
                />
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 {[...Array(8)].map((_, index) => (
                   <div key={index} className="glass-panel rounded-2xl overflow-hidden h-full !bg-white/60 !border-0">
                     <div className="h-48 bg-gray-100 animate-pulse" />
                     <div className="p-4 flex flex-col gap-2">
                       <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
                       <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
                       <div className="mt-4 flex justify-between items-center">
                         <div className="h-6 bg-gray-100 rounded w-1/3 animate-pulse" />
                         <div className="h-8 w-8 bg-gray-100 rounded-full animate-pulse" />
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            ) : medicines.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {medicines.map(item => (
                    <div 
                      key={item.id} 
                      className="glass-panel !bg-white/70 rounded-2xl border-0 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group flex flex-col h-full relative"
                      onClick={() => navigate(`/product/${item.id}`)}
                    >
                      <div className="h-48 bg-gray-50 relative overflow-hidden">
                        {item.mainImage ? (
                          <img 
                            src={item.mainImage} 
                            alt={item.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50/50">
                            <div className="text-center">
                              <AppstoreOutlined className="text-2xl mb-2 opacity-50" />
                              <div className="text-xs">暂无图片</div>
                            </div>
                          </div>
                        )}
                        {/* Overlay Gradient on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="text-base font-medium text-gray-800 mb-1 line-clamp-2 h-12 group-hover:text-emerald-600 transition-colors" title={item.name}>
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-500 mb-3 bg-gray-100 w-fit px-2 py-0.5 rounded-full">
                          {item.specs || '标准规格'}
                        </p>
                        
                        <div className="mt-auto flex items-center justify-between">
                          <div>
                            <span className="text-rose-500 text-lg font-bold">
                              <span className="text-sm mr-0.5">¥</span>{item.price.toFixed(2)}
                            </span>
                            <div className="text-xs text-gray-400 mt-0.5">
                              销量 {item.sales}
                            </div>
                          </div>
                          <Button 
                            type="primary" 
                            shape="circle" 
                            size="large"
                            icon={<ShoppingCartOutlined />} 
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 border-none shadow-md hover:shadow-lg hover:!scale-105 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/product/${item.id}`);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-panel !bg-white/60 rounded-2xl p-12 text-center">
                  <Empty description="暂无相关药品" />
                </div>
              )}

              {/* Pagination */}
              {!loading && total > 0 && (
                <div className="mt-8 flex justify-center">
                  <Pagination
                    current={page}
                    pageSize={size}
                    total={total}
                    onChange={handlePageChange}
                    showSizeChanger
                    showQuickJumper
                    className="glass-panel !bg-white/50 px-4 py-2 rounded-full"
                  />
                </div>
              )}
          </Content>
        </Layout>

        {/* Mobile Filter Drawer */}
        <Drawer
          title={<span className="text-gradient-primary font-bold">商品分类</span>}
          placement="left"
          onClose={() => setMobileFilterOpen(false)}
          open={mobileFilterOpen}
          width={280}
          headerStyle={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}
          bodyStyle={{ padding: 0 }}
        >
          {renderCategoryMenu('inline')}
        </Drawer>
      </div>
    </div>
  );
};

export default MedicineList;
