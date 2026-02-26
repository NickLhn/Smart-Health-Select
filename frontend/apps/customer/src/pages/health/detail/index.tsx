import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tag, Spin, Button, Breadcrumb, Divider, Empty, App } from 'antd';
import { ClockCircleOutlined, EyeOutlined, LeftOutlined } from '@ant-design/icons';
import { getArticleDetail } from '@/services/article';
import type { HealthArticle } from '@/services/article';

const HealthArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [article, setArticle] = useState<HealthArticle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(false);
    try {
      const res = await getArticleDetail(Number(id));
      if (res && res.code === 200) {
        setArticle(res.data);
        return;
      }
      message.error(res?.message || '获取文章失败');
      setArticle(null);
      setLoadError(true);
    } catch (error) {
      message.error('获取文章失败，请稍后重试');
      setArticle(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const formatDate = (raw?: string) => {
    if (!raw) return '-';
    const str = String(raw);
    return str.includes('T') ? str.split('T')[0] : str;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-subtle via-primary-50/30 to-cyan-50/30 flex items-center justify-center px-4">
        <div className="glass-panel !bg-white/70 rounded-3xl p-10 w-full max-w-lg text-center">
          <Spin size="large" />
          <div className="mt-4 text-gray-500 font-medium">正在加载文章...</div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-subtle via-primary-50/30 to-cyan-50/30 flex items-center justify-center px-4 py-16">
        <div className="glass-panel !bg-white/70 rounded-3xl p-10 w-full max-w-lg text-center">
          <Empty description={loadError ? '加载失败，请重试' : '文章不存在或已被删除'} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          <div className="flex justify-center gap-3 mt-6">
            {loadError ? (
              <Button type="primary" className="bg-primary border-primary hover:bg-primary-600" onClick={fetchDetail}>
                重新加载
              </Button>
            ) : null}
            <Button onClick={() => navigate('/health')}>返回列表</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-subtle via-primary-50/30 to-cyan-50/30 pb-20 md:pb-8">
      <div className="max-w-[1000px] mx-auto px-4 py-6">
        <div className="md:hidden sticky top-0 z-40 bg-white/70 backdrop-blur-xl -mx-4 px-4 py-3 border-b border-white/60 flex items-center">
          <Button type="text" icon={<LeftOutlined />} className="-ml-2 text-gray-600" onClick={() => navigate(-1)} aria-label="返回" />
          <div className="flex-1 text-center font-bold text-gray-800 px-6 truncate">健康资讯</div>
        </div>

        <Breadcrumb className="mb-6 hidden md:block" items={[
          { title: <button type="button" className="bg-transparent border-0 p-0 cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/')}>首页</button> },
          { title: <button type="button" className="bg-transparent border-0 p-0 cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/health')}>健康资讯</button> },
          { title: '正文' }
        ]} />

        <div className="glass-panel !bg-white/70 rounded-3xl p-6 md:p-10 shadow-soft border border-white/60">
          <div className="mb-6">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 leading-tight font-display m-0">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-gray-500 text-sm mt-4">
              {article.category ? (
                <Tag className="m-0 rounded-full px-3 border-none bg-blue-50 text-blue-700 font-medium">
                  {article.category}
                </Tag>
              ) : null}
              <span className="flex items-center gap-1">
                <ClockCircleOutlined /> {formatDate(article.createTime)}
              </span>
              <span className="flex items-center gap-1">
                <EyeOutlined /> 阅读 {article.views ?? 0}
              </span>
            </div>
          </div>

          {article.coverImage ? (
            <div className="mb-8 rounded-2xl overflow-hidden bg-gray-100 border border-white/60 shadow-soft">
              <img
                src={article.coverImage}
                alt={article.title}
                loading="lazy"
                decoding="async"
                className="w-full max-h-[520px] object-cover"
              />
            </div>
          ) : null}

          {article.summary ? (
            <div className="text-gray-700 bg-white/60 p-5 rounded-2xl border border-white/60 shadow-sm mb-8">
              <div className="font-bold text-gray-900 mb-2">摘要</div>
              <div className="text-gray-600 leading-relaxed">{article.summary}</div>
            </div>
          ) : null}
          
          <div className="text-gray-800 leading-loose text-base md:text-lg">
            <div style={{ whiteSpace: 'pre-wrap' }}>{article.content}</div>
          </div>

          <Divider className="my-8" />
          
          <div className="flex justify-between items-center">
            <Button icon={<LeftOutlined />} onClick={() => navigate('/health')}>
              返回列表
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthArticleDetail;
