import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Row, Statistic, Tag, message } from 'antd';
import { AlertOutlined, DollarOutlined, ReloadOutlined, SafetyCertificateOutlined, ShoppingOutlined, UserOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStatistics, type DashboardData } from '../../services/dashboard';

const Dashboard: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

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
      console.error(error);
      messageApi.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  const orderTrendData = useMemo(() => data?.orderTrend || [], [data]);
  const statusDistributionData = useMemo(() => data?.statusDistribution || [], [data]);

  const orderOption = useMemo(() => {
    const x = orderTrendData.map((item) => item.name);
    const y = orderTrendData.map((item) => item.value);

    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 10, right: 18, top: 20, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: x,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: 'rgba(15, 23, 42, 0.14)' } },
        axisLabel: { color: 'rgba(15, 23, 42, 0.58)' },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(15, 23, 42, 0.08)' } },
        axisLabel: { color: 'rgba(15, 23, 42, 0.58)' },
      },
      series: [
        {
          data: y,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: { width: 3, color: '#2563EB' },
          itemStyle: {
            color: '#2563EB',
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.95)',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(37, 99, 235, 0.22)' },
                { offset: 1, color: 'rgba(37, 99, 235, 0.02)' },
              ],
            },
          },
        },
      ],
    };
  }, [orderTrendData]);

  const pieOption = useMemo(() => {
    const seriesData = statusDistributionData.map((item) => ({ value: item.value, name: item.name }));
    return {
      tooltip: { trigger: 'item' },
      legend: {
        orient: 'vertical',
        left: 'left',
        textStyle: { color: 'rgba(15, 23, 42, 0.62)' },
      },
      color: ['#2563EB', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#A855F7', '#64748B'],
      series: [
        {
          name: '订单状态',
          type: 'pie',
          radius: ['38%', '70%'],
          center: ['62%', '52%'],
          avoidLabelOverlap: true,
          label: { show: false },
          labelLine: { show: false },
          data: seriesData,
          emphasis: {
            scale: true,
            scaleSize: 10,
            itemStyle: {
              shadowBlur: 18,
              shadowOffsetX: 0,
              shadowColor: 'rgba(2, 6, 23, 0.24)',
            },
          },
        },
      ],
    };
  }, [statusDistributionData]);

  const statCards = useMemo(() => {
    return [
      {
        key: 'users',
        title: '总用户数',
        value: data?.totalUsers || 0,
        prefix: <UserOutlined />,
        tone: '蓝色',
      },
      {
        key: 'todayOrders',
        title: '今日订单',
        value: data?.todayOrders || 0,
        prefix: <ShoppingOutlined />,
        tone: '青色',
      },
      {
        key: 'todaySales',
        title: '今日销售额',
        value: data?.todaySales || 0,
        precision: 2,
        prefix: <DollarOutlined />,
        tone: '翡翠',
      },
      {
        key: 'totalSales',
        title: '总销售额',
        value: data?.totalSales || 0,
        precision: 2,
        prefix: <DollarOutlined />,
        tone: '琥珀',
      },
    ] as const;
  }, [data]);

  const pageStyles = `
    .ad-root {
      position: relative;
      padding: 8px 0;
    }
    .ad-hero {
      position: relative;
      overflow: hidden;
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background:
        radial-gradient(900px 380px at 10% 10%, rgba(37, 99, 235, 0.22), rgba(37, 99, 235, 0) 55%),
        radial-gradient(760px 360px at 75% 18%, rgba(14, 165, 233, 0.14), rgba(14, 165, 233, 0) 60%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.90) 0%, rgba(255, 255, 255, 0.80) 100%);
      box-shadow: 0 26px 80px rgba(2, 6, 23, 0.10);
      padding: 14px 14px 12px;
      margin-bottom: 16px;
    }
    .ad-hero::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.32;
      background-image: radial-gradient(rgba(15, 23, 42, 0.16) 1px, transparent 1px);
      background-size: 26px 26px;
      mask-image: radial-gradient(620px 460px at 65% 20%, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
    }
    .ad-top {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }
    .ad-title {
      margin: 0;
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.3px;
      color: rgba(15, 23, 42, 0.92);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ad-sub {
      margin-top: 4px;
      font-size: 12px;
      color: rgba(15, 23, 42, 0.62);
    }
    .ad-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .ad-chip.ant-tag {
      border-radius: 999px;
      padding-inline: 10px;
      margin-inline-end: 0;
      background: rgba(2, 6, 23, 0.04);
      border-color: rgba(15, 23, 42, 0.10);
      color: rgba(15, 23, 42, 0.70);
      font-weight: 650;
    }
    .ad-actions .ant-btn {
      border-radius: 999px;
      height: 36px;
      padding: 0 14px;
      font-weight: 650;
      border-color: rgba(15, 23, 42, 0.12);
      color: rgba(15, 23, 42, 0.78);
      background: rgba(255,255,255,0.78);
    }
    .ad-card.ant-card {
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      box-shadow: 0 20px 60px rgba(2, 6, 23, 0.08);
      background: rgba(255,255,255,0.86);
      overflow: hidden;
    }
    .ad-card .ant-card-body { padding: 14px; }

    .ad-stat {
      position: relative;
      overflow: hidden;
      transition: transform 160ms ease, box-shadow 160ms ease;
    }
    .ad-stat:hover {
      transform: translateY(-2px);
      box-shadow: 0 26px 70px rgba(2, 6, 23, 0.10);
    }
    .ad-stat::before {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.60;
      background:
        radial-gradient(420px 180px at 12% 12%, rgba(37, 99, 235, 0.12), rgba(37, 99, 235, 0) 60%),
        radial-gradient(420px 180px at 90% 30%, rgba(16, 185, 129, 0.10), rgba(16, 185, 129, 0) 65%);
    }
    .ad-statInner {
      position: relative;
      z-index: 1;
    }
    .ad-kpiTitle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 8px;
      color: rgba(15, 23, 42, 0.64);
      font-size: 12px;
      font-weight: 650;
    }
    .ad-kpiBadge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 999px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      padding: 3px 10px;
      background: rgba(255,255,255,0.82);
      color: rgba(15, 23, 42, 0.70);
      font-size: 12px;
      font-weight: 650;
    }
    .ad-kpiBadge i { opacity: 0.9; }

    .ad-todoGrid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .ad-todo {
      border-radius: 14px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background: rgba(255,255,255,0.78);
      padding: 12px;
      cursor: pointer;
      transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
      box-shadow: 0 14px 36px rgba(2, 6, 23, 0.06);
      display: grid;
      gap: 6px;
    }
    .ad-todo:hover {
      transform: translateY(-2px);
      border-color: rgba(37, 99, 235, 0.22);
      box-shadow: 0 22px 56px rgba(2, 6, 23, 0.10);
    }
    .ad-todoTop {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .ad-todoTitle {
      font-weight: 900;
      color: rgba(15, 23, 42, 0.86);
    }
    .ad-todoDesc {
      color: rgba(15, 23, 42, 0.62);
      font-size: 12px;
    }
    .ad-chartTitle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 10px;
    }
    .ad-chartTitle h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 900;
      color: rgba(15, 23, 42, 0.84);
    }
  `;

  return (
    <div className="ad-root">
      {contextHolder}
      <style>{pageStyles}</style>

      <div className="ad-hero" aria-label="管理端工作台概览">
        <div className="ad-top">
          <div>
            <h2 className="ad-title">
              <SafetyCertificateOutlined />
              工作台
            </h2>
            <div className="ad-sub">平台运营总览 · 关键待办 · 异常预警</div>
          </div>
          <div className="ad-actions">
            <Tag className="ad-chip">在线</Tag>
            <Tag className="ad-chip">
              {lastUpdatedAt ? `更新于 ${new Date(lastUpdatedAt).toLocaleTimeString()}` : '未刷新'}
            </Tag>
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
              刷新数据
            </Button>
          </div>
        </div>
      </div>

      <Row gutter={[14, 14]}>
        {statCards.map((s) => (
          <Col key={s.key} xs={24} sm={12} lg={6}>
            <Card className="ad-card ad-stat" loading={loading} variant="outlined">
              <div className="ad-statInner">
                <div className="ad-kpiTitle">
                  <span>{s.title}</span>
                  <span className="ad-kpiBadge">
                    {s.prefix}
                    <span style={{ opacity: 0.9 }}>{s.tone}</span>
                  </span>
                </div>
                <Statistic
                  value={s.value}
                  precision={'precision' in s ? s.precision : 0}
                  valueStyle={{ color: 'rgba(15, 23, 42, 0.90)', fontWeight: 900 }}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[14, 14]} style={{ marginTop: 14 }}>
        <Col xs={24} lg={12}>
          <Card className="ad-card" loading={loading} variant="outlined">
            <div className="ad-chartTitle">
              <h3>待办事项</h3>
              <Tag className="ad-chip">需要关注</Tag>
            </div>
            <div className="ad-todoGrid">
              <div className="ad-todo" onClick={() => navigate('/order/order-list?status=7')} role="button" tabIndex={0}>
                <div className="ad-todoTop">
                  <div className="ad-todoTitle">待审核处方/订单</div>
                  <Tag color="blue">{data?.pendingAudit || 0}</Tag>
                </div>
                <div className="ad-todoDesc">集中处理可降低用户流失与投诉风险</div>
              </div>
              <div className="ad-todo" onClick={() => navigate('/order/refund?status=0')} role="button" tabIndex={0}>
                <div className="ad-todoTop">
                  <div className="ad-todoTitle">待处理退款</div>
                  <Tag color="gold">{data?.pendingRefund || 0}</Tag>
                </div>
                <div className="ad-todoDesc">优先处理高金额退款，避免扩大舆情</div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card className="ad-card" variant="outlined">
            <div className="ad-chartTitle">
              <h3>运营提示</h3>
              <Tag className="ad-chip">策略建议</Tag>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ marginTop: 3, color: '#2563EB' }}>
                  <AlertOutlined />
                </span>
                <div>
                  <div style={{ fontWeight: 900, color: 'rgba(15, 23, 42, 0.82)' }}>关注趋势波动</div>
                  <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.62)' }}>
                    近 7 日订单曲线出现异常抖动时，优先排查活动渠道、库存与配送。
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ marginTop: 3, color: '#10B981' }}>
                  <AlertOutlined />
                </span>
                <div>
                  <div style={{ fontWeight: 900, color: 'rgba(15, 23, 42, 0.82)' }}>降低售后压力</div>
                  <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.62)' }}>
                    退款与售后高发时，建议联动商家优化履约 SLA 与客服话术模板。
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[14, 14]} style={{ marginTop: 14 }}>
        <Col xs={24} lg={12}>
          <Card className="ad-card" loading={loading} variant="outlined">
            <div className="ad-chartTitle">
              <h3>订单趋势</h3>
              <Tag className="ad-chip">近 7 日</Tag>
            </div>
            <ReactECharts option={orderOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className="ad-card" loading={loading} variant="outlined">
            <div className="ad-chartTitle">
              <h3>状态分布</h3>
              <Tag className="ad-chip">结构</Tag>
            </div>
            <ReactECharts option={pieOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
