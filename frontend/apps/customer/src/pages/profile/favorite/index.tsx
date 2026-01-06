import React, { useEffect, useState } from 'react';
import { Card, List, Button, message, Empty, Spin } from 'antd';
import { HeartFilled, ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getMyFavorites, toggleFavorite } from '../../../services/favorite';
import type { FavoriteItem } from '../../../services/favorite';

const FavoritePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<FavoriteItem[]>([]);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMyFavorites();
      if (res.code === 200) {
        setList(res.data?.records || []);
      }
    } catch (error) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRemove = async (medicineId: number) => {
    try {
      const res = await toggleFavorite({ medicineId });
      if (res.code === 200) {
        message.success('已取消收藏');
        // 移除列表项
        setList(prev => prev.filter(item => item.id !== medicineId));
      } else {
        message.error(res.message || '操作失败');
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleToDetail = (id: number) => {
    navigate(`/product/${id}`);
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Card title={<><HeartFilled className="text-red-500 mr-2" />我的收藏</>}>
        <Spin spinning={loading}>
          {list.length > 0 ? (
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
              dataSource={list}
              renderItem={item => (
                <List.Item>
                  <Card
                    hoverable
                    cover={
                      <div className="h-40 overflow-hidden flex items-center justify-center bg-gray-50" onClick={() => handleToDetail(item.id)}>
                        <img alt={item.name} src={item.mainImage || 'https://via.placeholder.com/150'} className="h-full object-contain" />
                      </div>
                    }
                    actions={[
                      <Button type="text" danger icon={<HeartFilled />} onClick={() => handleRemove(item.id)}>取消</Button>,
                      <Button type="text" icon={<ShoppingCartOutlined />} onClick={() => handleToDetail(item.id)}>购买</Button>
                    ]}
                  >
                    <Card.Meta
                      title={<div className="truncate" onClick={() => handleToDetail(item.id)}>{item.name}</div>}
                      description={
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-red-500 font-bold">¥{item.price}</span>
                          <span className="text-xs text-gray-400">已收藏</span>
                        </div>
                      }
                    />
                  </Card>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无收藏商品" />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default FavoritePage;
