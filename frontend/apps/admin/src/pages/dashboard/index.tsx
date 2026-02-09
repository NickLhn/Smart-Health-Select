import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, message, Tag, Space } from 'antd';
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-400 mb-1">运营总览</div>
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">工作台</h2>
        </div>
        <Space size="small">
          <Tag color="default">在线</Tag>
          <span className="text-xs text-gray-400">数据来自运营后台实时统计</span>
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={6}>
          <Card
            loading={loading}
            bordered={false}
            className="border border-gray-100/80 shadow-none"
          >
            <Statistic
              title="总用户数"
              value={data?.totalUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#111827' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            loading={loading}
            bordered={false}
            className="border border-gray-100/80 shadow-none"
          >
            <Statistic
              title="今日订单"
              value={data?.todayOrders || 0}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#111827' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            loading={loading}
            bordered={false}
            className="border border-gray-100/80 shadow-none"
          >
            <Statistic
              title="今日销售额"
              value={data?.todaySales || 0}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#111827' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            loading={loading}
            bordered={false}
            className="border border-gray-100/80 shadow-none"
          >
            <Statistic
              title="总销售额"
              value={data?.totalSales || 0}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#111827' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card
            loading={loading}
            bordered={false}
            className="border border-gray-100/80 shadow-none"
            title="待办事项"
          >
            <Row gutter={16} justify="space-around">
              <Col
                span={12}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/order/order-list?status=7')}
              >
                <Statistic
                  title="待审核处方/订单"
                  value={data?.pendingAudit || 0}
                  valueStyle={{ color: '#111827' }}
                />
              </Col>
              <Col
                span={12}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/order/refund?status=0')}
              >
                <Statistic
                  title="待处理退款"
                  value={data?.pendingRefund || 0}
                  valueStyle={{ color: '#111827' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card
            bordered={false}
            className="border border-gray-100/80 shadow-none"
            title="运营提示"
          >
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex items-center justify-between">
                <span>近7日订单趋势</span>
                <Tag color="default">实时</Tag>
              </div>
              <div>关注异常波动，及时排查渠道与库存问题。</div>
              <div className="flex items-center justify-between mt-4">
                <span>退款与售后占比</span>
                <Tag color="default">重点</Tag>
              </div>
              <div>售后率过高时，建议联动商家优化履约与客服流程。</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card
            loading={loading}
            bordered={false}
            className="border border-gray-100/80 shadow-none"
            title="订单趋势"
          >
            <ReactECharts option={orderOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card
            loading={loading}
            bordered={false}
            className="border border-gray-100/80 shadow-none"
            title="状态分布"
          >
            <ReactECharts option={pieOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
