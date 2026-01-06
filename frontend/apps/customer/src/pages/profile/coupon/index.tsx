import React, { useEffect, useState } from 'react';
import { Card, Tabs, List, Tag, Button, message, Empty, Spin } from 'antd';
import { ClockCircleOutlined, DollarCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getMyCoupons, getAvailableCoupons, receiveCoupon } from '../../../services/coupon';
import type { UserCoupon } from '../../../services/coupon';

const CouponItem: React.FC<{ 
  item: UserCoupon; 
  type: 'my' | 'market';
  onReceive?: (id: number) => void; 
}> = ({ item, type, onReceive }) => {
  const isExpired = type === 'my' && item.useStatus === 2;
  const isUsed = type === 'my' && item.useStatus === 1;
  
  return (
    <Card 
      className={`mb-4 ${isExpired || isUsed ? 'opacity-60 grayscale' : ''}`}
      styles={{ body: { padding: '16px' } }}
      hoverable={type === 'market'}
    >
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="flex items-baseline text-red-500 mb-2">
            <span className="text-sm">¥</span>
            <span className="text-3xl font-bold mx-1">{item.amount}</span>
            <span className="text-gray-500 text-sm ml-2">
              {item.minPoint > 0 ? `满${item.minPoint}可用` : '无门槛'}
            </span>
          </div>
          <div className="text-lg font-medium mb-1">{item.name}</div>
          <div className="text-gray-400 text-xs flex items-center">
            <ClockCircleOutlined className="mr-1" />
            {dayjs(item.startTime).format('YYYY.MM.DD')} - {dayjs(item.endTime).format('YYYY.MM.DD')}
          </div>
        </div>
        
        <div className="ml-4 flex flex-col items-end justify-center min-w-[80px]">
          {type === 'market' ? (
            <Button type="primary" shape="round" onClick={() => onReceive?.(item.id)}>
              立即领取
            </Button>
          ) : (
            <Tag color={isUsed ? 'default' : isExpired ? 'error' : 'green'}>
              {isUsed ? '已使用' : isExpired ? '已过期' : '去使用'}
            </Tag>
          )}
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-dashed border-gray-200 text-xs text-gray-500">
        <Tag className="mr-2">{item.type === 0 ? '全场通用' : item.type === 1 ? '指定分类' : '指定商品'}</Tag>
        限{item.perLimit ? `每人${item.perLimit}张` : '不限'}
      </div>
    </Card>
  );
};

const MyCoupons: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [status, setStatus] = useState<number>(0); // 0未使用 1已使用 2已过期

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMyCoupons(status);
      if (res.code === 200) {
        setCoupons(res.data || []);
      }
    } catch (error) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [status]);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <Button type={status === 0 ? 'primary' : 'default'} onClick={() => setStatus(0)}>未使用</Button>
        <Button type={status === 1 ? 'primary' : 'default'} onClick={() => setStatus(1)}>已使用</Button>
        <Button type={status === 2 ? 'primary' : 'default'} onClick={() => setStatus(2)}>已过期</Button>
      </div>
      
      <Spin spinning={loading}>
        {coupons.length > 0 ? (
          coupons.map(item => (
            <CouponItem key={item.id} item={item} type="my" />
          ))
        ) : (
          <Empty description="暂无优惠券" />
        )}
      </Spin>
    </div>
  );
};

const CouponMarket: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<UserCoupon[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAvailableCoupons();
      if (res.code === 200) {
        setList(res.data || []);
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

  const handleReceive = async (id: number) => {
    try {
      const res = await receiveCoupon(id);
      if (res.code === 200) {
        message.success('领取成功');
        fetchData();
      } else {
        message.error(res.message || '领取失败');
      }
    } catch (error) {
      message.error('领取失败');
    }
  };

  return (
    <Spin spinning={loading}>
      {list.length > 0 ? (
        list.map(item => (
          <CouponItem key={item.id} item={item} type="market" onReceive={handleReceive} />
        ))
      ) : (
        <Empty description="暂无优惠券可领" />
      )}
    </Spin>
  );
};

const CouponPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto p-4">
      <Card title={<><DollarCircleOutlined /> 我的优惠券</>}>
        <Tabs defaultActiveKey="1" items={[
          { key: '1', label: '我的优惠券', children: <MyCoupons /> },
          { key: '2', label: '领券中心', children: <CouponMarket /> },
        ]} />
      </Card>
    </div>
  );
};

export default CouponPage;
