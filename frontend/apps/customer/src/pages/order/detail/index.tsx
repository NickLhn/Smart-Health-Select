import React, { useEffect, useState } from 'react';
import { Card, Steps, Descriptions, Button, Divider, Table, Tag, Image, Spin, App as AntdApp, Modal, Input, Form } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  LeftOutlined,
  CopyOutlined,
  EnvironmentOutlined,
  ShopOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CarOutlined,
  WalletOutlined,
  FileTextOutlined
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
    return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
  }

  if (!order) {
    return (
        <div className="text-center py-20">
            <p className="text-gray-500 mb-4">订单不存在</p>
            <Button type="primary" onClick={() => navigate('/order/list')} className="bg-emerald-500 rounded-full px-8">返回列表</Button>
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
    { 
      title: '提交订单', 
      description: order.createTime ? dayjs(order.createTime).format('MM-DD HH:mm') : '',
      icon: <FileTextOutlined />
    },
    { 
      title: '完成支付', 
      description: order.payTime ? dayjs(order.payTime).format('MM-DD HH:mm') : '',
      icon: <WalletOutlined />
    },
    { 
      title: '商家发货', 
      description: order.deliveryTime ? dayjs(order.deliveryTime).format('MM-DD HH:mm') : '',
      icon: <CarOutlined />
    },
    { 
      title: '确认收货', 
      description: order.finishTime ? dayjs(order.finishTime).format('MM-DD HH:mm') : '',
      icon: <CheckCircleOutlined />
    },
  ];

  const columns = [
    {
      title: '商品信息',
      dataIndex: 'medicineName',
      key: 'medicineName',
      render: (text: string, record: any) => (
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
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
      render: (price: number) => <span className="text-gray-600">¥{(price || order.price || 0).toFixed(2)}</span>,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      render: (qty: number) => <span className="text-gray-500">x{qty || order.quantity}</span>,
    },
    {
      title: '小计',
      key: 'total',
      width: 100,
      render: (_: any, record: any) => <span className="font-bold text-emerald-600">¥{((record.price || order.price || 0) * (record.quantity || order.quantity || 0)).toFixed(2)}</span>,
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
      case 0: return <Tag color="red" className="border-none bg-white/20 text-white backdrop-blur-sm px-2">待支付</Tag>;
      case 1: return <Tag color="blue" className="border-none bg-white/20 text-white backdrop-blur-sm px-2">待发货</Tag>;
      case 2: return <Tag color="cyan" className="border-none bg-white/20 text-white backdrop-blur-sm px-2">待收货</Tag>;
      case 8: return <Tag color="purple" className="border-none bg-white/20 text-white backdrop-blur-sm px-2">待揽收</Tag>;
      case 3: return <Tag color="green" className="border-none bg-white/20 text-white backdrop-blur-sm px-2">已完成</Tag>;
      case 4: return <Tag color="purple" className="border-none bg-white/20 text-white backdrop-blur-sm px-2">售后中</Tag>;
      case 5: return <Tag color="magenta" className="border-none bg-white/20 text-white backdrop-blur-sm px-2">已退款</Tag>;
      case 7: return <Tag color="orange" className="border-none bg-white/20 text-white backdrop-blur-sm px-2">待审核</Tag>;
      case 6: 
      case -1: return <Tag color="default" className="border-none bg-white/20 text-white backdrop-blur-sm px-2">已取消</Tag>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-cyan-50/50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md shadow-sm h-14 flex items-center px-4">
         <Button type="text" icon={<LeftOutlined />} onClick={() => navigate('/order/list')} className="mr-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50" />
         <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">订单详情</span>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4 animate-fade-in">
        {/* Status Card */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 rounded-2xl text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
           
           <div className="relative z-10">
             <div className="text-2xl font-bold mb-3 flex items-center gap-3">
               <span className="text-3xl">
                  {order.status === 0 && <WalletOutlined />}
                  {order.status === 1 && <ClockCircleOutlined />}
                  {order.status === 2 && <CarOutlined />}
                  {order.status === 3 && <CheckCircleOutlined />}
               </span>
               <span>
                 {order.status === 0 && '等待买家付款'}
                 {order.status === 1 && '等待商家发货'}
                 {order.status === 2 && '商家已发货'}
                 {order.status === 3 && '交易完成'}
                 {order.status === 7 && '等待处方审核'}
                 {(order.status === 6 || order.status === -1) && '订单已取消'}
               </span>
               <div className="ml-auto transform scale-110">
                  {renderStatusTag()}
               </div>
             </div>
             {order.status === 0 && <div className="opacity-90 text-emerald-50">请在 30 分钟内完成支付，超时自动取消</div>}
             {order.status === 2 && <div className="opacity-90 text-emerald-50">包裹正在飞速奔向您的怀抱</div>}
             {order.status === 3 && <div className="opacity-90 text-emerald-50">感谢您的信任，期待再次光临</div>}
           </div>
        </div>

        {/* Steps */}
        <div className="glass-panel p-6 rounded-2xl border border-white/60 bg-white/60 backdrop-blur-md">
          <Steps 
            current={currentStep} 
            items={stepItems} 
            size="small" 
            className="overflow-x-auto pb-2 custom-steps" 
            responsive={false}
          />
        </div>

        {/* Address */}
        <div className="glass-panel p-6 rounded-2xl border border-white/60 bg-white/60 backdrop-blur-md flex items-start gap-4">
           <div className="bg-emerald-100 p-3 rounded-full mt-1 flex-shrink-0 text-emerald-600">
              <EnvironmentOutlined className="text-xl" />
           </div>
           <div>
              <div className="font-bold text-gray-900 mb-1 text-lg">
                {order.receiverName} <span className="text-gray-500 font-normal ml-2 text-base">{order.receiverPhone}</span>
              </div>
              <div className="text-gray-600 leading-relaxed">{order.receiverAddress}</div>
           </div>
        </div>

        {/* Order Items */}
        <div className="glass-panel p-6 rounded-2xl border border-white/60 bg-white/60 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4 text-gray-800 font-bold text-lg">
            <ShopOutlined className="text-emerald-500" />
            <span>商品信息</span>
          </div>
          <Table 
              columns={columns} 
              dataSource={dataSource} 
              pagination={false} 
              rowKey="id" 
              size="small"
              className="mb-6 custom-table"
          />
          
          <div className="space-y-3 text-sm border-t border-gray-100 pt-4">
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
             <div className="flex justify-between items-center pt-2">
                 <span className="font-bold text-gray-900">实付款</span>
                 <span className="text-2xl font-bold text-emerald-600">¥{order.payAmount.toFixed(2)}</span>
             </div>
          </div>
        </div>

        {/* Order Info */}
        <div className="glass-panel p-6 rounded-2xl border border-white/60 bg-white/60 backdrop-blur-md">
           <div className="font-bold text-lg mb-4 text-gray-800">订单信息</div>
           <div className="space-y-4 text-sm text-gray-500">
              <div className="flex justify-between items-center">
                 <span>订单编号</span>
                 <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-mono">{order.orderNo}</span>
                    <Button type="text" size="small" icon={<CopyOutlined />} className="text-emerald-600 hover:bg-emerald-50" onClick={() => handleCopy(order.orderNo)}>复制</Button>
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
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 flex justify-end items-center gap-3 pb-safe">
         {order.status === 0 && (
             <>
               <Button onClick={handleCancelOrder} className="rounded-full px-6 border-gray-300 hover:border-gray-400 hover:text-gray-600">取消订单</Button>
               <Button type="primary" className="bg-gradient-to-r from-emerald-500 to-teal-500 border-none rounded-full px-8 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 transition-all" onClick={handlePay}>立即支付</Button>
             </>
         )}
         {order.status === 2 && (
             <Button type="primary" className="bg-gradient-to-r from-emerald-500 to-teal-500 border-none rounded-full px-8 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 transition-all" onClick={handleConfirmReceipt}>确认收货</Button>
         )}
         {(order.status === 1 || order.status === 2 || order.status === 3) && (
             <Button onClick={() => navigate(`/refund/apply/${order.id}`)} className="rounded-full px-6 border-gray-300 hover:border-emerald-500 hover:text-emerald-500">申请售后</Button>
         )}
         {order.status === 3 && order.commentStatus !== 1 && (
             <Button icon={<MessageOutlined />} onClick={() => navigate('/profile/comment')} className="rounded-full px-6 border-emerald-500 text-emerald-600 hover:bg-emerald-50">去评价</Button>
         )}
      </div>

      <style>{`
        .custom-steps .ant-steps-item-process .ant-steps-item-icon {
            background-color: #10b981;
            border-color: #10b981;
        }
        .custom-steps .ant-steps-item-finish .ant-steps-item-icon {
            border-color: #10b981;
        }
        .custom-steps .ant-steps-item-finish .ant-steps-item-icon > .ant-steps-icon {
            color: #10b981;
        }
        .custom-steps .ant-steps-item-finish > .ant-steps-item-container > .ant-steps-item-tail::after {
            background-color: #10b981;
        }
        .custom-table .ant-table-thead > tr > th {
            background: transparent;
            color: #6b7280;
            font-weight: 500;
        }
        .custom-table .ant-table-tbody > tr > td {
            border-bottom-color: #f3f4f6;
        }
        .custom-table .ant-table-tbody > tr:last-child > td {
            border-bottom: none;
        }
      `}</style>
    </div>
  );
};

export default OrderDetail;
