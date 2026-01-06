import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Card, Row, Col, Empty, Button, message, Avatar, Rate } from 'antd';
import { ShopOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { getMerchantByUserId } from '../../../services/merchant';
import { getMedicineList } from '../../../services/medicine';
import type { Merchant } from '../../../services/merchant';
import type { Medicine } from '../../../services/medicine';

const ShopDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // Fetch merchant info
        const merchantRes = await getMerchantByUserId(Number(id));
        if (merchantRes && merchantRes.code === 200) {
          setMerchant(merchantRes.data);
        }

        // Fetch merchant products
        const productsRes = await getMedicineList({ 
          sellerId: Number(id),
          page: 1,
          size: 100 // Load more for shop page
        });
        
        if (productsRes && productsRes.code === 200) {
          setMedicines(productsRes.data.records);
        }
      } catch (error) {
        console.error('Fetch shop detail failed', error);
        message.error('获取店铺信息失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="text-center mt-20">
        <Empty description="店铺不存在" />
        <Button type="primary" className="mt-4" onClick={() => navigate('/')}>返回首页</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Shop Header */}
      <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-lg p-8 text-white mb-8 shadow-md">
        <div className="flex items-center gap-6">
          <Avatar size={80} icon={<ShopOutlined />} className="bg-white text-green-600" />
          <div>
            <h1 className="text-3xl font-bold mb-2">{merchant.shopName}</h1>
            <p className="opacity-90">{merchant.description || '这家店很懒，什么都没写~'}</p>
            <div className="flex gap-4 mt-4">
               <div className="bg-white/20 px-3 py-1 rounded text-sm">官方认证</div>
               <div className="bg-white/20 px-3 py-1 rounded text-sm">信誉良好</div>
            </div>
          </div>
        </div>
      </div>

      {/* Product List */}
      <h2 className="text-xl font-bold mb-6 border-l-4 border-green-500 pl-3">全部商品 ({medicines.length})</h2>
      
      {medicines.length > 0 ? (
        <Row gutter={[16, 16]}>
          {medicines.map((item) => (
            <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable
                cover={
                  <div className="h-48 overflow-hidden flex items-center justify-center bg-gray-50 p-4">
                    <img 
                      alt={item.name} 
                      src={item.mainImage} 
                      className="h-full w-full object-contain"
                    />
                  </div>
                }
                onClick={() => navigate(`/product/${item.id}`)}
              >
                <Card.Meta
                  title={<div className="font-bold truncate">{item.name}</div>}
                  description={
                    <div>
                      <div className="text-red-500 font-bold text-lg mb-1">¥{item.price.toFixed(2)}</div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>销量 {item.sales}</span>
                        <span>{item.stock > 0 ? '有货' : '缺货'}</span>
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description="暂无商品" />
      )}
    </div>
  );
};

export default ShopDetail;
