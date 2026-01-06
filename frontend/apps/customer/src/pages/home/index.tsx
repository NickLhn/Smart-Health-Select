import React, { useEffect, useState } from 'react';
import { Button, theme, Spin, Empty, App, Carousel, Input, Card, Row, Col, Tag, Avatar, Statistic, Divider, List } from 'antd';
import { 
  MedicineBoxOutlined, 
  ShoppingCartOutlined, 
  SearchOutlined, 
  RightOutlined, 
  FireOutlined, 
  ThunderboltOutlined,
  RobotOutlined,
  ReadOutlined,
  FileTextOutlined,
  GiftOutlined,
  HeartOutlined,
  TeamOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  BellOutlined,
  MenuOutlined,
  AppstoreOutlined,
  CreditCardOutlined,
  CarOutlined,
  WalletOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAI } from '../../context/AIContext';
import { getHomeIndex } from '../../services/home';
import type { HomeIndexVO, Medicine, Category, Banner } from '../../services/home';
import { getCategoryColor } from '../../utils/color';

const { Search } = Input;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { openAI } = useAI();
  const { message } = App.useApp();
  const {
    token: { colorBgContainer, colorPrimary },
  } = theme.useToken();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HomeIndexVO | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getHomeIndex();
      if (res.code === 200) {
        setData(res.data);
      } else {
        message.error(res.message);
      }
    } catch (error) {
      console.error('Failed to fetch home data:', error);
      // message.error('获取首页数据失败');
    } finally {
      setLoading(false);
    }
  };

  const onSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/medicine?keyword=${encodeURIComponent(value.trim())}`);
    } else {
      navigate('/medicine');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        {/* Banner Skeleton */}
        <div className="h-[380px] bg-gray-100 rounded-2xl animate-pulse" />
        {/* Grid Skeleton */}
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
             <div key={i} className="h-[280px] bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // --- Components for the New Layout ---

  const renderCategoryMenu = () => {
    const categories = data?.categories?.slice(0, 10) || [];
    
    return (
      <div className="bg-white rounded-2xl h-full shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 bg-[#00B96B] text-white flex items-center gap-2 font-bold text-base">
          <AppstoreOutlined />
          <span>全部分类</span>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {categories.map((cat) => (
            <div 
              key={cat.id}
              className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-green-50 hover:text-[#00B96B] group transition-colors"
              onClick={() => navigate(`/medicine?categoryId=${cat.id}`)}
            >
              <div className="flex items-center gap-3">
                 {/* Placeholder for category icon if not available */}
                 {cat.icon ? (
                   <img src={cat.icon} className="w-4 h-4 object-contain opacity-60 group-hover:opacity-100" />
                 ) : (
                   <div 
                     className="w-4 h-4 rounded flex items-center justify-center text-white text-[10px] font-bold"
                     style={{ backgroundColor: getCategoryColor(cat.name) }}
                   >
                     {cat.name.charAt(0)}
                   </div>
                 )}
                 <span className="text-sm">{cat.name}</span>
              </div>
              <RightOutlined className="text-xs text-gray-300 group-hover:text-[#00B96B]" />
            </div>
          ))}
          <div 
            className="px-4 py-3 flex items-center justify-center cursor-pointer hover:bg-gray-50 text-gray-500 text-xs border-t border-gray-50 mt-auto"
            onClick={() => navigate('/category')}
          >
            查看更多分类 <RightOutlined className="ml-1 text-[10px]" />
          </div>
        </div>
      </div>
    );
  };

  const renderUserCard = () => (
    <div className="bg-white rounded-2xl h-full p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
      {/* Top: User Info */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <Avatar 
            size={52} 
            src={user?.avatar} 
            icon={<UserOutlined />} 
            className="bg-green-50 text-[#00B96B] border border-green-100"
          />
          <div className="flex-1 overflow-hidden">
            <h3 className="font-bold text-gray-800 m-0 text-sm truncate">
              {isAuthenticated ? (user?.nickname || user?.username) : 'Hi, 欢迎来到智健'}
            </h3>
            {isAuthenticated ? (
               <Tag color="success" className="mt-1 mr-0 text-[10px] border-none bg-green-50 text-green-600">
                 智健会员
               </Tag>
            ) : (
               <div className="flex gap-2 mt-2">
                 <Button type="primary" size="small" shape="round" className="bg-[#00B96B] text-xs h-6 px-3" onClick={() => navigate('/login')}>
                   登录
                 </Button>
                 <Button size="small" shape="round" className="text-xs h-6 px-3" onClick={() => navigate('/register')}>
                   注册
                 </Button>
               </div>
            )}
          </div>
        </div>

        {/* Middle: Stats / Quick Actions */}
        {isAuthenticated && (
          <div className="grid grid-cols-3 gap-1 mb-5 text-center">
            <div className="cursor-pointer hover:bg-gray-50 p-1 rounded-lg transition-colors group" onClick={() => navigate('/orders')}>
              <CreditCardOutlined className="text-lg text-gray-400 group-hover:text-[#00B96B] mb-1 block" />
              <div className="text-xs text-gray-500">待付款</div>
            </div>
            <div className="cursor-pointer hover:bg-gray-50 p-1 rounded-lg transition-colors group" onClick={() => navigate('/orders')}>
              <CarOutlined className="text-lg text-gray-400 group-hover:text-[#00B96B] mb-1 block" />
              <div className="text-xs text-gray-500">待收货</div>
            </div>
            <div className="cursor-pointer hover:bg-gray-50 p-1 rounded-lg transition-colors group" onClick={() => navigate('/profile/coupon')}>
              <WalletOutlined className="text-lg text-gray-400 group-hover:text-[#00B96B] mb-1 block" />
              <div className="text-xs text-gray-500">优惠券</div>
            </div>
          </div>
        )}

        {/* Core Services Links */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-600 hover:text-[#00B96B] cursor-pointer group transition-colors bg-gray-50 p-2 rounded-lg">
            <span className="flex items-center gap-2"><SafetyCertificateOutlined className="text-[#00B96B]" /> 正品保障</span>
            <RightOutlined className="text-[10px] text-gray-300 group-hover:text-[#00B96B]" />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-600 hover:text-[#00B96B] cursor-pointer group transition-colors bg-gray-50 p-2 rounded-lg">
             <span className="flex items-center gap-2"><FileTextOutlined className="text-[#1890ff]" /> 处方审核</span>
             <RightOutlined className="text-[10px] text-gray-300 group-hover:text-[#00B96B]" />
          </div>
        </div>
      </div>

      {/* Bottom: Announcements */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-[#ff4d4f] mb-2 font-bold">
          <BellOutlined /> <span>最新公告</span>
        </div>
        <div className="space-y-1">
           <div className="text-xs text-gray-500 truncate cursor-pointer hover:text-[#00B96B] flex items-center gap-1">
             <span className="w-1 h-1 rounded-full bg-gray-300"></span> 智健优选新版上线通知
           </div>
           <div className="text-xs text-gray-500 truncate cursor-pointer hover:text-[#00B96B] flex items-center gap-1">
             <span className="w-1 h-1 rounded-full bg-gray-300"></span> 夏季防暑降温药品特惠
           </div>
        </div>
      </div>
    </div>
  );

  const renderProductCard = (product: Medicine) => (
    <div 
      key={product.id} 
      className="bg-white rounded-xl p-3 hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col group relative border border-gray-100 hover:border-[#00B96B]/30"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="relative aspect-square bg-gray-50 rounded-lg mb-3 overflow-hidden">
        {product.mainImage ? (
          <img 
            src={product.mainImage} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
            <MedicineBoxOutlined style={{ fontSize: 40, opacity: 0.5 }} />
          </div>
        )}
        {/* Quick Action Overlay (Desktop) */}
        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/50 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 hidden md:flex justify-end">
           <Button 
             type="primary" 
             shape="circle" 
             size="small"
             className="bg-[#00B96B]"
             icon={<ShoppingCartOutlined />}
             onClick={(e) => {
               e.stopPropagation();
               navigate(`/product/${product.id}`);
             }}
           />
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <h3 className="font-bold text-gray-800 line-clamp-2 mb-1 text-[14px] leading-snug group-hover:text-[#00B96B] transition-colors">
          {product.name}
        </h3>
        <p className="text-xs text-gray-400 mb-2 truncate bg-gray-50 py-0.5 px-2 rounded w-fit max-w-full">
          {product.specs || '规格未知'}
        </p>
        
        <div className="flex justify-between items-end mt-auto">
          <div>
             <div className="text-[#ff4d4f] font-bold text-base leading-none">
               <span className="text-xs mr-0.5">¥</span>
               {product.price?.toFixed(2)}
             </div>
             <div className="text-gray-400 text-[10px] mt-1">
               {product.sales > 1000 ? '已售 1k+' : `销量 ${product.sales}`}
             </div>
          </div>
          <Button 
            className="bg-[#00B96B]/10 text-[#00B96B] border-0 hover:bg-[#00B96B] hover:text-white md:hidden"
            size="small" 
            shape="circle"
            icon={<ShoppingCartOutlined />} 
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/product/${product.id}`);
            }}
          />
        </div>
      </div>
    </div>
  );

  const renderServiceGrid = () => {
    const services = [
      { name: 'AI 导诊', icon: <RobotOutlined />, path: '/ai-consultation', color: '#1890ff' },
      { name: '找药品', icon: <SearchOutlined />, path: '/medicine', color: '#00B96B' },
      { name: '健康资讯', icon: <ReadOutlined />, path: '/health', color: '#faad14' },
      { name: '我的订单', icon: <FileTextOutlined />, path: '/orders', color: '#ff4d4f' },
      { name: '购物车', icon: <ShoppingCartOutlined />, path: '/cart', color: '#722ed1' },
      { name: '领券中心', icon: <GiftOutlined />, path: '/profile/coupon', color: '#eb2f96' },
      { name: '我的收藏', icon: <HeartOutlined />, path: '/profile/favorite', color: '#ff7a45' },
      { name: '就诊人', icon: <TeamOutlined />, path: '/profile/patient', color: '#13c2c2' },
    ];

    return (
      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm mb-8 border border-gray-100">
        <div className="grid grid-cols-4 md:grid-cols-8 gap-4 md:gap-6">
          {services.map((item, index) => (
            <div 
              key={index}
              className="flex flex-col items-center justify-center cursor-pointer group"
              onClick={() => item.path === '/ai-consultation' ? openAI() : navigate(item.path)}
            >
              <div 
                className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm"
                style={{ backgroundColor: `${item.color}15` }}
              >
                <span style={{ color: item.color, fontSize: '24px' }}>{item.icon}</span>
              </div>
              <span className="text-xs md:text-sm text-gray-600 font-medium group-hover:text-gray-900">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHealthNews = () => {
    if (!data?.healthArticles || data.healthArticles.length === 0) return null;

    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4 px-1">
          <div className="flex items-center gap-2">
            <ReadOutlined className="text-[#00B96B] text-xl" />
            <h2 className="text-lg md:text-xl font-bold text-gray-800 m-0">健康资讯</h2>
          </div>
          <Button type="link" className="text-gray-500 hover:text-[#00B96B] p-0 flex items-center" onClick={() => navigate('/health')}>
            更多 <RightOutlined className="text-xs" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.healthArticles.map((article) => (
            <div 
              key={article.id}
              className="bg-white rounded-xl p-3 flex md:flex-col gap-3 cursor-pointer hover:shadow-md transition-shadow border border-gray-100 group"
              onClick={() => navigate(`/health/article/${article.id}`)}
            >
              <div className="w-24 h-24 md:w-full md:h-40 shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
                {article.coverImage ? (
                  <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                    <ReadOutlined style={{ fontSize: 32 }} />
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-[#00B96B] text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                  {article.category || '健康'}
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <h3 className="font-bold text-gray-800 line-clamp-2 mb-1 text-sm md:text-base leading-snug group-hover:text-[#00B96B] transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 hidden md:block mb-2">
                    {article.summary}
                  </p>
                </div>
                <div className="text-[10px] text-gray-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                  {article.createTime?.split('T')[0]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="site-layout-content mx-auto max-w-screen-xl px-4 md:px-0">
      
      {/* Search Section (Mobile Only - Desktop has header search) */}
      <div className="md:hidden sticky top-[64px] z-40 bg-[#f5f7fa] py-2 -mx-4 px-4 mb-4">
        <Search 
          placeholder="搜索药品名称、症状..." 
          onSearch={onSearch} 
          enterButton={
            <Button type="primary" className="bg-[#00B96B] border-[#00B96B] hover:bg-[#009456]">
              搜索
            </Button>
          }
          size="large"
          className="w-full shadow-sm rounded-lg"
        />
      </div>

      {/* Hero Section: Categories + Banner + User Card */}
      <div className="mb-6 mt-4">
        <Row gutter={[16, 16]} className="h-auto md:h-[380px]">
          
          {/* Left: Categories (Desktop Only) */}
          <Col xs={0} md={5} className="h-full">
            {renderCategoryMenu()}
          </Col>

          {/* Center: Banner */}
          <Col xs={24} md={14} className="h-full">
            <div className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 h-[180px] md:h-full relative group bg-white">
              {data?.banners && data.banners.length > 0 ? (
                <Carousel autoplay effect="fade" className="h-full">
                  {data.banners.map((banner: Banner) => (
                    <div key={banner.id} className="h-full">
                       <a href={banner.linkUrl || '#'} target={banner.linkUrl ? "_blank" : "_self"} rel="noreferrer" className="block h-[180px] md:h-[380px] relative bg-gray-100">
                          {banner.imageUrl ? (
                            <img src={banner.imageUrl} alt="banner" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-r from-[#00B96B] to-[#007F4F] text-white p-8">
                              <h1 className="text-3xl md:text-5xl font-bold mb-4">智健优选</h1>
                              <p className="text-lg md:text-xl opacity-90">您的专属健康管家</p>
                            </div>
                          )}
                       </a>
                    </div>
                  ))}
                </Carousel>
              ) : (
                <div className="bg-gradient-to-r from-[#00B96B] to-[#007F4F] h-full flex items-center justify-between p-8 text-white relative overflow-hidden h-[180px] md:h-full">
                   <div className="relative z-10">
                     <h1 className="text-2xl md:text-4xl font-bold mb-2">健康生活，由此开始</h1>
                     <p className="opacity-90 mb-6">正品保障 · 专业咨询 · 极速送达</p>
                     <Button size="large" className="bg-white text-[#00B96B] border-none font-bold hover:scale-105 transition-transform" onClick={() => navigate('/medicine')}>
                       立即选购
                     </Button>
                   </div>
                   <MedicineBoxOutlined className="absolute -right-10 -bottom-10 text-[180px] opacity-10 rotate-12" />
                </div>
              )}
            </div>
          </Col>

          {/* Right: User Card (Desktop Only) */}
          <Col xs={0} md={5} className="h-full">
            {renderUserCard()}
          </Col>
        </Row>
      </div>

      {/* Service Grid (King Kong Area) */}
      {renderServiceGrid()}

      {/* Health News Section */}
      {renderHealthNews()}

      {/* Hot Medicines */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 m-0 flex items-center gap-2">
            <FireOutlined className="text-[#ff4d4f]" />
            <span>热门推荐</span>
          </h2>
          <Button type="link" onClick={() => navigate('/medicine')} className="text-gray-500 hover:text-[#00B96B]">
            查看更多 <RightOutlined />
          </Button>
        </div>
        {data?.hotMedicines && data.hotMedicines.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {data.hotMedicines.map(item => renderProductCard(item))}
          </div>
        ) : (
          <Empty description="暂无热门商品" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>

      {/* Recommend Medicines */}
      <div className="mb-12">
         <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 m-0 flex items-center gap-2">
            <ThunderboltOutlined className="text-[#1890ff]" />
            <span>新品上市</span>
          </h2>
          <span className="text-sm text-gray-400">每日上新 品质优选</span>
         </div>
        {data?.recommendMedicines && data.recommendMedicines.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {data.recommendMedicines.map(item => renderProductCard(item))}
          </div>
        ) : (
          <Empty description="暂无推荐商品" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>

    </div>
  );
};

export default Home;
