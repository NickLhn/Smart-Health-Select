import React, { useEffect, useState } from 'react';
import { Card, Button, Tag, List, Typography, Spin, Empty } from 'antd';
import { RobotOutlined, ReadOutlined, HeartOutlined, MedicineBoxOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getArticlePage } from '../../services/article';
import type { HealthArticle } from '../../services/article';
import { useAI } from '../../context/AIContext';

const { Title, Paragraph } = Typography;

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
  const [articles, setArticles] = useState<HealthArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const fetchArticles = async (page: number = 1) => {
    setLoading(true);
    try {
      const res = await getArticlePage({ page, size: 10, status: 1 }); // Fetch only published articles
      if (res && res.code === 200) {
        setArticles(res.data.records);
        setTotal(res.data.total);
        setCurrentPage(res.data.current);
      }
    } catch (error) {
      console.error('Fetch articles failed', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="max-w-[1200px] mx-auto px-4 py-4 md:py-6">
        
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
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <ReadOutlined className="mr-2 text-[#00B96B]" />
                  最新健康资讯
                </h3>
              </div>
              
              <List
                itemLayout="vertical"
                size="large"
                loading={loading}
                dataSource={articles}
                pagination={{
                  onChange: (page) => fetchArticles(page),
                  pageSize: 10,
                  total: total,
                  current: currentPage,
                  align: 'center',
                  className: 'mt-6'
                }}
                renderItem={(item) => (
                  <List.Item
                    key={item.id}
                    className="group hover:bg-gray-50 rounded-xl transition-all duration-300 p-4 -mx-4 cursor-pointer"
                    onClick={() => navigate(`/health/article/${item.id}`)}
                    extra={
                      item.coverImage && (
                        <div className="ml-4 overflow-hidden rounded-lg w-24 h-24 md:w-40 md:h-32 flex-shrink-0">
                           <img
                            alt="cover"
                            src={item.coverImage}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )
                    }
                  >
                    <List.Item.Meta
                      title={
                        <a className="text-base md:text-lg font-bold text-gray-800 group-hover:text-[#00B96B] transition-colors line-clamp-1">
                          {item.title}
                        </a>
                      }
                      description={
                        <div className="flex flex-wrap items-center gap-2 text-xs mt-2">
                          <Tag color="blue" className="mr-0 rounded-full px-2 border-none bg-blue-50 text-blue-600">{item.category}</Tag>
                          <span className="text-gray-400">{item.createTime}</span>
                          <span className="text-gray-400">阅读 {item.views}</span>
                        </div>
                      }
                    />
                    <div className="text-gray-500 text-sm line-clamp-2 mt-2 leading-relaxed">
                      {item.summary}
                    </div>
                  </List.Item>
                )}
              />
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-6">
            {/* Daily Health Tips */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 border border-red-100 shadow-sm">
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
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">热门话题</h3>
              <div className="flex flex-wrap gap-2">
                {['减肥塑形', '中医养生', '母婴护理', '心理健康', '急救常识', '美容护肤', '老年健康'].map(tag => (
                  <Tag 
                    key={tag} 
                    className="cursor-pointer border-none bg-gray-100 text-gray-600 hover:bg-[#00B96B]/10 hover:text-[#00B96B] px-3 py-1.5 text-sm rounded-lg transition-colors m-0"
                  >
                    {tag}
                  </Tag>
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
