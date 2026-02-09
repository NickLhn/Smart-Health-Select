import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ReadOutlined, RightOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import type { HealthArticle } from '../../../services/home';

interface HealthNewsProps {
  articles?: HealthArticle[];
}

const HealthNews: React.FC<HealthNewsProps> = ({ articles }) => {
  const navigate = useNavigate();

  if (!articles || articles.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-5 px-1">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary-600 rounded-full"></div>
          <h2 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 m-0 font-display">健康资讯</h2>
        </div>
        <Button type="link" className="text-gray-500 hover:text-primary p-0 flex items-center font-medium" onClick={() => navigate('/health')}>
          更多 <RightOutlined className="text-xs" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map((article) => (
          <div 
            key={article.id}
            className="glass-panel !bg-white/70 p-3 flex md:flex-col gap-4 cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border-0 group"
            onClick={() => navigate(`/health/article/${article.id}`)}
          >
            <div className="w-28 h-24 md:w-full md:h-48 shrink-0 rounded-xl overflow-hidden bg-gray-100 relative">
              {article.coverImage ? (
                <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                  <ReadOutlined style={{ fontSize: 32 }} />
                </div>
              )}
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-primary-700 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                {article.category || '健康'}
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-between py-1 md:px-1">
              <div>
                <h3 className="font-bold text-gray-800 line-clamp-2 mb-2 text-sm md:text-lg leading-snug group-hover:text-primary transition-colors font-display">
                  {article.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 hidden md:block mb-3 leading-relaxed">
                  {article.summary}
                </p>
              </div>
              <div className="text-[10px] text-gray-400 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-primary-400 transition-colors"></span>
                {article.createTime?.split('T')[0]}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HealthNews;
