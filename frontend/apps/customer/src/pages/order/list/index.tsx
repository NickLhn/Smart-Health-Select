import React, { useEffect, useState } from 'react';
import { Card, Button, Tabs, Empty, List, Tag, Spin, App as AntdApp, Pagination, Modal, Form, Input, Rate } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ShoppingOutlined, ClockCircleOutlined, CheckCircleOutlined, CarOutlined, FormOutlined } from '@ant-design/icons';
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
    if (status === 7) return <Tag color="orange">待审核</Tag>;
    if (status === 6 || status === -1) {
        if (auditStatus === 3) return <Tag color="red">审核拒绝</Tag>;
        return <Tag color="default">已取消</Tag>;
    }
    switch (status) {
      case 0: return <Tag color="red">待支付</Tag>;
      case 1: return <Tag color="blue">待发货</Tag>;
      case 2: return <Tag color="cyan">待收货</Tag>;
      case 8: return <Tag color="purple">待揽收</Tag>;
      case 3: return <Tag color="green">已完成</Tag>;
      case 4: return <Tag color="purple">售后中</Tag>;
      case 5: return <Tag color="default">已退款</Tag>;
      default: return <Tag>未知状态</Tag>;
    }
  };

  const renderOrderList = () => {
    if (loading) {
      return <div className="text-center py-20"><Spin /></div>;
    }

    if (orders.length === 0) {
      return (
        <Empty description="暂无订单" image={Empty.PRESENTED_IMAGE_SIMPLE}>
           <Button type="primary" onClick={() => navigate('/medicine')}>去逛逛</Button>
        </Empty>
      );
    }

    return (
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center border-b pb-2 mb-3">
              <div className="text-sm text-gray-500">
                <span className="mr-4">订单号: {order.orderNo}</span>
                <span>{order.createTime}</span>
              </div>
              <div>{renderOrderStatus(order.status, order.auditStatus)}</div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                {order.medicineImage ? (
                  <img src={order.medicineImage} alt={order.medicineName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ShoppingOutlined />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-lg mb-1">{order.medicineName || '未知商品'}</div>
                <div className="text-gray-500 text-sm">数量: x{order.quantity}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">¥{order.payAmount.toFixed(2)}</div>
                <div className="text-xs text-gray-400">总额: ¥{order.totalAmount.toFixed(2)}</div>
              </div>
            </div>

            <div className="flex justify-end items-center gap-2 mt-4 pt-3 border-t">
              {order.status === 0 && (
                <Button type="primary" size="small" onClick={() => handlePay(order.id)}>立即支付</Button>
              )}
              {order.status === 2 && (
                <Button type="primary" ghost size="small" onClick={() => handleConfirmReceipt(order.id)}>确认收货</Button>
              )}
              {order.status === 3 && order.commentStatus !== 1 && (
                <Button icon={<FormOutlined />} size="small" onClick={() => handleReview(order.id)}>评价</Button>
              )}
              <Button size="small" onClick={() => navigate(`/order/${order.id}`)}>查看详情</Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const items = [
    { key: 'all', label: '全部订单', children: (
        <>
            {renderOrderList()}
            {orders.length > 0 && (
                <div className="mt-6 text-right">
                    <Pagination
                        current={pagination.current}
                        pageSize={pagination.pageSize}
                        total={pagination.total}
                        onChange={handlePageChange}
                        showTotal={(total) => `共 ${total} 条订单`}
                    />
                </div>
            )}
        </>
    )},
    { key: 'pending', label: '待付款', children: (
        <>
            {renderOrderList()}
            {orders.length > 0 && (
                <div className="mt-6 text-right">
                    <Pagination
                        current={pagination.current}
                        pageSize={pagination.pageSize}
                        total={pagination.total}
                        onChange={handlePageChange}
                        showTotal={(total) => `共 ${total} 条订单`}
                    />
                </div>
            )}
        </>
    )},
    { key: 'audit', label: '待审核', children: (
        <>
            {renderOrderList()}
            {orders.length > 0 && (
                <div className="mt-6 text-right">
                    <Pagination
                        current={pagination.current}
                        pageSize={pagination.pageSize}
                        total={pagination.total}
                        onChange={handlePageChange}
                        showTotal={(total) => `共 ${total} 条订单`}
                    />
                </div>
            )}
        </>
    )},
    { key: 'paid', label: '待发货', children: (
        <>
            {renderOrderList()}
            {orders.length > 0 && (
                <div className="mt-6 text-right">
                    <Pagination
                        current={pagination.current}
                        pageSize={pagination.pageSize}
                        total={pagination.total}
                        onChange={handlePageChange}
                        showTotal={(total) => `共 ${total} 条订单`}
                    />
                </div>
            )}
        </>
    )},
    { key: 'shipped', label: '待收货', children: (
        <>
            {renderOrderList()}
            {orders.length > 0 && (
                <div className="mt-6 text-right">
                    <Pagination
                        current={pagination.current}
                        pageSize={pagination.pageSize}
                        total={pagination.total}
                        onChange={handlePageChange}
                        showTotal={(total) => `共 ${total} 条订单`}
                    />
                </div>
            )}
        </>
    )},
    { key: 'completed', label: '已完成', children: (
        <>
            {renderOrderList()}
            {orders.length > 0 && (
                <div className="mt-6 text-right">
                    <Pagination
                        current={pagination.current}
                        pageSize={pagination.pageSize}
                        total={pagination.total}
                        onChange={handlePageChange}
                        showTotal={(total) => `共 ${total} 条订单`}
                    />
                </div>
            )}
        </>
    )},
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <ShoppingOutlined className="text-2xl text-green-500" />
        <h1 className="text-2xl font-bold m-0">我的订单</h1>
      </div>
      <Card className="shadow-sm">
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={items}
        />
      </Card>

      <Modal
        title="评价订单"
        open={reviewModalVisible}
        onOk={handleSubmitReview}
        onCancel={() => setReviewModalVisible(false)}
        confirmLoading={submittingReview}
      >
        <Form form={reviewForm} layout="vertical">
          <Form.Item name="star" label="评分" rules={[{ required: true, message: '请打分' }]} initialValue={5}>
            <Rate />
          </Form.Item>
          <Form.Item name="content" label="评价内容" rules={[{ required: true, message: '请输入评价内容' }]}>
            <Input.TextArea rows={4} placeholder="请输入您的使用体验..." />
          </Form.Item>
          {/* Image upload can be added here if needed */}
        </Form>
      </Modal>
    </div>
  );
};

export default OrderList;
