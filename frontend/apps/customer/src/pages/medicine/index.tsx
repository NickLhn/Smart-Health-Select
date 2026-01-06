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
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      <Breadcrumb className="mb-4" items={[
        { title: <a href="/">首页</a> },
        { title: '全部药品' }
      ]} />

      <Layout className="bg-transparent">
        {/* Sidebar Filters (Desktop) */}
        <Sider width={240} className="hidden md:block bg-white rounded-lg shadow-sm mr-6 p-4 h-fit" theme="light">
          <div className="mb-4 font-bold text-lg text-gray-800 flex items-center">
            <AppstoreOutlined className="mr-2" /> 商品分类
          </div>
          {renderCategoryMenu()}
        </Sider>

        <Content>
          {/* Toolbar */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
               <Button 
                  className="md:hidden" 
                  icon={<FilterOutlined />} 
                  onClick={() => setMobileFilterOpen(true)}
               >
                 分类
               </Button>
               <div className="font-medium text-gray-600">
                 共 <span className="text-green-600 font-bold">{total}</span> 件商品
               </div>
               {(keyword || categoryId) && (
                 <Button type="link" size="small" onClick={clearFilters} className="text-gray-500">
                   清除筛选
                 </Button>
               )}
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <Select defaultValue="default" value={sort} style={{ width: 140 }} onChange={handleSortChange}>
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
              />
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
               {[...Array(8)].map((_, index) => (
                 <div key={index} className="bg-white rounded-lg border overflow-hidden h-full">
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
                    className="bg-white rounded-lg border hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group flex flex-col h-full"
                    onClick={() => navigate(`/product/${item.id}`)}
                  >
                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                      {item.mainImage ? (
                        <img 
                          src={item.mainImage} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                          暂无图片
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="text-base font-medium text-gray-800 mb-1 line-clamp-2 h-12" title={item.name}>
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">{item.specs || '标准规格'}</p>
                      
                      <div className="mt-auto flex items-center justify-between">
                        <div>
                          <span className="text-red-500 text-lg font-bold">
                            <span className="text-sm">¥</span>{item.price.toFixed(2)}
                          </span>
                          <div className="text-xs text-gray-400 mt-0.5">
                            销量 {item.sales}
                          </div>
                        </div>
                        <Button 
                          type="primary" 
                          shape="circle" 
                          icon={<ShoppingCartOutlined />} 
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
              <div className="bg-white rounded-lg p-12 text-center">
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
                />
              </div>
            )}
        </Content>
      </Layout>

      {/* Mobile Filter Drawer */}
      <Drawer
        title="商品分类"
        placement="left"
        onClose={() => setMobileFilterOpen(false)}
        open={mobileFilterOpen}
        width={280}
      >
        {renderCategoryMenu('inline')}
      </Drawer>
    </div>
  );
};

export default MedicineList;
