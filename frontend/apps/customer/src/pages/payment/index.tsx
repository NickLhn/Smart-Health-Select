import React, { useState, useEffect } from 'react';
import { Alert, Button, Result, Spin, Typography, App as AntdApp } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { LeftOutlined, CreditCardOutlined } from '@ant-design/icons';
import { getOrderDetail } from '../../services/order';
import type { Order } from '../../services/order';
import { createStripeCheckoutSession } from '../../services/payment';

const { Title, Text } = Typography;

const PaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [order, setOrder] = useState<Order>();

  useEffect(() => {
    if (orderId) {
      // 支付页先拉订单详情，避免展示已失效或不存在的订单。
      fetchOrder(orderId);
    }
  }, [orderId]);

  const fetchOrder = async (id: string) => {
    setLoading(true);
    try {
      const res = await getOrderDetail(id);
      if (res.code === 200) {
        setOrder(res.data);
      } else {
        message.error(res.message || '获取订单信息失败');
      }
    } catch (error) {
      console.error(error);
      message.error('获取订单信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!order || !orderId) return;
    setPayLoading(true);
    try {
      // 单订单支付页也统一走 Stripe Checkout，避免页面直接篡改本地订单状态。
      const res = await createStripeCheckoutSession({ orderIds: [orderId] });
      window.location.href = res.data.url;
    } catch (error) {
      console.error(error);
      message.error('创建 Stripe 支付会话失败');
    } finally {
      setPayLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" tip="加载订单信息..." />
      </div>
    );
  }

  if (!order) {
    return (
      <Result
        status="404"
        title="订单不存在"
        extra={<Button type="primary" onClick={() => navigate('/')}>返回首页</Button>}
      />
    );
  }

  if (order.status !== 0) {
    return (
      <Result
        status="info"
        title="订单状态已更新"
        subTitle="该订单不需要支付或已经支付"
        extra={<Button type="primary" onClick={() => navigate(`/order/${order.id}`)}>查看订单详情</Button>}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white sticky top-0 z-10 px-4 h-14 flex items-center shadow-sm">
        <Button type="text" icon={<LeftOutlined />} onClick={() => navigate(-1)} />
        <span className="text-lg font-bold ml-2">收银台</span>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="bg-white p-6 rounded-xl shadow-sm text-center">
          <div className="text-gray-500 mb-2">Stripe 沙盒支付</div>
          <div className="text-4xl font-bold text-gray-900 mb-2">
            <span className="text-2xl">¥</span>{order.payAmount.toFixed(2)}
          </div>
          <div className="text-gray-500 text-sm">{order.medicineName} 等商品</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-medium flex items-center gap-2">
            <CreditCardOutlined className="text-emerald-600" />
            Stripe Test Checkout
          </div>
          <div className="p-4 space-y-4">
            <Alert
              type="info"
              showIcon
              message="当前是 Stripe sandbox 模式"
              description="点击下方按钮后会跳转到 Stripe 托管收银台。推荐测试卡号：4242 4242 4242 4242，任意未来日期、任意 CVC 和邮编即可。"
            />
            <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-3 text-sm text-gray-600">
              这版只接入沙盒支付，不会真实扣款，也不会要求你在前端保存银行卡信息。
            </div>
          </div>
        </div>

        <Button 
          type="primary" 
          size="large" 
          block 
          className="h-12 text-lg font-bold rounded-xl mt-8 bg-[#00B96B] hover:bg-[#009456] border-none shadow-lg shadow-[#00B96B]/30"
          loading={payLoading}
          onClick={handlePay}
        >
          前往 Stripe 支付 ¥{order.payAmount.toFixed(2)}
        </Button>
      </div>
    </div>
  );
};

export default PaymentPage;
