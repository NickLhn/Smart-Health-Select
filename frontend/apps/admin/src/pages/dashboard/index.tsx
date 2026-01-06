import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, message } from 'antd';
import { UserOutlined, ShoppingOutlined, DollarOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStatistics, type DashboardData } from '../../services/dashboard';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
        message.error(res.message);
      }
    } catch (error) {
      console.error(error);
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const orderTrendData = data?.orderTrend || [];
  const statusDistributionData = data?.statusDistribution || [];

  const orderOption = {
    title: {
      text: '近7日订单趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: orderTrendData.map(item => item.name)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: orderTrendData.map(item => item.value),
        type: 'line',
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

  const pieOption = {
    title: {
      text: '订单状态分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '订单状态',
        type: 'pie',
        radius: '50%',
        data: statusDistributionData.map(item => ({ value: item.value, name: item.name })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>工作台</h2>

      {/* 待办事项 */}
      <Card title="待办事项" style={{ marginBottom: 24 }} loading={loading}>
         <Row gutter={16} justify="space-around">
            <Col span={8} style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/order/order-list?status=7')}>
               <Statistic title="待审核处方/订单" value={data?.pendingAudit || 0} valueStyle={{ color: '#ff4d4f' }} />
            </Col>
            <Col span={8} style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/order/refund?status=0')}>
               <Statistic title="待处理退款" value={data?.pendingRefund || 0} valueStyle={{ color: '#fa541c' }} />
            </Col>
         </Row>
      </Card>

      <Row gutter={16}>
        <Col span={6}>
          <Card variant="borderless" loading={loading}>
            <Statistic
              title="总用户数"
              value={data?.totalUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card variant="borderless" loading={loading}>
            <Statistic
              title="今日订单"
              value={data?.todayOrders || 0}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
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
        <Col span={6}>
          <Card variant="borderless" loading={loading}>
            <Statistic
              title="总销售额"
              value={data?.totalSales || 0}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
           <Card title="订单趋势" loading={loading}>
              <ReactECharts option={orderOption} style={{ height: 300 }} />
           </Card>
        </Col>
        <Col span={12}>
           <Card title="状态分布" loading={loading}>
              <ReactECharts option={pieOption} style={{ height: 300 }} />
           </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
