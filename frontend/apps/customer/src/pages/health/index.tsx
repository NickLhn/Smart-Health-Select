import React, { useEffect, useState } from 'react';
import { Button, Tag, List, Empty, Input, App, Skeleton } from 'antd';
import { RobotOutlined, ReadOutlined, HeartOutlined, MedicineBoxOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getArticlePage } from '../../services/article';
import type { HealthArticle } from '../../services/article';
import { useAI } from '../../context/AIContext';

const { Search } = Input;

const HEALTH_TIPS = [
  '每天保持8杯水，促进新陈代谢。',
  '坚持每周至少150分钟的中等强度运动。',
  '减少糖分摄入，预防肥胖和糖尿病。',
  '定期体检，早发现早治疗。',
  '保持充足睡眠，增强免疫力。'
];

const HealthPage: React.FC = () => {
  const navigate = useNavigate();
  const { openAI } = useAI();
  const { message } = App.useApp();
  const [articles, setArticles] = useState<HealthArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [keyword, setKeyword] = useState<string>('');
  const [category, setCategory] = useState<string>('');

  const fetchArticles = async (page: number = 1) => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await getArticlePage({
        page,
        size: 10,
        status: 1,
        title: keyword.trim() ? keyword.trim() : undefined,
        category: category || undefined,
      });
      if (res && res.code === 200) {
        setArticles(res.data.records);
        setTotal(res.data.total);
        setCurrentPage(res.data.current);
        return;
      }
      message.error(res?.message || '获取资讯失败');
      setArticles([]);
      setTotal(0);
      setLoadError(true);
    } catch (error) {
      message.error('获取资讯失败，请稍后重试');
      setArticles([]);
      setTotal(0);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    fetchArticles(1);
  }, [category]);

  const formatDate = (raw?: string) => {
    if (!raw) return '-';
    const str = String(raw);
    return str.includes('T') ? str.split('T')[0] : str;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-subtle via-primary-50/30 to-cyan-50/30 pb-20 md:pb-8 relative overflow-hidden">
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 hidden sm:block">
        <div className="absolute top-[-10%] right-[-5%] w-[520px] h-[520px] rounded-full bg-primary-200/20 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[640px] h-[640px] rounded-full bg-secondary-200/15 blur-3xl" />
        <div className="absolute top-[45%] left-[18%] w-[320px] h-[320px] rounded-full bg-cyan-200/15 blur-3xl" />
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-4 md:py-6 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* AI Consultation Banner */}
            <div className="bg-gradient-to-br from-[#00B96B]/10 to-teal-50 rounded-2xl p-6 md:p-8 relative overflow-hidden border border-[#00B96B]/10 shadow-sm">
              <div className="relative z-10">
                <h2 className="text-2xl font-bold text-[#00B96B] mb-2 flex items-center">
                  <RobotOutlined className="mr-2" />
                  身体不适？
                </h2>
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  试试 AI 智能导诊
                </h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  7x24小时在线，快速分析您的症状，提供专业的健康建议和就医指引。
                </p>
                <Button 
                  type="primary" 
                  size="large" 
                  shape="round" 
                  icon={<RightOutlined />} 
                  onClick={openAI}
                  className="bg-[#00B96B] hover:bg-[#009456] border-none shadow-lg shadow-[#00B96B]/20"
                >
                  立即咨询
                </Button>
              </div>
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
                 <MedicineBoxOutlined style={{ fontSize: '200px', color: '#00B96B' }} />
              </div>
            </div>

            {/* Health Articles */}
            <div className="glass-panel !bg-white/70 rounded-2xl p-4 md:p-6 shadow-soft border border-white/60">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary-600 rounded-full" />
                  <h3 className="text-lg font-bold text-gray-800 flex items-center m-0">
                    <ReadOutlined className="mr-2 text-[#00B96B]" />
                    健康资讯
                  </h3>
                  {category ? (
                    <Tag
                      className="m-0 rounded-full px-3 border-none bg-primary-50 text-primary-700 font-medium"
                      closable
                      onClose={(e) => {
                        e.preventDefault();
                        setCategory('');
                      }}
                    >
                      {category}
                    </Tag>
                  ) : null}
                </div>

                <Search
                  placeholder="搜索资讯标题..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onSearch={() => fetchArticles(1)}
                  allowClear
                  className="md:max-w-[360px]"
                  enterButton={<span className="px-1">搜索</span>}
                  aria-label="搜索健康资讯"
                />
              </div>
              
              {loadError ? (
                <div className="py-10">
                  <Empty description="加载失败，请重试" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  <div className="flex justify-center mt-6">
                    <Button type="primary" className="bg-primary border-primary hover:bg-primary-600" onClick={() => fetchArticles(currentPage)}>
                      重新加载
                    </Button>
                  </div>
                </div>
              ) : (
                <List
                  itemLayout="vertical"
                  size="large"
                  loading={loading}
                  dataSource={loading ? Array.from({ length: 6 }).map((_, i) => ({ id: -i } as unknown as HealthArticle)) : articles}
                  pagination={{
                    onChange: (page) => fetchArticles(page),
                    pageSize: 10,
                    total,
                    current: currentPage,
                    align: 'center',
                    showTotal: (t) => `共 ${t} 篇`,
                    className: 'mt-6',
                  }}
                  renderItem={(item) => {
                    if (loading) {
                      return (
                        <List.Item className="rounded-xl p-4 -mx-4">
                          <div className="flex items-start gap-4">
                            <div className="w-24 h-24 md:w-40 md:h-32 rounded-lg overflow-hidden bg-white/60 flex-shrink-0">
                              <Skeleton.Image active className="w-full h-full" />
                            </div>
                            <div className="flex-1">
                              <Skeleton active title={{ width: '70%' }} paragraph={{ rows: 2, width: ['90%', '70%'] }} />
                            </div>
                          </div>
                        </List.Item>
                      );
                    }

                    return (
                      <List.Item
                        key={item.id}
                        className="group hover:bg-white/50 rounded-xl transition-all duration-300 p-4 -mx-4 cursor-pointer border border-transparent hover:border-white/60 hover:shadow-soft"
                        onClick={() => navigate(`/health/article/${item.id}`)}
                        role="link"
                        tabIndex={0}
                        aria-label={`打开资讯 ${item.title}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            navigate(`/health/article/${item.id}`);
                          }
                        }}
                        extra={
                          item.coverImage ? (
                            <div className="ml-4 overflow-hidden rounded-lg w-24 h-24 md:w-40 md:h-32 flex-shrink-0 bg-gray-100">
                              <img
                                alt={item.title}
                                src={item.coverImage}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                          ) : (
                            <div className="ml-4 overflow-hidden rounded-lg w-24 h-24 md:w-40 md:h-32 flex-shrink-0 bg-gradient-to-br from-primary-50 to-cyan-50 flex items-center justify-center text-primary-300">
                              <ReadOutlined className="text-3xl" />
                            </div>
                          )
                        }
                      >
                        <List.Item.Meta
                          title={
                            <div className="text-base md:text-lg font-bold text-gray-800 group-hover:text-primary transition-colors line-clamp-1">
                              {item.title}
                            </div>
                          }
                          description={
                            <div className="flex flex-wrap items-center gap-2 text-xs mt-2">
                              {item.category ? (
                                <button
                                  type="button"
                                  className="bg-transparent border-0 p-0 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCategory(item.category);
                                  }}
                                  aria-label={`筛选分类 ${item.category}`}
                                >
                                  <Tag className="mr-0 rounded-full px-2 border-none bg-blue-50 text-blue-700 font-medium">
                                    {item.category}
                                  </Tag>
                                </button>
                              ) : null}
                              <span className="text-gray-400">{formatDate(item.createTime)}</span>
                              <span className="text-gray-400">阅读 {item.views ?? 0}</span>
                            </div>
                          }
                        />
                        <div className="text-gray-600 text-sm line-clamp-2 mt-2 leading-relaxed">
                          {item.summary || '暂无摘要'}
                        </div>
                      </List.Item>
                    );
                  }}
                />
              )}
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-6">
            {/* Daily Health Tips */}
            <div className="glass-panel !bg-white/70 rounded-2xl p-6 border border-white/60 shadow-soft">
               <h3 className="text-lg font-bold text-gray-800 flex items-center mb-4">
                  <HeartOutlined className="mr-2 text-red-500" />
                  每日健康小贴士
               </h3>
               <div className="space-y-4">
                 {HEALTH_TIPS.map((item, index) => (
                   <div key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-gray-700 text-sm leading-relaxed">{item}</p>
                   </div>
                 ))}
               </div>
            </div>

            {/* Hot Categories */}
            <div className="glass-panel !bg-white/70 rounded-2xl p-6 shadow-soft border border-white/60">
              <h3 className="text-lg font-bold text-gray-800 mb-4">热门话题</h3>
              <div className="flex flex-wrap gap-2">
                {['减肥塑形', '中医养生', '母婴护理', '心理健康', '急救常识', '美容护肤', '老年健康'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    className="bg-transparent border-0 p-0 cursor-pointer"
                    onClick={() => setCategory(tag)}
                    aria-label={`筛选话题 ${tag}`}
                  >
                    <Tag className={`border-none px-3 py-1.5 text-sm rounded-lg transition-colors m-0 ${category === tag ? 'bg-primary/15 text-primary' : 'bg-gray-100 text-gray-600 hover:bg-primary/10 hover:text-primary'}`}>
                      {tag}
                    </Tag>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthPage;
