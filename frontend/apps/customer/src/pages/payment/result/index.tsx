import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Result, Spin, Typography, App as AntdApp } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getStripeSessionStatus } from '../../../services/payment';

const { Text } = Typography;
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 20;

const PaymentResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id') || '';
  const redirectStatus = searchParams.get('redirect_status') || '';
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [pollAttempts, setPollAttempts] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'canceled' | 'expired' | 'failed'>(
    redirectStatus === 'cancel' ? 'canceled' : 'pending'
  );

  const querySessionStatus = async (attempt = 0) => {
    const res = await getStripeSessionStatus(sessionId);
    const nextStatus = res.data.paymentStatus;
    setPaymentStatus(nextStatus);
    setPollAttempts(attempt + 1);
    return nextStatus;
  };

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let timerId: number | undefined;
    const pollStatus = async (attempt = 0) => {
      try {
        if (cancelled) return;
        const nextStatus = await querySessionStatus(attempt);
        if (cancelled) return;
        // 沙盒环境里 webhook 偶尔会慢几秒，这里多等一会，减少用户频繁手动刷新的次数。
        if (nextStatus === 'paid' || nextStatus === 'failed' || nextStatus === 'expired' || attempt >= MAX_POLL_ATTEMPTS - 1) {
          setLoading(false);
          return;
        }
        timerId = window.setTimeout(() => {
          pollStatus(attempt + 1);
        }, POLL_INTERVAL_MS);
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          message.error('查询支付状态失败');
          setLoading(false);
        }
      }
    };

    pollStatus();
    return () => {
      cancelled = true;
      if (timerId) {
        window.clearTimeout(timerId);
      }
    };
  }, [message, sessionId]);

  const handleRefreshStatus = async () => {
    if (!sessionId) {
      return;
    }
    setLoading(true);
    try {
      await querySessionStatus(0);
    } catch (error) {
      console.error(error);
      message.error('查询支付状态失败');
    } finally {
      setLoading(false);
    }
  };

  const resultConfig = useMemo(() => {
    switch (paymentStatus) {
      case 'paid':
        return {
          status: 'success' as const,
          title: '支付成功',
          subTitle: 'Stripe 沙盒支付已经完成，订单状态会同步更新到待发货流程。'
        };
      case 'canceled':
        return {
          status: 'warning' as const,
          title: '支付已取消',
          subTitle: '你已经从 Stripe 收银台返回，订单仍保持待支付状态。'
        };
      case 'expired':
        return {
          status: 'error' as const,
          title: '支付会话已过期',
          subTitle: '这个 Stripe 支付链接已经失效，请重新发起支付。'
        };
      case 'failed':
        return {
          status: 'error' as const,
          title: '支付失败',
          subTitle: 'Stripe 未完成这次测试支付，订单仍保持待支付状态。'
        };
      default:
        return {
          status: 'info' as const,
          title: '正在确认支付结果',
          subTitle: '我们正在等待 Stripe webhook 回写，请稍候刷新。'
        };
    }
  }, [paymentStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" tip="正在确认 Stripe 支付结果..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10">
        <Result
          status={resultConfig.status}
          title={resultConfig.title}
          subTitle={resultConfig.subTitle}
          extra={[
            <Button key="orders" type="primary" onClick={() => navigate('/order/list')} className="bg-emerald-600">
              查看订单
            </Button>,
            paymentStatus === 'pending' ? (
              <Button key="refresh" onClick={handleRefreshStatus}>
                重新查询状态
              </Button>
            ) : null,
            <Button key="home" onClick={() => navigate('/')}>
              返回首页
            </Button>,
          ].filter(Boolean)}
        />

        <div className="space-y-3">
          <Alert
            type="info"
            showIcon
            message="这版是 Stripe sandbox 模式"
            description={`如果你刚刚完成测试卡支付但页面仍显示处理中，通常是 webhook 还在回写。当前已自动查询 ${pollAttempts} 次，你也可以手动再查一次。`}
          />
          {sessionId && (
            <div className="text-sm text-gray-500 break-all">
              <Text type="secondary">Session ID: {sessionId}</Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentResultPage;
