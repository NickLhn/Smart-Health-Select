import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Card, Descriptions, Drawer, Form, Image, Input, Radio, Select, Space, Table, Tag, Typography, App } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleOutlined, EyeOutlined, ReloadOutlined, SearchOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { getAdminOrderList, auditOrder } from '../../../services/order';
import type { Order } from '../../../services/order';

const { Option } = Select;

const OrderList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Order[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [status, setStatus] = useState<number | undefined>(
    searchParams.get('status') ? Number(searchParams.get('status')) : undefined
  );
  const [filters, setFilters] = useState<{ keyword?: string }>({});
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  // Audit State
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditForm] = Form.useForm();
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditTarget, setAuditTarget] = useState<Order | null>(null);
  const [filterForm] = Form.useForm();

  useEffect(() => {
    fetchOrders();
  }, [pagination.current, pagination.pageSize, status, filters]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      // 订单列表把分页、状态和关键字筛选统一交给后端处理。
      const res = await getAdminOrderList({
        page: pagination.current,
        size: pagination.pageSize,
        status: status,
        ...(filters.keyword ? { keyword: filters.keyword } : {}),
      });
      if (res.code === 200) {
        setData(res.data.records);
        setPagination({
          ...pagination,
          total: res.data.total,
        });
        setLastUpdatedAt(Date.now());
      }
    } catch (error) {
      message.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  }, [filters.keyword, message, pagination, status]);

  const openDetail = useCallback((record: Order) => {
    setCurrentOrder(record);
    setDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setCurrentOrder(null);
  }, []);

  const statusMeta = useCallback((s: number) => {
    switch (s) {
      case 0:
        return { color: 'default', text: '待支付' };
      case 1:
        return { color: 'orange', text: '待发货' };
      case 2:
        return { color: 'blue', text: '配送中' };
      case 3:
        return { color: 'green', text: '已完成' };
      case 4:
        return { color: 'purple', text: '售后中' };
      case 5:
        return { color: 'magenta', text: '已退款' };
      case 6:
        return { color: 'red', text: '已取消' };
      case 7:
        return { color: 'orange', text: '待审核' };
      default:
        return { color: 'default', text: '未知' };
    }
  }, []);

  const columns: ColumnsType<Order> = useMemo(() => {
    return [
      {
        title: '订单',
        key: 'order',
        width: 320,
        render: (_, record) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar size={40} icon={<ShoppingOutlined />} style={{ background: 'rgba(37, 99, 235, 1)' }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 900, color: 'rgba(15, 23, 42, 0.86)' }}>
                <Typography.Text ellipsis style={{ maxWidth: 240 }} copyable={{ text: record.orderNo }}>
                  {record.orderNo}
                </Typography.Text>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.56)' }}>
                买家：{record.receiverName || (record.userId !== undefined && record.userId !== null ? `用户 #${record.userId}` : '-')} · {record.createTime || '-'}
              </div>
            </div>
          </div>
        ),
      },
      {
        title: '商品',
        key: 'product',
        render: (_, record) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar shape="square" size={40} src={record.medicineImage} style={{ borderRadius: 12, background: 'rgba(2, 6, 23, 0.06)' }} />
            <div style={{ minWidth: 0 }}>
              <Typography.Text ellipsis style={{ maxWidth: 260, color: 'rgba(15, 23, 42, 0.82)' }}>
                {record.medicineName || '-'}
              </Typography.Text>
              <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.56)' }}>x {record.quantity ?? '-'}</div>
            </div>
          </div>
        ),
      },
      {
        title: '收货人',
        dataIndex: 'receiverName',
        key: 'receiverName',
        width: 120,
        render: (v: string) => <Typography.Text style={{ color: 'rgba(15, 23, 42, 0.78)' }}>{v || '-'}</Typography.Text>,
      },
      {
        title: '金额',
        dataIndex: 'payAmount',
        key: 'payAmount',
        width: 120,
        render: (amount: number) => (
          <Typography.Text style={{ fontWeight: 900, color: 'rgba(15, 23, 42, 0.86)' }}>
            ¥{Number(amount || 0).toFixed(2)}
          </Typography.Text>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (s: number) => {
          const meta = statusMeta(s);
          return (
            <Tag color={meta.color} style={{ borderRadius: 999, paddingInline: 10 }}>
              {meta.text}
            </Tag>
          );
        },
      },
      {
        title: '操作',
        key: 'action',
        width: 220,
        fixed: 'right',
        render: (_, record) => (
          <Space size={8}>
            <Button icon={<EyeOutlined />} onClick={() => openDetail(record)} style={{ borderRadius: 999 }}>
              查看
            </Button>
            {record.status === 7 ? (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => showAudit(record)}
                style={{
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, rgba(37, 99, 235, 1), rgba(14, 165, 233, 1))',
                  border: 'none',
                  boxShadow: '0 18px 42px rgba(37, 99, 235, 0.18)',
                }}
              >
                审核
              </Button>
            ) : null}
          </Space>
        ),
      },
    ];
  }, [openDetail, statusMeta]);

  const handleTableChange = (pag: any) => {
    setPagination({ ...pagination, current: pag.current, pageSize: pag.pageSize });
  };

  const handleStatusChange = (value: string) => {
    if (value === 'all') {
        setStatus(undefined);
    } else {
        setStatus(Number(value));
    }
    setPagination({ ...pagination, current: 1 });
  };

  const handleAudit = async () => {
    try {
      const values = await auditForm.validateFields();
      if (!auditTarget) return;
      
      setAuditLoading(true);
      const res = await auditOrder({
        orderId: auditTarget.id,
        pass: values.pass,
        reason: values.reason
      });
      
      if (res.code === 200) {
        message.success('审核完成');
        setAuditOpen(false);
        fetchOrders(); 
      } else {
        message.error(res.message || '审核失败');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setAuditLoading(false);
    }
  };

  const showAudit = (record: Order) => {
    // 每次打开审核弹窗都重置表单，避免带入上一单的审核意见。
    setAuditTarget(record);
    auditForm.resetFields();
    setAuditOpen(true);
  };

  const handleFilter = useCallback((values: any) => {
    const kw = (values?.keyword || '').trim();
    setFilters({ keyword: kw || undefined });
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const handleReset = useCallback(() => {
    filterForm.resetFields();
    setFilters({});
    setStatus(undefined);
    setPagination((prev) => ({ ...prev, current: 1, pageSize: prev.pageSize }));
  }, [filterForm]);

  const pageStyles = `
    .od-root { position: relative; padding: 8px 0; }
    .od-hero {
      position: relative;
      overflow: hidden;
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background:
        radial-gradient(900px 380px at 10% 10%, rgba(37, 99, 235, 0.22), rgba(37, 99, 235, 0) 55%),
        radial-gradient(760px 360px at 78% 18%, rgba(236, 72, 153, 0.12), rgba(236, 72, 153, 0) 60%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.90) 0%, rgba(255, 255, 255, 0.82) 100%);
      box-shadow: 0 26px 80px rgba(2, 6, 23, 0.10);
      padding: 14px 14px 12px;
      margin-bottom: 14px;
    }
    .od-hero::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.30;
      background-image: radial-gradient(rgba(15, 23, 42, 0.16) 1px, transparent 1px);
      background-size: 26px 26px;
      mask-image: radial-gradient(620px 460px at 65% 20%, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
    }
    .od-top {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }
    .od-title {
      margin: 0;
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.3px;
      color: rgba(15, 23, 42, 0.92);
    }
    .od-sub {
      margin-top: 4px;
      font-size: 12px;
      color: rgba(15, 23, 42, 0.62);
    }
    .od-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .od-chip.ant-tag {
      border-radius: 999px;
      padding-inline: 10px;
      margin-inline-end: 0;
      background: rgba(2, 6, 23, 0.04);
      border-color: rgba(15, 23, 42, 0.10);
      color: rgba(15, 23, 42, 0.70);
      font-weight: 650;
    }
    .od-actions .ant-btn {
      border-radius: 999px;
      height: 36px;
      padding: 0 14px;
      font-weight: 650;
      border-color: rgba(15, 23, 42, 0.12);
      color: rgba(15, 23, 42, 0.78);
      background: rgba(255,255,255,0.78);
    }
    .od-card.ant-card {
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      box-shadow: 0 20px 60px rgba(2, 6, 23, 0.08);
      background: rgba(255,255,255,0.86);
      overflow: hidden;
    }
    .od-card .ant-card-body { padding: 14px; }
    .od-filters { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
    .od-filters .ant-form-item { margin-bottom: 0; }
    .od-table .ant-table-container {
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(15, 23, 42, 0.08);
    }
    .od-table .ant-table-thead > tr > th {
      background: rgba(2, 6, 23, 0.02);
      color: rgba(15, 23, 42, 0.70);
      font-weight: 900;
    }
    .od-table .ant-table-tbody > tr > td {
      border-bottom: 1px solid rgba(15, 23, 42, 0.06);
    }
  `;

  return (
    <div className="od-root">
      <style>{pageStyles}</style>

      <div className="od-hero" aria-label="订单列表概览">
        <div className="od-top">
          <div>
            <h2 className="od-title">订单列表</h2>
            <div className="od-sub">支持状态筛选、订单搜索与处方审核</div>
          </div>
          <div className="od-actions">
            <Tag className="od-chip">总计 {pagination.total}</Tag>
            <Tag className="od-chip">
              {lastUpdatedAt ? `更新于 ${new Date(lastUpdatedAt).toLocaleTimeString()}` : '未刷新'}
            </Tag>
            <Button icon={<ReloadOutlined />} onClick={fetchOrders} loading={loading}>
              刷新
            </Button>
          </div>
        </div>
      </div>

      <Card className="od-card" variant="outlined">
        <Form form={filterForm} layout="vertical" onFinish={handleFilter}>
          <div className="od-filters">
            <Form.Item name="keyword" label="关键词">
              <Input allowClear prefix={<SearchOutlined />} placeholder="订单编号 / 收货人" style={{ width: 300 }} />
            </Form.Item>
            <Form.Item label="状态">
              <Select value={status === undefined ? 'all' : String(status)} style={{ width: 160 }} onChange={handleStatusChange}>
                <Option value="all">全部状态</Option>
                <Option value="0">待支付</Option>
                <Option value="1">待发货</Option>
                <Option value="2">配送中</Option>
                <Option value="3">已完成</Option>
                <Option value="4">售后中</Option>
                <Option value="5">已退款</Option>
                <Option value="6">已取消</Option>
                <Option value="7">待审核</Option>
              </Select>
            </Form.Item>
            <Form.Item label=" ">
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SearchOutlined />}
                  style={{
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, rgba(37, 99, 235, 1), rgba(14, 165, 233, 1))',
                    border: 'none',
                    boxShadow: '0 18px 42px rgba(37, 99, 235, 0.18)',
                  }}
                >
                  查询
                </Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />} style={{ borderRadius: 999 }}>
                  重置
                </Button>
              </Space>
            </Form.Item>
          </div>
        </Form>
      </Card>

      <Card className="od-card od-table" variant="outlined" style={{ marginTop: 14 }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            ...pagination,
            showTotal: (t) => `共 ${t} 条`,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (page, pageSize) => setPagination((prev) => ({ ...prev, current: page, pageSize })),
          }}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 1100 }}
        />
      </Card>

      <Drawer title="订单详情" open={detailOpen} onClose={closeDetail} width={520} destroyOnClose>
        {currentOrder ? (
          <Card className="od-card" variant="outlined">
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="订单编号">
                <Typography.Text copyable={{ text: currentOrder.orderNo }}>{currentOrder.orderNo}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMeta(currentOrder.status).color} style={{ borderRadius: 999, paddingInline: 10 }}>
                  {statusMeta(currentOrder.status).text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="买家">{currentOrder.receiverName || (currentOrder.userId !== undefined && currentOrder.userId !== null ? `用户 #${currentOrder.userId}` : '-')}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{currentOrder.createTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="药品">{currentOrder.medicineName || '-'}</Descriptions.Item>
              <Descriptions.Item label="数量">x {currentOrder.quantity ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="金额">¥{Number(currentOrder.payAmount || 0).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="收货人">{currentOrder.receiverName || '-'}</Descriptions.Item>
              <Descriptions.Item label="收货电话">{currentOrder.receiverPhone || '-'}</Descriptions.Item>
              <Descriptions.Item label="收货地址">{currentOrder.receiverAddress || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        ) : null}
      </Drawer>

      <Drawer
        title="处方审核"
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
        width={520}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <Button onClick={() => setAuditOpen(false)} style={{ borderRadius: 999 }}>
              取消
            </Button>
            <Button
              type="primary"
              onClick={handleAudit}
              loading={auditLoading}
              style={{
                borderRadius: 999,
                background: 'linear-gradient(90deg, rgba(37, 99, 235, 1), rgba(14, 165, 233, 1))',
                border: 'none',
                boxShadow: '0 18px 42px rgba(37, 99, 235, 0.18)',
              }}
            >
              提交审核
            </Button>
          </div>
        }
      >
        {auditTarget ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Card className="od-card" variant="outlined">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontWeight: 900, color: 'rgba(15, 23, 42, 0.82)' }}>处方图片</div>
                {auditTarget.prescriptionImage ? (
                  <Image src={auditTarget.prescriptionImage} height={240} style={{ objectFit: 'contain', borderRadius: 12, background: 'rgba(2, 6, 23, 0.04)' }} />
                ) : (
                  <div style={{ padding: 12, borderRadius: 12, border: '1px dashed rgba(15, 23, 42, 0.16)', color: 'rgba(185, 28, 28, 0.86)' }}>
                    未上传处方图片
                  </div>
                )}
              </div>
            </Card>

            <Card className="od-card" variant="outlined">
              <Form form={auditForm} layout="vertical">
                <Form.Item name="pass" label="审核结果" rules={[{ required: true }]}>
                  <Radio.Group>
                    <Radio value={true}>通过</Radio>
                    <Radio value={false}>拒绝</Radio>
                  </Radio.Group>
                </Form.Item>
                <Form.Item name="reason" label="审核意见" rules={[{ required: true, message: '请输入审核意见' }]}>
                  <Input.TextArea rows={3} placeholder="请输入审核意见（如拒绝原因）" />
                </Form.Item>
              </Form>
            </Card>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
};

export default OrderList;
