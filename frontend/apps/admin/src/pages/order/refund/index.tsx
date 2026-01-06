import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Card, Modal, Input, Select, App } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useSearchParams } from 'react-router-dom';
import { getRefundList, auditRefund, RefundStatus, RefundType } from '../../../services/aftersales';
import type { RefundApply, RefundQuery } from '../../../services/aftersales';

const { TextArea } = Input;
const { Option } = Select;

const RefundList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RefundApply[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [status, setStatus] = useState<number | undefined>(
    searchParams.get('status') ? Number(searchParams.get('status')) : undefined
  );

  // Audit Modal State
  const [auditModalVisible, setAuditModalVisible] = useState(false);
  const [currentRefund, setCurrentRefund] = useState<RefundApply | null>(null);
  const [auditAction, setAuditAction] = useState<'approve' | 'reject'>('approve');
  const [auditReason, setAuditReason] = useState('');

  useEffect(() => {
    fetchRefunds();
  }, [pagination.current, pagination.pageSize, status]);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const res = await getRefundList({
        page: pagination.current,
        size: pagination.pageSize,
        status: status,
      });
      if (res.code === 200) {
        setData(res.data.records);
        setPagination({
          ...pagination,
          total: res.data.total,
        });
      }
    } catch (error) {
      console.error(error);
      message.error('获取售后申请列表失败');
    } finally {
      setLoading(false);
    }
  };

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
    setAuditModalVisible(true);
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
        setAuditModalVisible(false);
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
      title: '申请ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (text) => text || '-',
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      render: (text) => text || '-',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (type === RefundType.ONLY_REFUND ? '仅退款' : '退货退款'),
    },
    {
      title: '退款金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `¥${Number(amount).toFixed(2)}`,
    },
    {
      title: '申请原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: '申请时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        switch (status) {
          case RefundStatus.PENDING:
            return <Tag color="orange">待审核</Tag>;
          case RefundStatus.APPROVED:
            return <Tag color="green">审核通过</Tag>;
          case RefundStatus.REJECTED:
            return <Tag color="red">审核拒绝</Tag>;
          default:
            return <Tag>未知</Tag>;
        }
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          {record.status === RefundStatus.PENDING && (
            <>
              <Button type="link" onClick={() => showAuditModal(record, 'approve')}>通过</Button>
              <Button type="link" danger onClick={() => showAuditModal(record, 'reject')}>拒绝</Button>
            </>
          )}
          {record.status !== RefundStatus.PENDING && (
             <span style={{ color: '#999' }}>已审核</span>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap gap-4 items-center">
          <span className="font-medium">状态筛选：</span>
          <Select 
            value={status === undefined ? 'all' : String(status)} 
            style={{ width: 120 }}
            onChange={(val) => {
                setStatus(val === 'all' ? undefined : Number(val));
                setPagination({ ...pagination, current: 1 });
            }}
          >
            <Option value="all">全部状态</Option>
            <Option value="0">待审核</Option>
            <Option value="1">已通过</Option>
            <Option value="2">已拒绝</Option>
          </Select>
          <Button type="primary" onClick={fetchRefunds}>查询</Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />

      <Modal
        title={auditAction === 'approve' ? '审核通过' : '审核拒绝'}
        open={auditModalVisible}
        onOk={handleAuditSubmit}
        onCancel={() => setAuditModalVisible(false)}
      >
        <p>确认{auditAction === 'approve' ? '通过' : '拒绝'}该售后申请吗？</p>
        <div style={{ marginTop: 16 }}>
          <span>审核备注/拒绝原因:</span>
          <TextArea
            rows={4}
            value={auditReason}
            onChange={(e) => setAuditReason(e.target.value)}
            style={{ marginTop: 8 }}
          />
        </div>
      </Modal>
      </Card>
    </div>
  );
};

export default RefundList;
