import React, { useState, useEffect } from 'react';
import { App, Table, Tag, Space, Button, Card, Input, DatePicker, Select, Modal, Descriptions, Image, Radio } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, EyeOutlined, SendOutlined, AuditOutlined, PayCircleOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { getSellerOrderList, shipOrder, auditOrder, processRefund } from '../../../services/order';
import type { Order } from '../../../services/order';
import { type Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const OrderList: React.FC = () => {
  const { message, modal } = App.useApp();
  const location = useLocation();
  const isPendingPage = location.pathname.includes('pending');
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [status, setStatus] = useState<number | undefined>(isPendingPage ? 1 : undefined);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order>();

  const [draftOrderNo, setDraftOrderNo] = useState('');
  const [draftReceiverName, setDraftReceiverName] = useState('');
  const [draftRange, setDraftRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [filters, setFilters] = useState<{
    orderNo?: string;
    receiverName?: string;
    startTime?: string;
    endTime?: string;
  }>({});

  // Audit State
  const [auditVisible, setAuditVisible] = useState(false);
  const [auditStatus, setAuditStatus] = useState<number>(1);
  const [auditReason, setAuditReason] = useState('');
  const [auditSubmitting, setAuditSubmitting] = useState(false);

  // Refund State
  const [refundVisible, setRefundVisible] = useState(false);
  const [refundStatus, setRefundStatus] = useState<number>(1);
  const [refundRemark, setRefundRemark] = useState('');
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [pagination.current, pagination.pageSize, status, filters]);

  useEffect(() => {
    if (isPendingPage) {
        setStatus(1);
    }
  }, [isPendingPage]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getSellerOrderList({
        page: pagination.current,
        size: pagination.pageSize,
        status: status,
        orderNo: filters.orderNo,
        receiverName: filters.receiverName,
        startTime: filters.startTime,
        endTime: filters.endTime,
      });
      if (res.code === 200) {
        setData(res.data.records);
        setPagination((prev) => ({ ...prev, total: res.data.total }));
      }
    } catch (error) {
      console.error(error);
      message.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const startTime = draftRange?.[0] ? draftRange[0].format('YYYY-MM-DD HH:mm:ss') : undefined;
    const endTime = draftRange?.[1] ? draftRange[1].format('YYYY-MM-DD HH:mm:ss') : undefined;
    setFilters({
      orderNo: draftOrderNo.trim() || undefined,
      receiverName: draftReceiverName.trim() || undefined,
      startTime,
      endTime,
    });
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const resetFilters = () => {
    setDraftOrderNo('');
    setDraftReceiverName('');
    setDraftRange(null);
    setFilters({});
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleShip = (record: Order) => {
    modal.confirm({
      title: '确认发货',
      content: `确定要为订单 ${record.orderNo} 发货吗？发货后将通知骑手接单。`,
      onOk: async () => {
        try {
          const res = await shipOrder(record.id);
          if (res.code === 200) {
            message.success('发货成功，已通知骑手');
            fetchOrders(); // 刷新列表
          } else {
            message.error(res.message || '发货失败');
          }
        } catch (error) {
            message.error('操作失败');
        }
      }
    });
  };

  const showDetail = (record: Order) => {
      setCurrentOrder(record);
      setDetailVisible(true);
  };

  const handleAuditClick = (record: Order) => {
    setCurrentOrder(record);
    setAuditStatus(1);
    setAuditReason('');
    setAuditVisible(true);
  };

  const handleAuditSubmit = async () => {
    if (!currentOrder) return;
    if (auditStatus === 2 && !auditReason.trim()) {
      message.warning('请填写拒绝原因');
      return;
    }
    setAuditSubmitting(true);
    try {
        const res = await auditOrder(currentOrder.id, auditStatus, auditReason);
        if (res.code === 200) {
            message.success('审核完成');
            setAuditVisible(false);
            fetchOrders();
        } else {
            message.error(res.message || '审核失败');
        }
    } catch (error) {
        message.error('操作失败');
    } finally {
        setAuditSubmitting(false);
    }
  };

  const handleRefundClick = (record: Order) => {
    setCurrentOrder(record);
    setRefundStatus(1);
    setRefundRemark('');
    setRefundVisible(true);
  };

  const handleRefundSubmit = async () => {
    if (!currentOrder) return;
    if (refundStatus === 2 && !refundRemark.trim()) {
      message.warning('请填写拒绝原因');
      return;
    }
    setRefundSubmitting(true);
    try {
        const res = await processRefund(currentOrder.id, refundStatus, refundRemark);
        if (res.code === 200) {
            message.success('处理完成');
            setRefundVisible(false);
            fetchOrders();
        } else {
            message.error(res.message || '处理失败');
        }
    } catch (error) {
        message.error('操作失败');
    } finally {
        setRefundSubmitting(false);
    }
  };

  const columns: ColumnsType<Order> = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (text) => <a>{text}</a>,
    },
    {
      title: '收货人',
      dataIndex: 'receiverName',
      key: 'receiverName',
    },
    {
      title: '商品详情',
      key: 'medicineName',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          {(record.medicineImage || record.items?.[0]?.medicineImage) && (
            <img
              src={record.medicineImage || record.items?.[0]?.medicineImage}
              alt=""
              className="w-8 h-8 object-cover rounded"
            />
          )}
          <div>
            <div className="text-sm">
              {record.medicineName || record.items?.[0]?.medicineName || '-'}
              {record.items?.length > 1 ? ` 等${record.items.length}件` : ''}
            </div>
            <div className="text-xs text-gray-500">
              x {record.quantity ?? record.items?.[0]?.count ?? '-'}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '金额',
      dataIndex: 'payAmount',
      key: 'payAmount',
      render: (amount) => `¥${Number(amount).toFixed(2)}`,
    },
    {
      title: '收货地址',
      dataIndex: 'receiverAddress',
      key: 'receiverAddress',
      ellipsis: true,
    },
    {
      title: '状态',
      key: 'status',
      dataIndex: 'status',
      render: (status) => {
        let color = 'default';
        let text = '未知';
        switch (status) {
          case 0: color = 'default'; text = '待支付'; break;
          case 1: color = 'orange'; text = '待发货'; break;
          case 2: color = 'blue'; text = '已发货'; break;
          case 8: color = 'purple'; text = '待揽收'; break;
          case 3: color = 'green'; text = '已完成'; break;
          case 4: color = 'red'; text = '售后中'; break;
          case 5: color = 'default'; text = '已退款'; break;
          case 7: color = 'orange'; text = '待审核'; break;
          case 6:
          case -1:
            color = 'default';
            text = '已取消';
            break;
        }
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showDetail(record)}>详情</Button>
          {record.status === 1 && (
            <Button 
              type="primary" 
              size="small" 
              icon={<SendOutlined />}
              onClick={() => handleShip(record)}
            >
              发货
            </Button>
          )}
          {record.status === 7 && (
            <Button 
              type="primary" 
              size="small" 
              icon={<AuditOutlined />}
              onClick={() => handleAuditClick(record)}
            >
              审核
            </Button>
          )}
          {record.status === 4 && (
            <Button 
              type="default" 
              size="small" 
              danger
              icon={<PayCircleOutlined />}
              onClick={() => handleRefundClick(record)}
            >
              退款
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleTableChange = (pag: any) => {
    setPagination((prev) => ({ ...prev, current: pag.current, pageSize: pag.pageSize }));
  };

  const handleStatusChange = (value: string) => {
    if (value === 'all') {
        setStatus(undefined);
    } else {
        setStatus(Number(value));
    }
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  return (
    <div className="space-y-4">
      <Card
        variant="outlined"
        bodyStyle={{
          padding: 16,
        }}
      >
        <div
          style={{
            marginBottom: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 16,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 600,
                color: '#022c22',
              }}
            >
              {isPendingPage ? '待处理订单' : '订单列表'}
            </h2>
            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                color: '#6B7280',
              }}
            >
              {isPendingPage ? '查看并处理待发货、待审核的订单' : '查看并管理店铺订单，支持筛选和处理售后'}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <Input
            placeholder="订单编号"
            prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
            style={{ width: 200 }}
            value={draftOrderNo}
            onChange={(e) => setDraftOrderNo(e.target.value)}
            allowClear
            size="middle"
          />
          <Input
            placeholder="收货人姓名"
            style={{ width: 160 }}
            value={draftReceiverName}
            onChange={(e) => setDraftReceiverName(e.target.value)}
            allowClear
            size="middle"
          />
          <RangePicker
            value={draftRange?.[0] && draftRange?.[1] ? [draftRange[0], draftRange[1]] : null}
            onChange={(dates) => setDraftRange(dates ? [dates[0], dates[1]] : null)}
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            allowClear
            style={{ minWidth: 260 }}
            size="middle"
          />
          <Select
            value={status === undefined ? 'all' : String(status)}
            style={{ width: 140 }}
            onChange={handleStatusChange}
            size="middle"
          >
            <Option value="all">全部状态</Option>
            <Option value="7">待审核</Option>
            <Option value="1">待发货</Option>
            <Option value="2">配送中</Option>
            <Option value="3">已完成</Option>
            <Option value="4">售后中</Option>
            <Option value="5">已退款</Option>
            <Option value="6">已取消</Option>
            <Option value="-1">已取消</Option>
          </Select>
          <Space size="middle">
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={applyFilters}
              size="middle"
              style={{
                borderRadius: 999,
                paddingInline: 18,
                background: 'linear-gradient(90deg, #059669, #10B981)',
                border: 'none',
              }}
            >
              查询
            </Button>
            <Button
              onClick={resetFilters}
              size="middle"
              style={{
                borderRadius: 999,
                borderColor: '#D1D5DB',
                color: '#374151',
              }}
            >
              重置
            </Button>
          </Space>
        </div>
      </Card>
      
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        size="middle"
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
      />

      <Modal
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {currentOrder && (
            <Descriptions bordered column={2}>
                <Descriptions.Item label="订单编号">{currentOrder.orderNo}</Descriptions.Item>
                <Descriptions.Item label="状态">
                    {currentOrder.status === 0 ? '待支付' :
                     currentOrder.status === 1 ? '待发货' :
                     currentOrder.status === 2 ? '已发货' :
                     currentOrder.status === 8 ? '待揽收' :
                     currentOrder.status === 3 ? '已完成' :
                     currentOrder.status === 4 ? '售后中' :
                     currentOrder.status === 5 ? '已退款' :
                     currentOrder.status === 7 ? '待审核' : '已取消'}
                </Descriptions.Item>
                <Descriptions.Item label="收货人">{currentOrder.receiverName}</Descriptions.Item>
                <Descriptions.Item label="电话">{currentOrder.receiverPhone}</Descriptions.Item>
                <Descriptions.Item label="地址" span={2}>{currentOrder.receiverAddress}</Descriptions.Item>
                <Descriptions.Item label="商品" span={2}>
                  <div className="space-y-2">
                    {(currentOrder.items?.length
                      ? currentOrder.items
                      : (currentOrder.medicineName
                          ? [
                              {
                                id: 0,
                                orderId: currentOrder.id,
                                medicineId: currentOrder.medicineId ?? 0,
                                medicineName: currentOrder.medicineName,
                                medicineImage: currentOrder.medicineImage ?? '',
                                medicinePrice: currentOrder.price ?? 0,
                                count: currentOrder.quantity ?? 1,
                              },
                            ]
                          : [])
                    ).map((item) => (
                      <div key={`${item.orderId}-${item.medicineId}-${item.id}`} className="flex items-center gap-2">
                        {item.medicineImage ? (
                          <Image src={item.medicineImage} width={48} height={48} style={{ objectFit: 'cover' }} />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded" />
                        )}
                        <div className="flex-1">
                          <div className="text-sm">{item.medicineName}</div>
                          <div className="text-xs text-gray-500">
                            x {item.count} · ¥{Number(item.medicinePrice).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="支付金额">¥{currentOrder.payAmount}</Descriptions.Item>
                <Descriptions.Item label="创建时间">{currentOrder.createTime}</Descriptions.Item>
                {currentOrder.refundReason && <Descriptions.Item label="退款原因" span={2}>{currentOrder.refundReason}</Descriptions.Item>}
                {currentOrder.refundRemark && <Descriptions.Item label="退款备注" span={2}>{currentOrder.refundRemark}</Descriptions.Item>}
                {currentOrder.auditReason && <Descriptions.Item label="审核拒绝原因" span={2}>{currentOrder.auditReason}</Descriptions.Item>}
                {currentOrder.prescriptionImage && (
                    <Descriptions.Item label="处方" span={2}>
                        <Image src={currentOrder.prescriptionImage} width={100} />
                    </Descriptions.Item>
                )}
            </Descriptions>
        )}
      </Modal>

      <Modal
        title={`处方审核${currentOrder?.orderNo ? `（${currentOrder.orderNo}）` : ''}`}
        open={auditVisible}
        onOk={handleAuditSubmit}
        onCancel={() => setAuditVisible(false)}
        okButtonProps={{ loading: auditSubmitting }}
        cancelButtonProps={{ disabled: auditSubmitting }}
      >
        <div className="space-y-4">
            {currentOrder?.prescriptionImage && (
                <div>
                    <div className="mb-2">处方图片：</div>
                    <Image src={currentOrder.prescriptionImage} width={200} />
                </div>
            )}
            <div>
                <div className="mb-2">审核结果：</div>
                <Radio.Group value={auditStatus} onChange={e => setAuditStatus(e.target.value)}>
                    <Radio value={1}>通过</Radio>
                    <Radio value={2}>拒绝</Radio>
                </Radio.Group>
            </div>
            {auditStatus === 2 && (
                <div>
                    <div className="mb-2">拒绝原因：</div>
                    <Input.TextArea 
                        rows={3} 
                        value={auditReason} 
                        onChange={e => setAuditReason(e.target.value)}
                        placeholder="请输入拒绝原因" 
                    />
                </div>
            )}
        </div>
      </Modal>

      <Modal
        title={`退款处理${currentOrder?.orderNo ? `（${currentOrder.orderNo}）` : ''}`}
        open={refundVisible}
        onOk={handleRefundSubmit}
        onCancel={() => setRefundVisible(false)}
        okButtonProps={{ loading: refundSubmitting }}
        cancelButtonProps={{ disabled: refundSubmitting }}
      >
        <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded">
                <div>退款原因：{currentOrder?.refundReason || <span className="text-gray-400">暂无</span>}</div>
                <div>退款金额：¥{currentOrder?.payAmount}</div>
            </div>
            <div>
                <div className="mb-2">处理结果：</div>
                <Radio.Group value={refundStatus} onChange={e => setRefundStatus(e.target.value)}>
                    <Radio value={1}>同意退款</Radio>
                    <Radio value={2}>拒绝退款</Radio>
                </Radio.Group>
            </div>
            {refundStatus === 2 && (
                <div>
                    <div className="mb-2">拒绝原因：</div>
                    <Input.TextArea 
                        rows={3} 
                        value={refundRemark} 
                        onChange={e => setRefundRemark(e.target.value)}
                        placeholder="请输入拒绝原因" 
                    />
                </div>
            )}
        </div>
      </Modal>
    </div>
  );
};

export default OrderList;
