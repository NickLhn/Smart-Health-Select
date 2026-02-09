import React, { useEffect, useState } from 'react';
import { Button, App, Carousel, Input, Row, Col, Empty } from 'antd';
import { 
  MedicineBoxOutlined, 
  FireOutlined, 
  ThunderboltOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAI } from '../../context/AIContext';
import { getHomeIndex } from '../../services/home';
import type { HomeIndexVO, Banner } from '../../services/home';
import CategoryMenu from './components/CategoryMenu';
import UserCard from './components/UserCard';
import ServiceGrid from './components/ServiceGrid';
import HealthNews from './components/HealthNews';
import ProductCard from './components/ProductCard';

const { Search } = Input;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();

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
      <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary-200/20 blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-secondary-200/20 blur-3xl" />
        </div>

        {/* Banner Skeleton */}
        <div className="h-[380px] glass-panel bg-white/50 animate-pulse relative z-10" />
        {/* Grid Skeleton */}
        <div className="grid grid-cols-5 gap-4 relative z-10">
          {[...Array(5)].map((_, i) => (
             <div key={i} className="h-[280px] glass-panel bg-white/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-subtle relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary-200/20 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-secondary-200/20 blur-3xl" />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] rounded-full bg-cyan-200/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-0 py-6 relative z-10">
        
        {/* Search Section (Mobile Only - Desktop has header search) */}
        <div className="md:hidden sticky top-[64px] z-40 bg-white/70 backdrop-blur-xl py-3 -mx-4 px-4 mb-4 border-b border-white/50 shadow-sm">
          <Search 
            placeholder="搜索药品名称、症状..." 
            onSearch={onSearch} 
            enterButton={
              <Button type="primary" className="bg-primary border-primary hover:bg-primary-600 shadow-md shadow-primary/20">
                搜索
              </Button>
            }
            size="large"
            className="w-full shadow-sm rounded-xl [&_.ant-input-wrapper]:overflow-hidden [&_.ant-input-wrapper]:rounded-xl [&_.ant-input]:bg-white"
          />
        </div>

        {/* Hero Section: Categories + Banner + User Card */}
        <div className="mb-8 mt-2">
          <Row gutter={[24, 24]} className="h-auto md:h-[420px]">
            
            {/* Left: Categories (Desktop Only) */}
            <Col xs={0} md={5} className="h-full hidden md:block">
              <CategoryMenu categories={data?.categories || []} />
            </Col>

            {/* Center: Banner */}
            <Col xs={24} md={14} className="h-full">
              <div className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 h-[200px] md:h-full relative group glass-panel !bg-white/60 !border-0 p-0">
                {data?.banners && data.banners.length > 0 ? (
                  <Carousel autoplay effect="fade" className="h-full [&_.slick-dots-bottom]:bottom-4">
                    {data.banners.map((banner: Banner) => (
                      <div key={banner.id} className="h-full">
                         <a href={banner.linkUrl || '#'} target={banner.linkUrl ? "_blank" : "_self"} rel="noreferrer" className="block h-[200px] md:h-[420px] relative bg-gray-100">
                            {banner.imageUrl ? (
                              <img src={banner.imageUrl} alt="banner" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 text-white p-8">
                                <h1 className="text-3xl md:text-5xl font-bold mb-4 font-display">智健优选</h1>
                                <p className="text-lg md:text-xl opacity-90">您的专属健康管家</p>
                              </div>
                            )}
                         </a>
                      </div>
                    ))}
                  </Carousel>
                ) : (
                  <div className="bg-gradient-to-br from-primary to-primary-700 h-full flex items-center justify-between p-8 md:p-12 text-white relative overflow-hidden h-[200px] md:h-full">
                     <div className="relative z-10 max-w-[60%]">
                       <h1 className="text-2xl md:text-5xl font-bold mb-4 font-display leading-tight">健康生活<br/>由此开始</h1>
                       <p className="opacity-90 mb-8 text-sm md:text-lg font-medium">正品保障 · 专业咨询 · 极速送达</p>
                       <Button size="large" className="bg-white text-primary border-none font-bold hover:scale-105 transition-transform h-12 px-8 rounded-full shadow-lg shadow-primary-900/20" onClick={() => navigate('/medicine')}>
                         立即选购
                       </Button>
                     </div>
                     <MedicineBoxOutlined className="absolute -right-16 -bottom-16 text-[240px] opacity-10 rotate-12" />
                     {/* Decorative circles */}
                     <div className="absolute top-10 right-10 w-20 h-20 bg-white opacity-5 rounded-full blur-xl"></div>
                     <div className="absolute bottom-20 left-1/2 w-32 h-32 bg-primary-300 opacity-10 rounded-full blur-2xl"></div>
                  </div>
                )}
              </div>
            </Col>

            {/* Right: User Card (Desktop Only) */}
            <Col xs={0} md={5} className="h-full hidden md:block">
              <UserCard />
            </Col>
          </Row>
        </div>

        {/* Service Grid (King Kong Area) */}
        <ServiceGrid />

        {/* Health News Section */}
        <HealthNews articles={data?.healthArticles} />

        {/* Hot Medicines */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 m-0 flex items-center gap-3 font-display">
              <FireOutlined className="text-rose-500" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">热门推荐</span>
            </h2>
            <Button type="link" onClick={() => navigate('/medicine')} className="text-gray-500 hover:text-primary font-medium">
              查看更多 <RightOutlined />
            </Button>
          </div>
          {data?.hotMedicines && data.hotMedicines.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {data.hotMedicines.map(item => (
                  <ProductCard key={item.id} product={item} />
                ))}
            </div>
          ) : (
          <Empty description="暂无热门商品" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>

      {/* Recommend Medicines */}
      <div className="mb-12">
         <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 m-0 flex items-center gap-2">
            <ThunderboltOutlined className="text-blue-500" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">新品上市</span>
          </h2>
          <span className="text-sm text-gray-400">每日上新 品质优选</span>
         </div>
        {data?.recommendMedicines && data.recommendMedicines.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {data.recommendMedicines.map(item => (
                <ProductCard key={item.id} product={item} />
              ))}
          </div>
        ) : (
          <Empty description="暂无推荐商品" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>

    </div>
  </div>
  );
};

export default Home;
