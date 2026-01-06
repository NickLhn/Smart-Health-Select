import React, { useEffect, useState } from 'react';
import { List, Tag, Button, Tabs, App, Image, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getOrderList, payOrder, confirmReceipt } from '@/services/order';
import type { Order } from '@/services/order';
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

  const handlePay = async (orderId: number) => {
    try {
      const res = await payOrder(orderId);
      if (res.code === 200) {
        message.success('支付成功');
        fetchOrders(page, status);
      } else {
        message.error(res.message || '支付失败');
      }
    } catch (error) {
      message.error('支付出错');
    }
  };
  
  const handleConfirmReceipt = (orderId: number) => {
    modal.confirm({
      title: '确认收货',
      icon: <ExclamationCircleOutlined />,
      content: '确认已收到商品吗？',
      onOk: async () => {
        try {
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
          <List.Item key={item.id} className="block mb-4 border rounded-lg p-0 overflow-hidden hover:shadow-md transition-shadow">
             <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center text-sm text-gray-500">
                <span>{item.createTime} 订单号: {item.orderNo}</span>
                {getStatusTag(item.status)}
             </div>
             <div className="p-4 flex gap-4">
                <Image 
                    src={item.medicineImage || 'https://via.placeholder.com/100'} 
                    width={80} 
                    height={80} 
                    className="rounded object-cover"
                    fallback="https://via.placeholder.com/100"
                />
                <div className="flex-1">
                    <div className="text-gray-500 text-sm">
                        数量: x{item.quantity || 1}
                    </div>
                </div>
                <div className="text-right min-w-[100px]">
                    <div className="text-lg font-bold text-red-500">¥{item.totalAmount.toFixed(2)}</div>
                    <div className="mt-2 space-x-2">
                        <Button size="small" onClick={() => navigate(`/order/${item.id}`)}>查看详情</Button>
                        {item.status === 0 && (
                            <Button type="primary" size="small" onClick={() => handlePay(item.id)}>去支付</Button>
                        )}
                        {item.status === 2 && (
                             <Button type="primary" size="small" onClick={() => handleConfirmReceipt(item.id)}>确认收货</Button>
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
