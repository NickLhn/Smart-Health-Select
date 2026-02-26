import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Card, Drawer, Form, Input, Select, Space, Table, Tag, Typography, App } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useSearchParams } from 'react-router-dom';
import { getRefundList, auditRefund, RefundStatus, RefundType } from '../../../services/aftersales';
import type { RefundApply, RefundQuery } from '../../../services/aftersales';
import { ReloadOutlined, SafetyOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

const RefundList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RefundApply[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [status, setStatus] = useState<number | undefined>(
    searchParams.get('status') ? Number(searchParams.get('status')) : undefined
  );
  const [filters, setFilters] = useState<{ keyword?: string; type?: number }>({});
  const [filterForm] = Form.useForm();

  // Audit Modal State
  const [auditOpen, setAuditOpen] = useState(false);
  const [currentRefund, setCurrentRefund] = useState<RefundApply | null>(null);
  const [auditAction, setAuditAction] = useState<'approve' | 'reject'>('approve');
  const [auditReason, setAuditReason] = useState('');

  useEffect(() => {
    fetchRefunds();
  }, [pagination.current, pagination.pageSize, status, filters]);

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const query: RefundQuery & { keyword?: string } = {
        page: pagination.current,
        size: pagination.pageSize,
        status: status,
        ...(filters.type !== undefined ? { type: filters.type } : {}),
        ...(filters.keyword ? { keyword: filters.keyword } : {}),
      };
      const res = await getRefundList(query);
      if (res.code === 200) {
        setData(res.data.records);
        setPagination({
          ...pagination,
          total: res.data.total,
        });
        setLastUpdatedAt(Date.now());
      }
    } catch (error) {
      console.error(error);
      message.error('获取售后申请列表失败');
    } finally {
      setLoading(false);
    }
  }, [filters.keyword, filters.type, message, pagination, status]);

  const handleTableChange = (newPagination: any) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const showAuditModal = (record: RefundApply, action: 'approve' | 'reject') => {
    setCurrentRefund(record);
    setAuditAction(action);
    setAuditReason('');
    setAuditOpen(true);
  };

  const handleAuditSubmit = async () => {
    if (!currentRefund) return;
    
    if (auditAction === 'reject' && !auditReason) {
      message.warning('请填写拒绝原因');
      return;
    }

    try {
      const res = await auditRefund({
        id: currentRefund.id,
        pass: auditAction === 'approve',
        auditReason: auditReason,
      });

      if (res.code === 200) {
        message.success('审核操作成功');
        setAuditOpen(false);
        fetchRefunds();
      } else {
        message.error(res.message || '审核操作失败');
      }
    } catch (error) {
      console.error(error);
      message.error('审核操作失败');
    }
  };

  const columns: ColumnsType<RefundApply> = [
    {
      title: '申请',
      key: 'apply',
      width: 320,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} icon={<SafetyOutlined />} style={{ background: 'rgba(16, 185, 129, 1)' }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, color: 'rgba(15, 23, 42, 0.86)' }}>
              <Typography.Text ellipsis style={{ maxWidth: 240 }}>
                {record.username || (record.userId !== undefined && record.userId !== null ? `用户 #${record.userId}` : '-')}
              </Typography.Text>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.56)' }}>{record.createTime || '-'}</div>
          </div>
        </div>
      ),
    },
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (text) => (
        <Typography.Text copyable={{ text: text || '' }} style={{ color: 'rgba(15, 23, 42, 0.78)' }}>
          {text || '-'}
        </Typography.Text>
      ),
    },
    {
      title: '用户',
      key: 'user',
      width: 160,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar size={28} icon={<UserOutlined />} style={{ background: 'rgba(2, 6, 23, 0.10)', color: 'rgba(15, 23, 42, 0.72)' }} />
          <Typography.Text ellipsis style={{ maxWidth: 120, color: 'rgba(15, 23, 42, 0.78)' }}>
            {record.username || '-'}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => (
        <Tag color={type === RefundType.ONLY_REFUND ? 'geekblue' : 'purple'} style={{ borderRadius: 999, paddingInline: 10 }}>
          {type === RefundType.ONLY_REFUND ? '仅退款' : '退货退款'}
        </Tag>
      ),
    },
    {
      title: '退款金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount) => (
        <Typography.Text style={{ fontWeight: 900, color: 'rgba(15, 23, 42, 0.86)' }}>
          ¥{Number(amount || 0).toFixed(2)}
        </Typography.Text>
      ),
    },
    {
      title: '申请原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        switch (status) {
          case RefundStatus.PENDING:
            return (
              <Tag color="orange" style={{ borderRadius: 999, paddingInline: 10 }}>
                待审核
              </Tag>
            );
          case RefundStatus.APPROVED:
            return (
              <Tag color="green" style={{ borderRadius: 999, paddingInline: 10 }}>
                审核通过
              </Tag>
            );
          case RefundStatus.REJECTED:
            return (
              <Tag color="red" style={{ borderRadius: 999, paddingInline: 10 }}>
                审核拒绝
              </Tag>
            );
          default:
            return <Tag>未知</Tag>;
        }
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => (
        <Space size={8}>
          {record.status === RefundStatus.PENDING && (
            <>
              <Button
                type="primary"
                onClick={() => showAuditModal(record, 'approve')}
                style={{
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, rgba(16, 185, 129, 1), rgba(14, 165, 233, 1))',
                  border: 'none',
                  boxShadow: '0 18px 42px rgba(16, 185, 129, 0.18)',
                }}
              >
                通过
              </Button>
              <Button danger onClick={() => showAuditModal(record, 'reject')} style={{ borderRadius: 999 }}>
                拒绝
              </Button>
            </>
          )}
          {record.status !== RefundStatus.PENDING && (
             <span style={{ color: '#999' }}>已审核</span>
          )}
        </Space>
      ),
    },
  ];

  const pageStyles = `
    .rf-root { position: relative; padding: 8px 0; }
    .rf-hero {
      position: relative;
      overflow: hidden;
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background:
        radial-gradient(900px 380px at 10% 10%, rgba(16, 185, 129, 0.22), rgba(16, 185, 129, 0) 55%),
        radial-gradient(760px 360px at 78% 18%, rgba(249, 115, 22, 0.14), rgba(249, 115, 22, 0) 60%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.90) 0%, rgba(255, 255, 255, 0.82) 100%);
      box-shadow: 0 26px 80px rgba(2, 6, 23, 0.10);
      padding: 14px 14px 12px;
      margin-bottom: 14px;
    }
    .rf-hero::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.30;
      background-image: radial-gradient(rgba(15, 23, 42, 0.16) 1px, transparent 1px);
      background-size: 26px 26px;
      mask-image: radial-gradient(620px 460px at 65% 20%, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
    }
    .rf-top {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }
    .rf-title {
      margin: 0;
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.3px;
      color: rgba(15, 23, 42, 0.92);
    }
    .rf-sub {
      margin-top: 4px;
      font-size: 12px;
      color: rgba(15, 23, 42, 0.62);
    }
    .rf-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .rf-chip.ant-tag {
      border-radius: 999px;
      padding-inline: 10px;
      margin-inline-end: 0;
      background: rgba(2, 6, 23, 0.04);
      border-color: rgba(15, 23, 42, 0.10);
      color: rgba(15, 23, 42, 0.70);
      font-weight: 650;
    }
    .rf-actions .ant-btn {
      border-radius: 999px;
      height: 36px;
      padding: 0 14px;
      font-weight: 650;
      border-color: rgba(15, 23, 42, 0.12);
      color: rgba(15, 23, 42, 0.78);
      background: rgba(255,255,255,0.78);
    }
    .rf-card.ant-card {
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      box-shadow: 0 20px 60px rgba(2, 6, 23, 0.08);
      background: rgba(255,255,255,0.86);
      overflow: hidden;
    }
    .rf-card .ant-card-body { padding: 14px; }
    .rf-filters { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
    .rf-filters .ant-form-item { margin-bottom: 0; }
    .rf-table .ant-table-container {
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(15, 23, 42, 0.08);
    }
    .rf-table .ant-table-thead > tr > th {
      background: rgba(2, 6, 23, 0.02);
      color: rgba(15, 23, 42, 0.70);
      font-weight: 900;
    }
    .rf-table .ant-table-tbody > tr > td {
      border-bottom: 1px solid rgba(15, 23, 42, 0.06);
    }
  `;

  return (
    <div className="rf-root">
      <style>{pageStyles}</style>

      <div className="rf-hero" aria-label="售后处理概览">
        <div className="rf-top">
          <div>
            <h2 className="rf-title">售后处理</h2>
            <div className="rf-sub">支持状态/类型筛选，快捷审核通过或拒绝</div>
          </div>
          <div className="rf-actions">
            <Tag className="rf-chip">总计 {pagination.total}</Tag>
            <Tag className="rf-chip">
              {lastUpdatedAt ? `更新于 ${new Date(lastUpdatedAt).toLocaleTimeString()}` : '未刷新'}
            </Tag>
            <Button icon={<ReloadOutlined />} onClick={fetchRefunds} loading={loading}>
              刷新
            </Button>
          </div>
        </div>
      </div>

      <Card className="rf-card" variant="outlined">
        <Form
          form={filterForm}
          layout="vertical"
          onFinish={(values) => {
            const kw = (values?.keyword || '').trim();
            const t = values?.type;
            setFilters({ keyword: kw || undefined, type: t === 'all' || t === undefined ? undefined : Number(t) });
            setPagination((prev) => ({ ...prev, current: 1 }));
          }}
        >
          <div className="rf-filters">
            <Form.Item name="keyword" label="关键词">
              <Input allowClear prefix={<SearchOutlined />} placeholder="订单编号 / 用户名" style={{ width: 320 }} />
            </Form.Item>
            <Form.Item label="类型" name="type" initialValue="all">
              <Select style={{ width: 160 }}>
                <Option value="all">全部类型</Option>
                <Option value={RefundType.ONLY_REFUND}>仅退款</Option>
                <Option value={RefundType.RETURN_AND_REFUND}>退货退款</Option>
              </Select>
            </Form.Item>
            <Form.Item label="状态">
              <Select
                value={status === undefined ? 'all' : String(status)}
                style={{ width: 160 }}
                onChange={(val) => {
                  setStatus(val === 'all' ? undefined : Number(val));
                  setPagination((prev) => ({ ...prev, current: 1 }));
                }}
              >
                <Option value="all">全部状态</Option>
                <Option value="0">待审核</Option>
                <Option value="1">已通过</Option>
                <Option value="2">已拒绝</Option>
              </Select>
            </Form.Item>
            <Form.Item label=" ">
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, rgba(16, 185, 129, 1), rgba(14, 165, 233, 1))',
                    border: 'none',
                    boxShadow: '0 18px 42px rgba(16, 185, 129, 0.18)',
                  }}
                >
                  查询
                </Button>
                <Button
                  onClick={() => {
                    filterForm.resetFields();
                    setFilters({});
                    setStatus(undefined);
                    setPagination((prev) => ({ ...prev, current: 1 }));
                  }}
                  icon={<ReloadOutlined />}
                  style={{ borderRadius: 999 }}
                >
                  重置
                </Button>
              </Space>
            </Form.Item>
          </div>
        </Form>
      </Card>

      <Card className="rf-card rf-table" variant="outlined" style={{ marginTop: 14 }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            ...pagination,
            showTotal: (t) => `共 ${t} 条`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 1100 }}
        />
      </Card>

      <Drawer
        title={auditAction === 'approve' ? '审核通过' : '审核拒绝'}
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
              onClick={handleAuditSubmit}
              style={{
                borderRadius: 999,
                background: auditAction === 'approve'
                  ? 'linear-gradient(90deg, rgba(16, 185, 129, 1), rgba(14, 165, 233, 1))'
                  : 'linear-gradient(90deg, rgba(239, 68, 68, 1), rgba(244, 63, 94, 1))',
                border: 'none',
                boxShadow: auditAction === 'approve'
                  ? '0 18px 42px rgba(16, 185, 129, 0.18)'
                  : '0 18px 42px rgba(239, 68, 68, 0.18)',
              }}
            >
              确认提交
            </Button>
          </div>
        }
      >
        <Card className="rf-card" variant="outlined">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontWeight: 900, color: 'rgba(15, 23, 42, 0.82)' }}>
              {currentRefund ? `订单：${currentRefund.orderNo || '-'}` : '售后申请'}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, color: 'rgba(15, 23, 42, 0.62)' }}>
              <span>用户：{currentRefund?.username || (currentRefund?.userId !== undefined && currentRefund?.userId !== null ? `用户 #${currentRefund.userId}` : '-')}</span>
              <span>类型：{currentRefund?.type === RefundType.ONLY_REFUND ? '仅退款' : '退货退款'}</span>
              <span>金额：¥{Number(currentRefund?.amount || 0).toFixed(2)}</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.72)', fontWeight: 800 }}>审核备注 / 拒绝原因</div>
              <TextArea rows={4} value={auditReason} onChange={(e) => setAuditReason(e.target.value)} style={{ marginTop: 8, borderRadius: 12 }} />
            </div>
          </div>
        </Card>
      </Drawer>
    </div>
  );
};

export default RefundList;
