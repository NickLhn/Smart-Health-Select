import React, { useState, useEffect } from 'react';
import { Card, Button, Radio, Spin, Result, Divider, Space, Typography, App as AntdApp } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { PayCircleOutlined, LeftOutlined, CheckCircleFilled, WechatOutlined, AlipayCircleOutlined } from '@ant-design/icons';
import { getOrderDetail, payOrder } from '../../services/order';
import type { Order } from '../../services/order';

const { Title, Text } = Typography;

const PaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [order, setOrder] = useState<Order>();
  const [paymentMethod, setPaymentMethod] = useState('wechat');

  useEffect(() => {
    if (orderId) {
      // 支付页先拉订单详情，避免展示已失效或不存在的订单。
      fetchOrder(parseInt(orderId));
    }
  }, [orderId]);

  const fetchOrder = async (id: number) => {
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
    if (!order) return;
    setPayLoading(true);
    try {
      // 这里保留一个短延迟，模拟真实支付过程中的等待感。
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const res = await payOrder(order.id);
      if (res.code === 200) {
        message.success('支付成功');
        // 支付完成后直接回订单详情页继续看履约状态。
        navigate(`/order/${order.id}`, { replace: true });
      } else {
        message.error(res.message || '支付失败');
      }
    } catch (error) {
      message.error('支付出错');
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
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 px-4 h-14 flex items-center shadow-sm">
        <Button type="text" icon={<LeftOutlined />} onClick={() => navigate(-1)} />
        <span className="text-lg font-bold ml-2">收银台</span>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Order Amount */}
        <div className="bg-white p-6 rounded-xl shadow-sm text-center">
          <div className="text-gray-500 mb-2">支付剩余时间 29:59</div>
          <div className="text-4xl font-bold text-gray-900 mb-2">
            <span className="text-2xl">¥</span>{order.payAmount.toFixed(2)}
          </div>
          <div className="text-gray-500 text-sm">{order.medicineName} 等商品</div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-medium">
            选择支付方式
          </div>
          <Radio.Group 
            className="w-full" 
            value={paymentMethod} 
            onChange={e => setPaymentMethod(e.target.value)}
          >
            <div 
              className="flex items-center justify-between p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
              onClick={() => setPaymentMethod('wechat')}
            >
              <div className="flex items-center gap-3">
                <WechatOutlined className="text-3xl text-[#09BB07]" />
                <div>
                  <div className="font-medium text-gray-900">微信支付</div>
                  <div className="text-xs text-gray-500">亿万用户的选择，更快更安全</div>
                </div>
              </div>
              <Radio value="wechat" />
            </div>

            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
              onClick={() => setPaymentMethod('alipay')}
            >
              <div className="flex items-center gap-3">
                <AlipayCircleOutlined className="text-3xl text-[#1677FF]" />
                <div>
                  <div className="font-medium text-gray-900">支付宝</div>
                  <div className="text-xs text-gray-500">数亿用户都在用，安全可信赖</div>
                </div>
              </div>
              <Radio value="alipay" />
            </div>
          </Radio.Group>
        </div>

        <Button 
          type="primary" 
          size="large" 
          block 
          className="h-12 text-lg font-bold rounded-xl mt-8 bg-[#00B96B] hover:bg-[#009456] border-none shadow-lg shadow-[#00B96B]/30"
          loading={payLoading}
          onClick={handlePay}
        >
          立即支付 ¥{order.payAmount.toFixed(2)}
        </Button>
      </div>
    </div>
  );
};

export default PaymentPage;
