import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { App, Button, Card, DatePicker, Descriptions, Drawer, Form, Input, InputNumber, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd';
import { GiftOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import request from '../../../services/request';
import { getCouponPage } from '../../../services/marketing';
import type { Coupon } from '../../../services/marketing';

const { RangePicker } = DatePicker;

const CouponList: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Coupon[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<any>({});
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [filterForm] = Form.useForm();
  
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState<Coupon | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCouponPage({
        page,
        size: pageSize,
        ...filters,
      });
      if (res.code === 200) {
        setData(res.data.records);
        setTotal(res.data.total);
        setLastUpdatedAt(Date.now());
      }
    } catch (error) {
      message.error('获取优惠券列表失败');
    } finally {
      setLoading(false);
    }
  }, [filters, message, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [page, pageSize, filters]);

  const handleSearch = useCallback((values: any) => {
    setFilters(values);
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    filterForm.resetFields();
    setFilters({});
    setPage(1);
  }, [filterForm]);

  const handleDelete = async (id: number) => {
    try {
      const res = await request.delete(`/marketing/coupon/delete/${id}`);
      if (res.code === 200) {
        message.success('删除成功');
        fetchData();
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleStatusChange = async (id: number, status: number) => {
    try {
      const res = await request.put(`/marketing/coupon/status/${id}?status=${status}`);
      if (res.code === 200) {
        message.success('操作成功');
        fetchData();
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleEdit = (record: Coupon) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      timeRange: [dayjs(record.startTime), dayjs(record.endTime)]
    });
    setEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    form.resetFields();
    setEditorOpen(true);
  };

  const handleEditorSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        startTime: values.timeRange[0].format('YYYY-MM-DD HH:mm:ss'),
        endTime: values.timeRange[1].format('YYYY-MM-DD HH:mm:ss'),
      };
      delete payload.timeRange;

      if (editingId) {
        const res = await request.put(`/marketing/coupon/update/${editingId}`, payload);
        if (res.code === 200) {
          message.success('更新成功');
          setEditorOpen(false);
          fetchData();
        }
      } else {
        const res = await request.post('/marketing/coupon/create', payload);
        if (res.code === 200) {
          message.success('创建成功');
          setEditorOpen(false);
          fetchData();
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const typeMeta = useCallback((t: number) => {
    switch (t) {
      case 0:
        return { text: '全场通用', color: 'geekblue' as const };
      case 1:
        return { text: '指定分类', color: 'purple' as const };
      case 2:
        return { text: '指定商品', color: 'cyan' as const };
      default:
        return { text: '未知', color: 'default' as const };
    }
  }, []);

  const statusMeta = useCallback((s: number) => {
    if (s === 1) return { text: '启用', color: 'green' as const };
    return { text: '禁用', color: 'red' as const };
  }, []);

  const currentPageStats = useMemo(() => {
    const enabled = data.filter((d) => d.status === 1).length;
    const disabled = data.length - enabled;
    return { enabled, disabled };
  }, [data]);

  const columns = useMemo(() => {
    return [
      {
        title: '优惠券',
        key: 'coupon',
        width: 360,
        render: (_: any, record: Coupon) => {
          const meta = typeMeta(record.type);
          return (
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 950, color: 'rgba(15, 23, 42, 0.86)' }}>
                  <Typography.Link
                    onClick={() => {
                      setCurrentCoupon(record);
                      setDetailOpen(true);
                    }}
                    style={{ color: 'rgba(15, 23, 42, 0.86)' }}
                  >
                    <Typography.Text ellipsis style={{ maxWidth: 240 }}>
                      {record.name}
                    </Typography.Text>
                  </Typography.Link>
                </div>
              </div>
              <Tag color={meta.color} style={{ borderRadius: 999, paddingInline: 10, marginInlineEnd: 0 }}>
                {meta.text}
              </Tag>
            </div>
          );
        },
      },
      {
        title: '力度',
        key: 'value',
        width: 200,
        render: (_: any, record: Coupon) => {
          const min = Number(record.minPoint || 0);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontWeight: 950, fontSize: 16, color: 'rgba(185, 28, 28, 0.90)' }}>¥{Number(record.amount || 0).toFixed(2)}</span>
                <span style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.56)' }}>面值</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.70)' }}>{min > 0 ? `满 ¥${min.toFixed(2)} 可用` : '无门槛'}</div>
              <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.56)' }}>每人限领 {record.perLimit}</div>
            </div>
          );
        },
      },
      {
        title: '有效期',
        key: 'time',
        width: 220,
        render: (_: any, record: Coupon) => {
          const now = dayjs();
          const end = dayjs(record.endTime);
          const diffHours = end.diff(now, 'hour');
          const expired = diffHours < 0;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.78)' }}>
                <div>{dayjs(record.startTime).format('YYYY-MM-DD HH:mm')}</div>
                <div>{dayjs(record.endTime).format('YYYY-MM-DD HH:mm')}</div>
              </div>
              <Tag
                color={expired ? 'default' : diffHours <= 72 ? 'orange' : 'green'}
                style={{ borderRadius: 999, paddingInline: 10, width: 'fit-content', marginInlineEnd: 0 }}
              >
                {expired ? '已过期' : diffHours <= 72 ? '临近到期' : '有效'}
              </Tag>
            </div>
          );
        },
      },
      {
        title: '发放 / 使用',
        key: 'usage',
        width: 200,
        render: (_: any, record: Coupon) => {
          const totalCount = Number(record.totalCount || 0);
          const receiveCount = Number(record.receiveCount || 0);
          const useCount = Number(record.useCount || 0);
          const denom = Math.max(1, totalCount);
          const receivePct = Math.min(100, Math.round((receiveCount / denom) * 100));
          const usePct = Math.min(100, Math.round((useCount / Math.max(1, receiveCount)) * 100));
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, color: 'rgba(15, 23, 42, 0.62)' }}>
                <span>总量 {totalCount}</span>
                <span>已领 {receiveCount}</span>
                <span>已用 {useCount}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(15, 23, 42, 0.56)' }}>
                    <span>领取进度</span>
                    <span>{receivePct}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: 'rgba(2, 6, 23, 0.06)', overflow: 'hidden' }}>
                    <div style={{ width: `${receivePct}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, rgba(14, 165, 233, 1), rgba(37, 99, 235, 1))' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(15, 23, 42, 0.56)' }}>
                    <span>使用转化</span>
                    <span>{usePct}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: 'rgba(2, 6, 23, 0.06)', overflow: 'hidden' }}>
                    <div style={{ width: `${usePct}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, rgba(16, 185, 129, 1), rgba(14, 165, 233, 1))' }} />
                  </div>
                </div>
              </div>
            </div>
          );
        },
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
        fixed: 'right' as const,
        render: (_: any, record: Coupon) => (
          <Space size={8}>
            <Button onClick={() => handleEdit(record)} style={{ borderRadius: 999 }}>
              编辑
            </Button>
            <Button
              onClick={() => handleStatusChange(record.id, record.status === 1 ? 0 : 1)}
              style={{ borderRadius: 999 }}
              type={record.status === 1 ? 'default' : 'primary'}
              danger={record.status === 1}
            >
              {record.status === 1 ? '禁用' : '启用'}
            </Button>
            <Popconfirm title="确定删除该优惠券吗？" onConfirm={() => handleDelete(record.id)}>
              <Button danger style={{ borderRadius: 999 }}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ];
  }, [handleDelete, handleEdit, handleStatusChange, statusMeta, typeMeta]);

  const pageStyles = `
    .cp-root { position: relative; padding: 8px 0; }
    .cp-hero {
      position: relative;
      overflow: hidden;
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background:
        radial-gradient(920px 380px at 12% 16%, rgba(249, 115, 22, 0.18), rgba(249, 115, 22, 0) 55%),
        radial-gradient(760px 360px at 76% 18%, rgba(37, 99, 235, 0.16), rgba(37, 99, 235, 0) 60%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.90) 0%, rgba(255, 255, 255, 0.82) 100%);
      box-shadow: 0 26px 80px rgba(2, 6, 23, 0.10);
      padding: 14px 14px 12px;
      margin-bottom: 14px;
    }
    .cp-hero::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.28;
      background-image: radial-gradient(rgba(15, 23, 42, 0.16) 1px, transparent 1px);
      background-size: 26px 26px;
      mask-image: radial-gradient(620px 460px at 70% 22%, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
    }
    .cp-top {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }
    .cp-title {
      margin: 0;
      font-size: 20px;
      font-weight: 950;
      letter-spacing: -0.3px;
      color: rgba(15, 23, 42, 0.92);
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .cp-sub {
      margin-top: 4px;
      font-size: 12px;
      color: rgba(15, 23, 42, 0.62);
    }
    .cp-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .cp-chip.ant-tag {
      border-radius: 999px;
      padding-inline: 10px;
      margin-inline-end: 0;
      background: rgba(2, 6, 23, 0.04);
      border-color: rgba(15, 23, 42, 0.10);
      color: rgba(15, 23, 42, 0.70);
      font-weight: 650;
    }
    .cp-actions .ant-btn {
      border-radius: 999px;
      height: 36px;
      padding: 0 14px;
      font-weight: 650;
      border-color: rgba(15, 23, 42, 0.12);
      color: rgba(15, 23, 42, 0.78);
      background: rgba(255,255,255,0.78);
    }
    .cp-primaryBtn.ant-btn-primary {
      border-radius: 999px;
      height: 36px;
      padding: 0 14px;
      background: linear-gradient(90deg, rgba(249, 115, 22, 1), rgba(236, 72, 153, 1));
      border: none;
      box-shadow: 0 18px 42px rgba(249, 115, 22, 0.18);
      font-weight: 800;
    }
    .cp-card.ant-card {
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      box-shadow: 0 20px 60px rgba(2, 6, 23, 0.08);
      background: rgba(255,255,255,0.86);
      overflow: hidden;
    }
    .cp-card .ant-card-body { padding: 14px; }
    .cp-filters { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
    .cp-filters .ant-form-item { margin-bottom: 0; }
    .cp-table .ant-table-container {
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(15, 23, 42, 0.08);
    }
    .cp-table .ant-table-thead > tr > th {
      background: rgba(2, 6, 23, 0.02);
      color: rgba(15, 23, 42, 0.70);
      font-weight: 950;
    }
    .cp-table .ant-table-tbody > tr > td {
      border-bottom: 1px solid rgba(15, 23, 42, 0.06);
    }
  `;

  return (
    <div className="cp-root">
      <style>{pageStyles}</style>

      <div className="cp-hero" aria-label="优惠券管理概览">
        <div className="cp-top">
          <div>
            <h2 className="cp-title">
              <GiftOutlined />
              优惠券管理
            </h2>
            <div className="cp-sub">统一查看、筛选与发放策略维护</div>
          </div>
          <div className="cp-actions">
            <Tag className="cp-chip">总计 {total}</Tag>
            <Tag className="cp-chip">本页启用 {currentPageStats.enabled}</Tag>
            <Tag className="cp-chip">本页禁用 {currentPageStats.disabled}</Tag>
            <Tag className="cp-chip">
              {lastUpdatedAt ? `更新于 ${new Date(lastUpdatedAt).toLocaleTimeString()}` : '未刷新'}
            </Tag>
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
              刷新
            </Button>
            <Button className="cp-primaryBtn" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建优惠券
            </Button>
          </div>
        </div>
      </div>

      <Card className="cp-card" variant="outlined">
        <Form form={filterForm} layout="vertical" onFinish={handleSearch}>
          <div className="cp-filters">
            <Form.Item name="name" label="名称">
              <Input allowClear prefix={<SearchOutlined />} placeholder="输入优惠券名称" style={{ width: 280 }} />
            </Form.Item>
            <Form.Item name="type" label="类型">
              <Select placeholder="全部" allowClear style={{ width: 160 }}>
                <Select.Option value={0}>全场通用</Select.Option>
                <Select.Option value={1}>指定分类</Select.Option>
                <Select.Option value={2}>指定商品</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Select placeholder="全部" allowClear style={{ width: 160 }}>
                <Select.Option value={1}>启用</Select.Option>
                <Select.Option value={0}>禁用</Select.Option>
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
                    background: 'linear-gradient(90deg, rgba(249, 115, 22, 1), rgba(236, 72, 153, 1))',
                    border: 'none',
                    boxShadow: '0 18px 42px rgba(249, 115, 22, 0.18)',
                    fontWeight: 800,
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

      <Card className="cp-card cp-table" variant="outlined" style={{ marginTop: 14 }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: (t) => `共 ${t} 条`,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (p, s) => {
              setPage(p);
              setPageSize(s);
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Drawer title="优惠券详情" open={detailOpen} onClose={() => setDetailOpen(false)} width={520} destroyOnClose>
        {currentCoupon ? (
          <Card className="cp-card" variant="outlined">
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="名称">{currentCoupon.name}</Descriptions.Item>
              <Descriptions.Item label="类型">
                <Tag color={typeMeta(currentCoupon.type).color} style={{ borderRadius: 999, paddingInline: 10 }}>
                  {typeMeta(currentCoupon.type).text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="面值">¥{Number(currentCoupon.amount || 0).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="门槛">{Number(currentCoupon.minPoint || 0) > 0 ? `满 ¥${Number(currentCoupon.minPoint).toFixed(2)} 可用` : '无门槛'}</Descriptions.Item>
              <Descriptions.Item label="每人限领">{currentCoupon.perLimit}</Descriptions.Item>
              <Descriptions.Item label="发行总量">{currentCoupon.totalCount}</Descriptions.Item>
              <Descriptions.Item label="已领取">{currentCoupon.receiveCount}</Descriptions.Item>
              <Descriptions.Item label="已使用">{currentCoupon.useCount}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMeta(currentCoupon.status).color} style={{ borderRadius: 999, paddingInline: 10 }}>
                  {statusMeta(currentCoupon.status).text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="有效期">
                <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.78)' }}>
                  <div>{dayjs(currentCoupon.startTime).format('YYYY-MM-DD HH:mm')}</div>
                  <div>{dayjs(currentCoupon.endTime).format('YYYY-MM-DD HH:mm')}</div>
                </div>
              </Descriptions.Item>
            </Descriptions>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
              <Button onClick={() => handleEdit(currentCoupon)} style={{ borderRadius: 999 }}>
                编辑
              </Button>
              <Button
                type={currentCoupon.status === 1 ? 'default' : 'primary'}
                danger={currentCoupon.status === 1}
                onClick={async () => {
                  await handleStatusChange(currentCoupon.id, currentCoupon.status === 1 ? 0 : 1);
                  setDetailOpen(false);
                }}
                style={{ borderRadius: 999 }}
              >
                {currentCoupon.status === 1 ? '禁用' : '启用'}
              </Button>
            </div>
          </Card>
        ) : null}
      </Drawer>

      <Drawer
        title={editingId ? '编辑优惠券' : '新建优惠券'}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        width={560}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <Button onClick={() => setEditorOpen(false)} style={{ borderRadius: 999 }}>
              取消
            </Button>
            <Button
              type="primary"
              onClick={handleEditorSubmit}
              style={{
                borderRadius: 999,
                background: 'linear-gradient(90deg, rgba(249, 115, 22, 1), rgba(236, 72, 153, 1))',
                border: 'none',
                boxShadow: '0 18px 42px rgba(249, 115, 22, 0.18)',
                fontWeight: 800,
              }}
            >
              保存
            </Button>
          </div>
        }
      >
        <Card className="cp-card" variant="outlined">
          <Form form={form} layout="vertical">
            <Form.Item name="name" label="优惠券名称" rules={[{ required: true, message: '请输入名称' }]}>
              <Input placeholder="请输入名称" />
            </Form.Item>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
                <Select>
                  <Select.Option value={0}>全场通用</Select.Option>
                  <Select.Option value={1}>指定分类</Select.Option>
                  <Select.Option value={2}>指定商品</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="amount" label="面值" rules={[{ required: true, message: '请输入面值' }]}>
                <InputNumber style={{ width: '100%' }} min={0.01} precision={2} prefix="¥" />
              </Form.Item>
              <Form.Item name="minPoint" label="使用门槛" rules={[{ required: true, message: '请输入门槛' }]}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="0为无门槛" prefix="¥" />
              </Form.Item>
              <Form.Item name="totalCount" label="发行总量" rules={[{ required: true, message: '请输入发行总量' }]}>
                <InputNumber style={{ width: '100%' }} min={1} precision={0} />
              </Form.Item>
              <Form.Item name="perLimit" label="每人限领" rules={[{ required: true, message: '请输入每人限领数量' }]}>
                <InputNumber style={{ width: '100%' }} min={1} precision={0} />
              </Form.Item>
            </div>
            <Form.Item name="timeRange" label="有效期" rules={[{ required: true, message: '请选择有效期' }]}>
              <RangePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="note" label="备注">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Form>
        </Card>
      </Drawer>
    </div>
  );
};

export default CouponList;
