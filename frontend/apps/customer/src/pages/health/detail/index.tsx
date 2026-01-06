import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Tag, Spin, Button, Breadcrumb, Divider } from 'antd';
import { ClockCircleOutlined, EyeOutlined, LeftOutlined, UserOutlined } from '@ant-design/icons';
import { getArticleDetail } from '@/services/article';
import type { HealthArticle } from '@/services/article';

const { Title, Paragraph } = Typography;

const HealthArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<HealthArticle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await getArticleDetail(Number(id));
        if (res && res.code === 200) {
          setArticle(res.data);
        }
      } catch (error) {
        console.error('Fetch article detail failed', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center mt-20">
        <Title level={4}>文章不存在或已被删除</Title>
        <Button type="primary" onClick={() => navigate('/health')}>返回列表</Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-6">
      <Breadcrumb className="mb-6" items={[
        { title: <a onClick={() => navigate('/')}>首页</a> },
        { title: <a onClick={() => navigate('/health')}>健康资讯</a> },
        { title: '正文' }
      ]} />

      <Card className="shadow-sm">
        <div className="mb-6">
          <Title level={2} className="mb-4">{article.title}</Title>
          <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm">
            <Tag color="blue">{article.category}</Tag>
            <span className="flex items-center gap-1">
              <ClockCircleOutlined /> {article.createTime}
            </span>
            <span className="flex items-center gap-1">
              <EyeOutlined /> 阅读 {article.views}
            </span>
          </div>
        </div>

        {article.coverImage && (
          <div className="mb-8">
            <img 
              src={article.coverImage} 
              alt={article.title} 
              className="w-full max-h-[500px] object-cover rounded-lg shadow-md"
            />
          </div>
        )}

        <div className="prose max-w-none">
          <Paragraph className="text-lg text-gray-600 bg-gray-50 p-4 rounded-lg border-l-4 border-green-500 mb-8">
            <span className="font-bold">摘要：</span>{article.summary}
          </Paragraph>
          
          <div className="article-content text-lg leading-loose text-gray-800">
             {/* Render HTML content safely? For now, just text if it's plain text, 
                 but usually rich text editors output HTML. 
                 Assuming simple text or needing dangerouslySetInnerHTML if it's HTML from rich editor.
                 Since the admin side uses TextArea, it's likely plain text with newlines.
             */}
             <div style={{ whiteSpace: 'pre-wrap' }}>{article.content}</div>
          </div>
        </div>

        <Divider className="my-8" />
        
        <div className="flex justify-between items-center">
          <Button icon={<LeftOutlined />} onClick={() => navigate('/health')}>
            返回列表
          </Button>
          {/* Share or other actions could go here */}
        </div>
      </Card>
    </div>
  );
};

export default HealthArticleDetail;
