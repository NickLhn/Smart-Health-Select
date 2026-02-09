import React, { useEffect, useState } from 'react';
import { Card, Button, Tabs, Empty, List, Tag, Spin, App as AntdApp, Pagination, Modal, Form, Input, Rate } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ShoppingOutlined, ClockCircleOutlined, CheckCircleOutlined, CarOutlined, FormOutlined, WalletOutlined, InboxOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { getOrderList, payOrder, confirmReceipt, commentOrder } from '../../../services/order';
import type { Order } from '../../../services/order';

const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Review Modal State
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm] = Form.useForm();

  const fetchOrders = async (status?: number, page = 1) => {
    setLoading(true);
    try {
      const res = await getOrderList({
        page: page,
        size: pagination.pageSize,
        status: status
      });
      if (res.code === 200) {
        setOrders(res.data.records);
        setPagination(prev => ({
            ...prev,
            current: res.data.current,
            total: res.data.total
        }));
      }
    } catch (error) {
      console.error(error);
      message.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let status: number | undefined;
    switch (activeTab) {
      case 'pending': status = 0; break;
      case 'paid': status = 1; break; // 待发货
      case 'shipped': status = 2; break; // 待收货
      case 'completed': status = 3; break; // 已完成
      case 'audit': status = 7; break; // 待审核
      default: status = undefined;
    }
    // Reset to page 1 when tab changes
    fetchOrders(status, 1);
  }, [activeTab]);

  const handlePay = async (orderId: number) => {
    navigate(`/payment/${orderId}`);
  };

  const handleConfirmReceipt = async (orderId: number) => {
    try {
      const res = await confirmReceipt(orderId);
      if (res.code === 200) {
        message.success('收货成功');
        // Refresh current page
        const status = getStatusFromTab(activeTab);
        fetchOrders(status, pagination.current);
      } else {
        message.error(res.message || '收货失败');
      }
    } catch (error) {
      message.error('收货失败');
    }
  };

  const handleReview = (orderId: number) => {
    setCurrentOrderId(orderId);
    setReviewModalVisible(true);
    reviewForm.resetFields();
  };

  const handleSubmitReview = async () => {
    if (!currentOrderId) return;
    try {
      const values = await reviewForm.validateFields();
      setSubmittingReview(true);
      const res = await commentOrder({
        orderId: currentOrderId,
        ...values
      });
      
      if (res.code === 200) {
        message.success('评价成功');
        setReviewModalVisible(false);
        // Refresh list
        const status = getStatusFromTab(activeTab);
        fetchOrders(status, pagination.current);
      } else {
        message.error(res.message || '评价失败');
      }
    } catch (error) {
      console.error(error);
      // message.error('评价提交失败'); // Form validation error handles itself or generic error
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusFromTab = (tab: string) => {
      switch (tab) {
        case 'pending': return 0;
        case 'paid': return 1;
        case 'shipped': return 2;
        case 'completed': return 3;
        case 'audit': return 7;
        default: return undefined;
      }
  };

  const handlePageChange = (page: number) => {
      const status = getStatusFromTab(activeTab);
      fetchOrders(status, page);
  };

  const renderOrderStatus = (status: number, auditStatus?: number) => {
    if (status === 7) return <Tag color="orange" className="rounded-full px-3">待审核</Tag>;
    if (status === 6 || status === -1) {
        if (auditStatus === 3) return <Tag color="red" className="rounded-full px-3">审核拒绝</Tag>;
        return <Tag color="default" className="rounded-full px-3">已取消</Tag>;
    }
    switch (status) {
      case 0: return <Tag color="red" className="rounded-full px-3">待支付</Tag>;
      case 1: return <Tag color="blue" className="rounded-full px-3">待发货</Tag>;
      case 2: return <Tag color="cyan" className="rounded-full px-3">待收货</Tag>;
      case 8: return <Tag color="purple" className="rounded-full px-3">待揽收</Tag>;
      case 3: return <Tag color="green" className="rounded-full px-3">已完成</Tag>;
      case 4: return <Tag color="purple" className="rounded-full px-3">售后中</Tag>;
      case 5: return <Tag color="default" className="rounded-full px-3">已退款</Tag>;
      default: return <Tag className="rounded-full px-3">未知状态</Tag>;
    }
  };

  const renderOrderList = () => {
    if (loading) {
      return <div className="text-center py-20"><Spin size="large" /></div>;
    }

    if (orders.length === 0) {
      return (
        <Empty 
          description="暂无订单" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          className="py-12"
        >
           <Button type="primary" onClick={() => navigate('/medicine')} className="bg-emerald-500 hover:bg-emerald-600 border-none rounded-full px-8">去逛逛</Button>
        </Empty>
      );
    }

    return (
      <div className="space-y-4 animate-fade-in">
        {orders.map((order, index) => (
          <div 
            key={order.id} 
            className="glass-panel p-4 rounded-2xl hover:shadow-lg transition-all duration-300 border border-white/60 bg-white/60 backdrop-blur-md"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-3">
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md">订单号: {order.orderNo}</span>
                <span>{order.createTime}</span>
              </div>
              <div>{renderOrderStatus(order.status, order.auditStatus)}</div>
            </div>
            
            <div 
              className="flex items-start gap-4 cursor-pointer"
              onClick={() => navigate(`/order/${order.id}`)}
            >
              <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm group">
                {order.medicineImage ? (
                  <img src={order.medicineImage} alt={order.medicineName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ShoppingOutlined className="text-2xl" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-lg mb-1 text-gray-800 truncate">{order.medicineName || '未知商品'}</div>
                <div className="text-gray-500 text-sm mb-2">数量: x{order.quantity}</div>
                <div className="flex items-baseline gap-2">
                    <span className="font-bold text-lg text-emerald-600">¥{order.payAmount.toFixed(2)}</span>
                    <span className="text-xs text-gray-400 line-through">¥{order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end items-center gap-2 mt-4 pt-3 border-t border-gray-100">
              {order.status === 0 && (
                <Button 
                  type="primary" 
                  size="small" 
                  onClick={() => handlePay(order.id)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 border-none rounded-full px-4 hover:shadow-md hover:scale-105 transition-all"
                  icon={<WalletOutlined />}
                >
                  立即支付
                </Button>
              )}
              {order.status === 2 && (
                <Button 
                  type="primary" 
                  ghost 
                  size="small" 
                  onClick={() => handleConfirmReceipt(order.id)}
                  className="border-emerald-500 text-emerald-600 hover:text-emerald-500 hover:border-emerald-400 rounded-full px-4"
                  icon={<InboxOutlined />}
                >
                  确认收货
                </Button>
              )}
              {order.status === 3 && order.commentStatus !== 1 && (
                <Button 
                  size="small" 
                  onClick={() => handleReview(order.id)}
                  className="rounded-full px-4 border-gray-300 hover:border-emerald-500 hover:text-emerald-500"
                  icon={<FormOutlined />}
                >
                  评价
                </Button>
              )}
              <Button 
                size="small" 
                onClick={() => navigate(`/order/${order.id}`)}
                className="rounded-full px-4 border-gray-300 hover:border-emerald-500 hover:text-emerald-500"
              >
                查看详情
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPagination = () => (
      orders.length > 0 && (
        <div className="mt-6 text-right pb-4">
            <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={handlePageChange}
                showTotal={(total) => `共 ${total} 条订单`}
                size="small"
                className="glass-panel inline-block px-4 py-2 rounded-full"
            />
        </div>
      )
  );

  const items = [
    { key: 'all', label: '全部', children: <>{renderOrderList()}{renderPagination()}</> },
    { key: 'pending', label: '待付款', children: <>{renderOrderList()}{renderPagination()}</> },
    { key: 'audit', label: '待审核', children: <>{renderOrderList()}{renderPagination()}</> },
    { key: 'paid', label: '待发货', children: <>{renderOrderList()}{renderPagination()}</> },
    { key: 'shipped', label: '待收货', children: <>{renderOrderList()}{renderPagination()}</> },
    { key: 'completed', label: '已完成', children: <>{renderOrderList()}{renderPagination()}</> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-cyan-50/50 pb-safe">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-2">
            <MedicineBoxOutlined className="text-xl text-emerald-600" />
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 m-0">我的订单</h1>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto py-6 px-4">
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={items}
          type="card"
          className="custom-tabs"
          tabBarStyle={{ marginBottom: 24, border: 'none' }}
        />
      </div>

      <Modal
        title={<span className="text-lg font-bold text-gray-800">评价订单</span>}
        open={reviewModalVisible}
        onOk={handleSubmitReview}
        onCancel={() => setReviewModalVisible(false)}
        confirmLoading={submittingReview}
        centered
        className="rounded-2xl overflow-hidden"
      >
        <Form form={reviewForm} layout="vertical" className="pt-4">
          <Form.Item name="star" label="评分" rules={[{ required: true, message: '请打分' }]} initialValue={5}>
            <Rate className="text-amber-400" />
          </Form.Item>
          <Form.Item name="content" label="评价内容" rules={[{ required: true, message: '请输入评价内容' }]}>
            <Input.TextArea 
              rows={4} 
              placeholder="请输入您的使用体验，帮助更多小伙伴..." 
              className="rounded-xl border-gray-200 focus:border-emerald-500 hover:border-emerald-300"
            />
          </Form.Item>
        </Form>
      </Modal>
      
      <style>{`
        .custom-tabs .ant-tabs-nav .ant-tabs-tab {
            background: transparent;
            border: none;
            font-size: 15px;
            color: #666;
            transition: all 0.3s;
        }
        .custom-tabs .ant-tabs-nav .ant-tabs-tab-active {
            color: #10b981 !important;
            font-weight: 600;
        }
        .custom-tabs .ant-tabs-nav::before {
            border-bottom: none;
        }
        .custom-tabs .ant-tabs-ink-bar {
            background: #10b981;
            height: 3px;
            border-radius: 3px;
        }
        /* Mobile optimization for tabs scrolling */
        .custom-tabs .ant-tabs-nav-list {
            padding-bottom: 4px;
        }
      `}</style>
    </div>
  );
};

export default OrderList;
