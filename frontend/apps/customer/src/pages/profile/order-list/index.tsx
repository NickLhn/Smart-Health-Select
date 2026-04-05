import React, { useEffect, useState } from 'react';
import { List, Tag, Button, Tabs, App, Image, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getOrderList, confirmReceipt } from '@/services/order';
import type { Order, OrderId } from '@/services/order';
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface OrderListProps {
  active?: boolean;
}

const OrderList: React.FC<OrderListProps> = ({ active }) => {
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<string>('all');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchOrders = async (currPage = 1, currStatus = status) => {
    setLoading(true);
    try {
      const params: any = { page: currPage, size: 10 };
      if (currStatus !== 'all') {
        params.status = parseInt(currStatus);
      }
      // 个人中心订单页按标签和分页组合查询。
      const res = await getOrderList(params);
      if (res.code === 200) {
        setOrders(res.data.records);
        setTotal(res.data.total);
        setPage(currPage);
      }
    } catch (error) {
      console.error(error);
      message.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (active) {
      fetchOrders(1, status);
    }
  }, [status, active]);

  const handlePay = (orderId: OrderId) => {
    // 列表页不直接支付，只负责把用户带到统一的 Stripe 收银台入口。
    navigate(`/payment/${orderId}`);
  };
  
  const handleConfirmReceipt = (orderId: OrderId) => {
    modal.confirm({
      title: '确认收货',
      icon: <ExclamationCircleOutlined />,
      content: '确认已收到商品吗？',
      onOk: async () => {
        try {
            // 确认收货后刷新当前列表，立即同步订单状态。
            const res = await confirmReceipt(orderId);
            if (res.code === 200) {
                message.success('确认收货成功');
                fetchOrders(page, status);
            } else {
                message.error(res.message || '操作失败');
            }
        } catch(e) {
            message.error('操作出错');
        }
      }
    });
  };

  const getStatusTag = (status: number) => {
    switch (status) {
      case 0: return <Tag color="orange">待支付</Tag>;
      case 1: return <Tag color="blue">待发货</Tag>;
      case 2: return <Tag color="cyan">待收货</Tag>;
      case 8: return <Tag color="purple">待揽收</Tag>;
      case 3: return <Tag color="green">已完成</Tag>;
      case -1: return <Tag color="red">已取消</Tag>;
      case 4: return <Tag color="purple">售后中</Tag>;
      case 5: return <Tag>已退款</Tag>;
      case 7: return <Tag color="gold">待审核</Tag>;
      default: return <Tag>未知</Tag>;
    }
  };

  const tabs = [
    { key: 'all', label: '全部订单' },
    { key: '0', label: '待支付' },
    { key: '1', label: '待发货' },
    { key: '2', label: '待收货' },
    { key: '3', label: '已完成' },
  ];

  return (
    <div>
      <Tabs
        activeKey={status}
        onChange={setStatus}
        items={tabs}
        className="mb-4"
      />
      <List
        loading={loading}
        dataSource={orders}
        pagination={{
          current: page,
          total,
          pageSize: 10,
          onChange: (p) => fetchOrders(p, status),
        }}
        renderItem={(item) => (
          <List.Item key={item.id} className="block mb-4 glass-panel !bg-white/40 border border-white/60 rounded-2xl p-0 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
             <div className="bg-white/40 px-6 py-3 border-b border-white/60 flex justify-between items-center text-sm text-gray-500 backdrop-blur-sm">
                <span className="font-medium">{item.createTime} <span className="mx-2">|</span> 订单号: {item.orderNo}</span>
                {getStatusTag(item.status)}
             </div>
             <div className="p-6 flex gap-6 items-center">
                <div className="relative group">
                    <Image 
                        src={item.medicineImage || 'https://via.placeholder.com/100'} 
                        width={90} 
                        height={90} 
                        className="rounded-xl object-cover shadow-sm group-hover:shadow-md transition-shadow"
                        fallback="https://via.placeholder.com/100"
                    />
                </div>
                <div className="flex-1">
                    <div className="text-gray-800 font-bold text-lg mb-2 line-clamp-1">
                        {item.medicineName || '药品商品'}
                    </div>
                    <div className="text-gray-500 text-sm bg-white/50 px-2 py-1 rounded-lg inline-block">
                        数量: x{item.quantity || 1}
                    </div>
                </div>
                <div className="text-right min-w-[120px]">
                    <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-600">¥{item.totalAmount.toFixed(2)}</div>
                    <div className="mt-3 flex flex-col gap-2 items-end">
                        <Button size="small" className="rounded-full border-emerald-200 text-emerald-600 hover:text-emerald-700 hover:border-emerald-300 bg-emerald-50/50" onClick={() => navigate(`/order/${item.id}`)}>查看详情</Button>
                        {item.status === 0 && (
                            <Button type="primary" size="small" className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 border-none shadow-md shadow-emerald-500/20" onClick={() => handlePay(item.id)}>去支付</Button>
                        )}
                        {item.status === 2 && (
                             <Button type="primary" size="small" className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 border-none shadow-md shadow-blue-500/20" onClick={() => handleConfirmReceipt(item.id)}>确认收货</Button>
                        )}
                    </div>
                </div>
             </div>
          </List.Item>
        )}
        locale={{ emptyText: <Empty description="暂无相关订单" /> }}
      />
    </div>
  );
};

export default OrderList;
