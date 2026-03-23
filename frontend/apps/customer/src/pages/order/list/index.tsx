import React, { useEffect, useState } from 'react';
import { Button, Tabs, Empty, Tag, App as AntdApp, Pagination, Modal, Form, Input, Rate, Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ShoppingOutlined, FormOutlined, WalletOutlined, InboxOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { getOrderList, confirmReceipt, commentOrder } from '../../../services/order';
import type { Order } from '../../../services/order';

const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
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
    setLoadError(false);
    try {
      // 订单列表统一按标签页状态和分页参数查询后端。
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
        return;
      }
      message.error(res.message || '获取订单列表失败');
      setOrders([]);
      setPagination((prev) => ({ ...prev, current: page, total: 0 }));
      setLoadError(true);
    } catch (error) {
      message.error('获取订单列表失败');
      setOrders([]);
      setPagination((prev) => ({ ...prev, current: page, total: 0 }));
      setLoadError(true);
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
    // 标签页切换时回到第一页，避免保留旧分页造成结果错位。
    fetchOrders(status, 1);
  }, [activeTab]);

  const handlePay = async (orderId: number) => {
    // 列表页支付直接跳支付页，后续流程统一在收银台处理。
    navigate(`/payment/${orderId}`);
  };

  const handleConfirmReceipt = async (orderId: number) => {
    Modal.confirm({
      title: '确认收货',
      content: '确认已收到商品后，将完成订单。',
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { className: 'bg-emerald-600 border-emerald-600 hover:!bg-emerald-700' },
      async onOk() {
        setActionLoadingId(orderId);
        try {
          // 确认收货成功后刷新当前标签页，马上看到状态变化。
          const res = await confirmReceipt(orderId);
          if (res.code === 200) {
            message.success('收货成功');
            const status = getStatusFromTab(activeTab);
            fetchOrders(status, pagination.current);
            return;
          }
          message.error(res.message || '收货失败');
          throw new Error(res.message || 'confirmReceipt failed');
        } catch (error) {
          message.error('收货失败');
          throw error;
        } finally {
          setActionLoadingId(null);
        }
      }
    });
  };

  const handleReview = (orderId: number) => {
    // 评价弹窗每次都绑定当前订单，避免把内容发错单。
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
        // 评价成功后刷新当前列表，订单状态和评价态一起更新。
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
      // 翻页时保留当前标签对应的订单状态。
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
      return (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-panel p-4 rounded-2xl border border-white/60 bg-white/60 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                <Skeleton active title={{ width: 220 }} paragraph={false} />
                <Skeleton.Button active size="small" />
              </div>
              <div className="flex items-start gap-4">
                <Skeleton.Image active className="!w-20 !h-20 rounded-xl overflow-hidden" />
                <div className="flex-1">
                  <Skeleton active title={{ width: '70%' }} paragraph={{ rows: 2, width: ['50%', '35%'] }} />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
                <Skeleton.Button active size="small" />
                <Skeleton.Button active size="small" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="glass-panel p-10 rounded-2xl border border-white/60 bg-white/60 backdrop-blur-md text-center">
          <Empty description="加载失败，请重试" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          <Button
            type="primary"
            onClick={() => fetchOrders(getStatusFromTab(activeTab), pagination.current)}
            className="mt-6 bg-emerald-600 hover:bg-emerald-700 border-none rounded-full px-8"
          >
            重新加载
          </Button>
        </div>
      );
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
        {orders.map((order, index) => {
          const orderKey = order.id ?? `order-${index}-${order.orderNo}`;
          return (
          <div 
            key={orderKey} 
            className="glass-panel p-4 rounded-2xl hover:shadow-lg transition-all duration-300 border border-white/60 bg-white/60 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:ring-offset-2"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-3">
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md">订单号: {order.orderNo}</span>
                <span>{String(order.createTime || '').includes('T') ? String(order.createTime).split('T')[0] : order.createTime}</span>
              </div>
              <div>{renderOrderStatus(order.status, order.auditStatus)}</div>
            </div>
            
            <div 
              className="flex items-start gap-4 cursor-pointer"
              onClick={() => order.id && navigate(`/order/${order.id}`)}
              role="link"
              tabIndex={0}
              aria-label={`查看订单 ${order.orderNo}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (order.id) navigate(`/order/${order.id}`);
                }
              }}
            >
              <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm group">
                {order.medicineImage ? (
                  <img
                    src={order.medicineImage}
                    alt={order.medicineName}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
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
                  aria-label="立即支付"
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
                  loading={actionLoadingId === order.id}
                  aria-label="确认收货"
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
                  aria-label="评价订单"
                >
                  评价
                </Button>
              )}
              <Button 
                size="small" 
                onClick={() => order.id && navigate(`/order/${order.id}`)}
                className="rounded-full px-4 border-gray-300 hover:border-emerald-500 hover:text-emerald-500"
                aria-label="查看详情"
              >
                查看详情
              </Button>
            </div>
          </div>
          );
        })}
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
        okButtonProps={{ className: 'bg-emerald-600 border-emerald-600 hover:!bg-emerald-700' }}
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
              aria-label="评价内容"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderList;
