import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Row, Statistic, message } from 'antd';
import {
  BellOutlined,
  DollarOutlined,
  FileTextOutlined,
  MessageOutlined,
  PlusOutlined,
  ReloadOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { getDashboardStatistics, type DashboardData } from '../../services/dashboard';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const Dashboard: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDashboardStatistics();
      if (res.code === 200) {
        setData(res.data);
        setLastUpdatedAt(Date.now());
      } else {
        messageApi.error(res.message);
      }
    } catch (error) {
      messageApi.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const salesTrendData = useMemo(() => data?.salesTrend ?? [], [data?.salesTrend]);
  const orderTrendData = useMemo(() => data?.orderTrend ?? [], [data?.orderTrend]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return '凌晨好';
    if (hour < 12) return '上午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  }, []);

  const formatInteger = useCallback((value: string | number | undefined) => {
    const num = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(num)) return '--';
    return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(num);
  }, []);

  const formatCurrency = useCallback((value: string | number | undefined) => {
    const num = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(num)) return '--';
    return `¥${new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)}`;
  }, []);

  const salesOption = useMemo(() => {
    const xData = salesTrendData.map((item) => item.name);
    const yData = salesTrendData.map((item) => item.value);
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      grid: { left: 36, right: 18, top: 22, bottom: 30 },
      xAxis: {
        type: 'category',
        data: xData,
        axisLine: { lineStyle: { color: 'rgba(15, 23, 42, 0.12)' } },
        axisTick: { show: false },
        axisLabel: { color: 'rgba(15, 23, 42, 0.55)' },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: 'rgba(15, 23, 42, 0.45)' },
        splitLine: { lineStyle: { color: 'rgba(15, 23, 42, 0.08)' } },
      },
      series: [
        {
          name: '销售额',
          type: 'bar',
          barWidth: 18,
          data: yData,
          itemStyle: {
            borderRadius: [8, 8, 6, 6],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(16, 185, 129, 0.95)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.22)' },
            ]),
          },
          emphasis: { focus: 'series' },
        },
      ],
    };
  }, [salesTrendData]);

  const orderOption = useMemo(() => {
    const xData = orderTrendData.map((item) => item.name);
    const yData = orderTrendData.map((item) => item.value);
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 36, right: 18, top: 22, bottom: 30 },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xData,
        axisLine: { lineStyle: { color: 'rgba(15, 23, 42, 0.12)' } },
        axisTick: { show: false },
        axisLabel: { color: 'rgba(15, 23, 42, 0.55)' },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: 'rgba(15, 23, 42, 0.45)' },
        splitLine: { lineStyle: { color: 'rgba(15, 23, 42, 0.08)' } },
      },
      series: [
        {
          name: '订单数',
          type: 'line',
          data: yData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 3, color: 'rgba(2, 132, 199, 0.95)' },
          itemStyle: { color: 'rgba(2, 132, 199, 0.95)' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(34, 211, 238, 0.28)' },
              { offset: 1, color: 'rgba(34, 211, 238, 0)' },
            ]),
          },
          emphasis: { focus: 'series' },
        },
      ],
    };
  }, [orderTrendData]);

  const heroUpdatedText = useMemo(() => {
    if (!lastUpdatedAt) return '数据同步中';
    return `更新于 ${dayjs(lastUpdatedAt).format('HH:mm:ss')}`;
  }, [lastUpdatedAt]);

  const dashboardStyles = `
    .db-root {
      position: relative;
    }
    .db-hero {
      position: relative;
      border-radius: 18px;
      overflow: hidden;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background:
        radial-gradient(900px 380px at 10% 10%, rgba(16, 185, 129, 0.24), rgba(16, 185, 129, 0) 55%),
        radial-gradient(760px 360px at 75% 18%, rgba(34, 211, 238, 0.22), rgba(34, 211, 238, 0) 60%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.86) 0%, rgba(255, 255, 255, 0.76) 100%);
      box-shadow: 0 26px 80px rgba(2, 6, 23, 0.10);
      padding: 18px 18px 16px;
    }
    .db-hero::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.35;
      background-image: radial-gradient(rgba(15, 23, 42, 0.16) 1px, transparent 1px);
      background-size: 26px 26px;
      mask-image: radial-gradient(600px 420px at 65% 20%, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
    }
    .db-heroTop {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }
    .db-chip {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 7px 12px;
      border-radius: 999px;
      border: 1px solid rgba(16, 185, 129, 0.22);
      background: rgba(16, 185, 129, 0.10);
      color: rgba(6, 95, 70, 0.92);
      font-weight: 650;
      letter-spacing: 0.2px;
      backdrop-filter: blur(10px);
    }
    .db-chipDot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: rgba(16, 185, 129, 0.92);
      box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.14);
    }
    .db-title {
      margin: 10px 0 0;
      font-size: clamp(22px, 3.2vw, 28px);
      font-weight: 850;
      letter-spacing: -0.6px;
      color: rgba(15, 23, 42, 0.92);
    }
    .db-subtitle {
      margin-top: 6px;
      color: rgba(15, 23, 42, 0.58);
      font-size: 13px;
    }
    .db-actions {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .db-actions .ant-btn {
      border-radius: 999px;
      height: 38px;
      padding: 0 16px;
      font-weight: 650;
    }
    .db-actions .db-primary.ant-btn {
      background: linear-gradient(90deg, rgba(5, 150, 105, 1), rgba(16, 185, 129, 1));
      border: none;
      box-shadow: 0 14px 38px rgba(16, 185, 129, 0.24);
    }
    .db-heroBottom {
      position: relative;
      z-index: 1;
      margin-top: 14px;
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 12px;
    }
    .db-metric {
      position: relative;
      border-radius: 16px;
      padding: 14px 14px 12px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background: rgba(255, 255, 255, 0.82);
      box-shadow: 0 18px 55px rgba(2, 6, 23, 0.06);
      transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
    }
    .db-metric:hover {
      transform: translateY(-2px);
      box-shadow: 0 22px 70px rgba(2, 6, 23, 0.10);
      border-color: rgba(16, 185, 129, 0.18);
    }
    .db-metricLabel {
      color: rgba(15, 23, 42, 0.62);
      font-weight: 650;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      font-size: 13px;
    }
    .db-metricIcon {
      width: 30px;
      height: 30px;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background: rgba(255, 255, 255, 0.85);
      color: rgba(15, 23, 42, 0.78);
    }
    .db-sectionHead {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 12px;
      margin: 22px 0 10px;
    }
    .db-sectionTitle {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
      color: rgba(15, 23, 42, 0.90);
      letter-spacing: -0.2px;
    }
    .db-sectionDesc {
      margin-top: 2px;
      font-size: 12px;
      color: rgba(15, 23, 42, 0.58);
    }
    .db-todos {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
    .db-todo {
      border: 0;
      width: 100%;
      text-align: left;
      cursor: pointer;
      border-radius: 16px;
      padding: 14px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background: rgba(255, 255, 255, 0.86);
      box-shadow: 0 18px 55px rgba(2, 6, 23, 0.06);
      transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
    }
    .db-todo:hover {
      transform: translateY(-2px);
      box-shadow: 0 24px 70px rgba(2, 6, 23, 0.10);
      border-color: rgba(2, 132, 199, 0.18);
    }
    .db-todoTop {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .db-todoLabel {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 800;
      color: rgba(15, 23, 42, 0.86);
      letter-spacing: -0.2px;
    }
    .db-todoPill {
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 750;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background: rgba(15, 23, 42, 0.04);
      color: rgba(15, 23, 42, 0.76);
    }
    .db-todoValue {
      margin-top: 12px;
      font-size: 30px;
      font-weight: 900;
      letter-spacing: -0.8px;
      color: rgba(15, 23, 42, 0.92);
    }
    .db-todoHint {
      margin-top: 6px;
      font-size: 12px;
      color: rgba(15, 23, 42, 0.56);
    }
    .db-card {
      border-radius: 18px !important;
      border: 1px solid rgba(15, 23, 42, 0.10) !important;
      box-shadow: 0 18px 55px rgba(2, 6, 23, 0.06) !important;
      overflow: hidden;
    }
    .db-card .ant-card-head {
      border-bottom: 1px solid rgba(15, 23, 42, 0.08);
      background: rgba(255, 255, 255, 0.86);
    }
    .db-card .ant-card-head-title {
      font-weight: 800;
      color: rgba(15, 23, 42, 0.90);
    }
    .db-card .ant-card-body {
      background: rgba(255, 255, 255, 0.86);
    }
    @media (max-width: 1200px) {
      .db-heroBottom { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    @media (max-width: 768px) {
      .db-heroTop { flex-direction: column; align-items: stretch; }
      .db-actions { justify-content: flex-start; }
      .db-heroBottom { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .db-todos { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 520px) {
      .db-heroBottom { grid-template-columns: 1fr; }
      .db-todos { grid-template-columns: 1fr; }
    }
    @media (prefers-reduced-motion: reduce) {
      .db-metric,
      .db-todo {
        transition: none;
      }
      .db-metric:hover,
      .db-todo:hover {
        transform: none;
      }
    }
  `;

  return (
    <div className="db-root">
      {contextHolder}
      <style>{dashboardStyles}</style>

      <div className="db-hero" aria-label="工作台概览">
        <div className="db-heroTop">
          <div>
            <div className="db-chip">
              <span className="db-chipDot" aria-hidden="true" />
              {greeting}，欢迎回到商家工作台
            </div>
            <h2 className="db-title">今日经营概览</h2>
            <div className="db-subtitle">{heroUpdatedText}</div>
          </div>

          <div className="db-actions" aria-label="快捷操作">
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
              刷新
            </Button>
            <Button className="db-primary" type="primary" icon={<PlusOutlined />} onClick={() => navigate('/product/add')}>
              添加商品
            </Button>
            <Button icon={<FileTextOutlined />} onClick={() => navigate('/order/pending')}>
              待发货
            </Button>
            <Button icon={<MessageOutlined />} onClick={() => navigate('/im')}>
              消息
            </Button>
          </div>
        </div>

        <div className="db-heroBottom">
          <div className="db-metric" role="group" aria-label="今日订单">
            <div className="db-metricLabel">
              今日订单
              <span className="db-metricIcon" aria-hidden="true">
                <FileTextOutlined />
              </span>
            </div>
            <Statistic value={data?.todayOrders || 0} formatter={formatInteger} valueStyle={{ fontSize: 30, fontWeight: 900, color: 'rgba(15, 23, 42, 0.92)' }} />
          </div>
          <div className="db-metric" role="group" aria-label="今日销售额">
            <div className="db-metricLabel">
              今日销售额
              <span className="db-metricIcon" aria-hidden="true">
                <DollarOutlined />
              </span>
            </div>
            <Statistic value={data?.todaySales || 0} formatter={formatCurrency} valueStyle={{ fontSize: 30, fontWeight: 900, color: 'rgba(15, 23, 42, 0.92)' }} />
          </div>
          <div className="db-metric" role="group" aria-label="在售商品">
            <div className="db-metricLabel">
              在售商品
              <span className="db-metricIcon" aria-hidden="true">
                <ShoppingOutlined />
              </span>
            </div>
            <Statistic value={data?.productCount || 0} formatter={formatInteger} valueStyle={{ fontSize: 30, fontWeight: 900, color: 'rgba(15, 23, 42, 0.92)' }} />
          </div>
          <div className="db-metric" role="group" aria-label="累计订单">
            <div className="db-metricLabel">
              累计订单
              <span className="db-metricIcon" aria-hidden="true">
                <BellOutlined />
              </span>
            </div>
            <Statistic value={data?.totalOrders || 0} formatter={formatInteger} valueStyle={{ fontSize: 30, fontWeight: 900, color: 'rgba(15, 23, 42, 0.92)' }} />
          </div>
          <div className="db-metric" role="group" aria-label="累计销售额">
            <div className="db-metricLabel">
              累计销售额
              <span className="db-metricIcon" aria-hidden="true">
                <DollarOutlined />
              </span>
            </div>
            <Statistic value={data?.totalSales || 0} formatter={formatCurrency} valueStyle={{ fontSize: 30, fontWeight: 900, color: 'rgba(15, 23, 42, 0.92)' }} />
          </div>
        </div>
      </div>

      <div className="db-sectionHead" aria-label="待办事项">
        <div>
          <div className="db-sectionTitle">待办事项</div>
          <div className="db-sectionDesc">点击卡片直达处理页，减少来回翻找</div>
        </div>
      </div>

      <div className="db-todos">
        {[
          {
            label: '待发货订单',
            value: data?.pendingShipment || 0,
            pill: '物流发货',
            onClick: () => navigate('/order/list?status=1'),
            aria: '查看待发货订单',
          },
          {
            label: '待审核处方',
            value: data?.pendingAudit || 0,
            pill: '处方审核',
            onClick: () => navigate('/order/list?status=7'),
            aria: '查看待审核处方订单',
          },
          {
            label: '待处理售后',
            value: data?.pendingRefund || 0,
            pill: '退款售后',
            onClick: () => navigate('/order/list?status=4'),
            aria: '查看待处理售后订单',
          },
          {
            label: '待支付订单',
            value: data?.pendingPayment || 0,
            pill: '支付提醒',
            onClick: () => navigate('/order/list?status=0'),
            aria: '查看待支付订单',
          },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            className="db-todo"
            onClick={item.onClick}
            aria-label={item.aria}
            disabled={loading}
          >
            <div className="db-todoTop">
              <div className="db-todoLabel">{item.label}</div>
              <span className="db-todoPill">{item.pill}</span>
            </div>
            <div className="db-todoValue">{formatInteger(item.value)}</div>
            <div className="db-todoHint">立即处理，避免影响评价与履约时效</div>
          </button>
        ))}
      </div>

      <Row gutter={[16, 16]} style={{ marginTop: 18 }}>
        <Col xs={24} lg={12}>
          <Card
            title="近7日销售额"
            loading={loading}
            className="db-card"
            extra={
              <Button size="small" onClick={() => navigate('/order/list')}>
                查看订单
              </Button>
            }
          >
            <ReactECharts option={salesOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="近7日订单趋势"
            loading={loading}
            className="db-card"
            extra={
              <Button size="small" onClick={() => navigate('/order/list')}>
                全部订单
              </Button>
            }
          >
            <ReactECharts option={orderOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
