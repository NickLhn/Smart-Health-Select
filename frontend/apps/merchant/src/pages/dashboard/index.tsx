import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, message } from 'antd';
import { ShoppingOutlined, DollarOutlined, FileTextOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { getDashboardStatistics, type DashboardData } from '../../services/dashboard';

const Dashboard: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getDashboardStatistics();
      if (res.code === 200) {
        setData(res.data);
      } else {
        messageApi.error(res.message);
      }
    } catch (error) {
      console.error(error);
      messageApi.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const salesTrendData = data?.salesTrend || [];
  const orderTrendData = data?.orderTrend || [];

  const salesOption = {
    title: {
      text: '近7日销售额',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: salesTrendData.map(item => item.name),
        axisTick: {
          alignWithLabel: true
        }
      }
    ],
    yAxis: [
      {
        type: 'value'
      }
    ],
    series: [
      {
        name: '销售额',
        type: 'bar',
        barWidth: '60%',
        data: salesTrendData.map(item => item.value),
        itemStyle: {
            color: '#cf1322'
        }
      }
    ]
  };

  // 使用订单量趋势代替流量趋势
  const visitorOption = {
    title: {
      text: '近7日订单量趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: orderTrendData.map(item => item.name)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '订单数',
        type: 'line',
        data: orderTrendData.map(item => item.value),
        smooth: true,
        itemStyle: {
           color: '#1890ff'
        },
        areaStyle: {
           color: 'rgba(24, 144, 255, 0.2)'
        }
      }
    ]
  };

  return (
    <div>
      {contextHolder}
      <h2 style={{ marginBottom: 24 }}>商家工作台</h2>

      {/* 待办事项 */}
      <Card title="待办事项" style={{ marginBottom: 24 }} loading={loading}>
        <Row gutter={16} justify="space-around">
           <Col span={6} style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => window.location.href = '/order/list?status=1'}>
              <Statistic title="待发货订单" value={data?.pendingShipment || 0} valueStyle={{ color: '#faad14' }} />
           </Col>
           <Col span={6} style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => window.location.href = '/order/list?status=7'}>
              <Statistic title="待审核处方" value={data?.pendingAudit || 0} valueStyle={{ color: '#ff4d4f' }} />
           </Col>
           <Col span={6} style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => window.location.href = '/order/list?status=4'}>
              <Statistic title="待处理售后" value={data?.pendingRefund || 0} valueStyle={{ color: '#fa541c' }} />
           </Col>
           <Col span={6} style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => window.location.href = '/order/list?status=0'}>
              <Statistic title="待支付订单" value={data?.pendingPayment || 0} valueStyle={{ color: '#595959' }} />
           </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        <Col span={8}>
          <Card variant="borderless" loading={loading}>
            <Statistic
              title="今日订单"
              value={data?.todayOrders || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card variant="borderless" loading={loading}>
            <Statistic
              title="今日销售额"
              value={data?.todaySales || 0}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card variant="borderless" loading={loading}>
            <Statistic
              title="在售商品"
              value={data?.productCount || 0}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
           <Card title="销售额统计" loading={loading}>
              <ReactECharts option={salesOption} style={{ height: 300 }} />
           </Card>
        </Col>
        <Col span={12}>
           <Card title="订单量趋势" loading={loading}>
              <ReactECharts option={visitorOption} style={{ height: 300 }} />
           </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
