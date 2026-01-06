import React, { useEffect, useState } from 'react';
import { Card, Steps, Descriptions, Button, Divider, Table, Tag, Image, Spin, App as AntdApp, Modal, Input, Form } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  LeftOutlined,
  CopyOutlined,
  EnvironmentOutlined,
  ShopOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { payOrder, getOrderDetail, confirmReceipt, cancelOrder, applyRefund } from '../../../services/order';
import type { Order } from '../../../services/order';
import dayjs from 'dayjs';

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message, modal } = AntdApp.useApp();
  const [order, setOrder] = useState<Order>();
  const [loading, setLoading] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getOrderDetail(parseInt(id));
      if (res.code === 200) {
        setOrder(res.data);
      } else {
        message.error(res.message || '获取订单详情失败');
      }
    } catch (error) {
      console.error(error);
      message.error('获取订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleCancelOrder = () => {
    if (!order) return;
    modal.confirm({
      title: '确认取消订单',
      content: '确定要取消当前订单吗？取消后无法恢复。',
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await cancelOrder(order.id);
          if (res.code === 200) {
            message.success('订单已取消');
            fetchDetail();
          } else {
            message.error(res.message || '取消失败');
          }
        } catch (error) {
          message.error('取消出错');
        }
      }
    });
  };

  const handlePay = () => {
    if (!order) return;
    navigate(`/payment/${order.id}`);
  };

  const handleConfirmReceipt = async () => {
    if (!order) return;
    modal.confirm({
      title: '确认收货',
      content: '请确保您已收到商品并确认无误。确认收货后，订单将完成。',
      onOk: async () => {
        try {
          const res = await confirmReceipt(order.id);
          if (res.code === 200) {
            message.success('确认收货成功');
            fetchDetail();
          } else {
            message.error(res.message || '操作失败');
          }
        } catch (error) {
          message.error('操作出错');
        }
      }
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('复制成功');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[60vh]"><Spin size="large" /></div>;
  }

  if (!order) {
    return (
        <div className="text-center py-20">
            <p>订单不存在</p>
            <Button onClick={() => navigate('/orders')}>返回列表</Button>
        </div>
    );
  }

  // Calculate current step based on status
  let currentStep = 0;
  if (order.status === 0) currentStep = 0; // 待支付
  else if (order.status === 1) currentStep = 1; // 待发货
  else if (order.status === 2) currentStep = 2; // 待收货
  else if (order.status === 3) currentStep = 3; // 已完成

  // Special handling for audit status
  if (order.status === 7) currentStep = 0; // 待审核 viewed as step 0 for now
  
  const stepItems = [
    { title: '提交订单', description: order.createTime ? dayjs(order.createTime).format('MM-DD HH:mm') : '' },
    { title: '完成支付', description: order.payTime ? dayjs(order.payTime).format('MM-DD HH:mm') : '' },
    { title: '商家发货', description: order.deliveryTime ? dayjs(order.deliveryTime).format('MM-DD HH:mm') : '' },
    { title: '确认收货', description: order.finishTime ? dayjs(order.finishTime).format('MM-DD HH:mm') : '' },
  ];

  const columns = [
    {
      title: '商品信息',
      dataIndex: 'medicineName',
      key: 'medicineName',
      render: (text: string, record: any) => (
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
            <Image 
              src={record.medicineImage || order.medicineImage} 
              width="100%" 
              height="100%" 
              className="object-cover" 
              fallback="https://via.placeholder.com/60"
              preview={false}
            />
          </div>
          <div>
             <div className="font-medium text-gray-900 mb-1 line-clamp-2">{record.medicineName || order.medicineName}</div>
             <div className="text-xs text-gray-400">规格: 默认</div>
          </div>
        </div>
      ),
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number) => `¥${(price || order.price || 0).toFixed(2)}`,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      render: (qty: number) => `x${qty || order.quantity}`,
    },
    {
      title: '小计',
      key: 'total',
      width: 100,
      render: (_: any, record: any) => <span className="font-bold">¥{((record.price || order.price || 0) * (record.quantity || order.quantity || 0)).toFixed(2)}</span>,
    },
  ];

  const dataSource = [{
      id: order.medicineId,
      medicineName: order.medicineName,
      medicineImage: order.medicineImage,
      price: order.price,
      quantity: order.quantity,
  }];

  const renderStatusTag = () => {
    switch(order.status) {
      case 0: return <Tag color="red">待支付</Tag>;
      case 1: return <Tag color="blue">待发货</Tag>;
      case 2: return <Tag color="cyan">待收货</Tag>;
      case 8: return <Tag color="purple">待揽收</Tag>;
      case 3: return <Tag color="green">已完成</Tag>;
      case 4: return <Tag color="purple">售后中</Tag>;
      case 5: return <Tag color="magenta">已退款</Tag>;
      case 7: return <Tag color="orange">待审核</Tag>;
      case 6: 
      case -1: return <Tag color="default">已取消</Tag>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 px-4 h-14 flex items-center shadow-sm">
         <Button type="text" icon={<LeftOutlined />} onClick={() => navigate('/orders')} />
         <span className="text-lg font-bold ml-2">订单详情</span>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Status Card */}
        <div className="bg-gradient-to-r from-[#00B96B] to-[#009456] p-6 rounded-xl text-white shadow-lg shadow-green-200">
           <div className="text-2xl font-bold mb-2 flex items-center gap-2">
             {renderStatusTag()}
             <span>
               {order.status === 0 && '等待买家付款'}
               {order.status === 1 && '等待商家发货'}
               {order.status === 2 && '商家已发货'}
               {order.status === 3 && '交易完成'}
               {order.status === 7 && '等待处方审核'}
             </span>
           </div>
           {order.status === 0 && <div className="opacity-90">请在 30 分钟内完成支付，超时自动取消</div>}
           {order.status === 2 && <div className="opacity-90">包裹正在飞速奔向您的怀抱</div>}
        </div>

        {/* Steps */}
        <Card className="rounded-xl shadow-sm" variant="borderless">
          <Steps current={currentStep} items={stepItems} size="small" className="overflow-x-auto pb-2" />
        </Card>

        {/* Address */}
        <Card className="rounded-xl shadow-sm" variant="borderless">
           <div className="flex items-start gap-3">
              <div className="bg-green-50 p-2 rounded-full mt-1">
                 <EnvironmentOutlined className="text-[#00B96B] text-lg" />
              </div>
              <div>
                 <div className="font-bold text-gray-900 mb-1">
                   {order.receiverName} <span className="text-gray-500 font-normal ml-2">{order.receiverPhone}</span>
                 </div>
                 <div className="text-gray-600 leading-tight">{order.receiverAddress}</div>
              </div>
           </div>
        </Card>

        {/* Order Items */}
        <Card className="rounded-xl shadow-sm" variant="borderless" title={<div className="flex items-center gap-2"><ShopOutlined /> 商品信息</div>}>
          <Table 
              columns={columns} 
              dataSource={dataSource} 
              pagination={false} 
              rowKey="id" 
              size="small"
              className="mb-4"
          />
          
          <div className="space-y-2 text-sm">
             <div className="flex justify-between text-gray-500">
                 <span>商品总价</span>
                 <span>¥{order.totalAmount.toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-gray-500">
                 <span>运费</span>
                 <span>¥0.00</span>
             </div>
             <div className="flex justify-between text-gray-500">
                 <span>优惠券</span>
                 <span>-¥{order.couponAmount?.toFixed(2) || '0.00'}</span>
             </div>
             <Divider className="my-2" />
             <div className="flex justify-between items-center">
                 <span className="font-bold text-gray-900">实付款</span>
                 <span className="text-xl font-bold text-red-500">¥{order.payAmount.toFixed(2)}</span>
             </div>
          </div>
        </Card>

        {/* Order Info */}
        <Card className="rounded-xl shadow-sm" variant="borderless" title="订单信息">
           <div className="space-y-3 text-sm text-gray-500">
              <div className="flex justify-between">
                 <span>订单编号</span>
                 <div className="flex items-center gap-2">
                    <span className="text-gray-900">{order.orderNo}</span>
                    <CopyOutlined className="cursor-pointer hover:text-[#00B96B]" onClick={() => handleCopy(order.orderNo)} />
                 </div>
              </div>
              <div className="flex justify-between">
                 <span>创建时间</span>
                 <span className="text-gray-900">{order.createTime}</span>
              </div>
              {order.payTime && (
                <div className="flex justify-between">
                   <span>支付时间</span>
                   <span className="text-gray-900">{order.payTime}</span>
                </div>
              )}
              {order.deliveryTime && (
                <div className="flex justify-between">
                   <span>发货时间</span>
                   <span className="text-gray-900">{order.deliveryTime}</span>
                </div>
              )}
           </div>
        </Card>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20 flex justify-end items-center gap-3">
         {order.status === 0 && (
             <>
               <Button onClick={handleCancelOrder}>取消订单</Button>
               <Button type="primary" className="bg-[#00B96B]" onClick={handlePay}>立即支付</Button>
             </>
         )}
         {order.status === 2 && (
             <Button type="primary" className="bg-[#00B96B]" onClick={handleConfirmReceipt}>确认收货</Button>
         )}
         {(order.status === 1 || order.status === 2 || order.status === 3) && (
             <Button onClick={() => navigate(`/refund/apply/${order.id}`)}>申请售后</Button>
         )}
         {order.status === 3 && order.commentStatus !== 1 && (
             <Button icon={<MessageOutlined />} onClick={() => navigate('/profile/comment')}>去评价</Button>
         )}
      </div>
    </div>
  );
};

export default OrderDetail;
