import React, { useCallback, useEffect, useState } from 'react';
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

  const { current, pageSize } = pagination;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      // 商家订单页把分页、状态和时间区间统一交给后端处理。
      const res = await getSellerOrderList({
        page: current,
        size: pageSize,
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
  }, [current, filters.endTime, filters.orderNo, filters.receiverName, filters.startTime, message, pageSize, status]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (isPendingPage) {
        setStatus(1);
    }
  }, [isPendingPage]);

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
            // 发货后刷新列表，让订单从待发货流转到下一状态。
            fetchOrders();
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
    // 打开审核弹窗前先清空上一次的审核结果和意见。
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
    // 退款处理弹窗同样每次重置默认值。
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
      title: '订单',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 270,
      render: (text, record) => (
        <div style={{ minWidth: 0 }}>
          <Button
            type="link"
            size="small"
            className="px-0"
            onClick={() => showDetail(record)}
            aria-label={`查看订单 ${text} 详情`}
            style={{ padding: 0, height: 'auto', fontWeight: 850, color: 'rgba(15, 23, 42, 0.92)' }}
          >
            {text}
          </Button>
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.62)' }}>
              {record.receiverName || '-'}
              {record.receiverPhone ? ` · ${record.receiverPhone}` : ''}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.50)' }}>{record.createTime || '-'}</div>
          </div>
        </div>
      ),
    },
    {
      title: '商品',
      key: 'medicineName',
      width: 280,
      render: (_, record) => {
        const medicineName = record.medicineName || record.items?.[0]?.medicineName || '';
        return (
          <div className="flex items-center gap-2">
            {(record.medicineImage || record.items?.[0]?.medicineImage) && (
              <img
                src={record.medicineImage || record.items?.[0]?.medicineImage}
                alt={medicineName ? `${medicineName} 缩略图` : '商品缩略图'}
                className="w-10 h-10 object-cover rounded"
              />
            )}
          <div>
            <div className="text-sm" style={{ fontWeight: 650, color: 'rgba(15, 23, 42, 0.90)' }}>
              {medicineName || '-'}
              {record.items?.length > 1 ? ` 等${record.items.length}件` : ''}
            </div>
            <div className="text-xs text-gray-500">
              x {record.quantity ?? record.items?.[0]?.count ?? '-'}
            </div>
          </div>
          </div>
        );
      },
    },
    {
      title: '金额',
      dataIndex: 'payAmount',
      key: 'payAmount',
      width: 140,
      render: (amount) => (
        <div>
          <div style={{ fontWeight: 850, color: 'rgba(15, 23, 42, 0.92)' }}>¥{Number(amount).toFixed(2)}</div>
        </div>
      ),
    },
    {
      title: '收货地址',
      dataIndex: 'receiverAddress',
      key: 'receiverAddress',
      width: 280,
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
          case 1: color = '#F97316'; text = '待发货'; break;
          case 2: color = '#2563EB'; text = '已发货'; break;
          case 8: color = '#7C3AED'; text = '待揽收'; break;
          case 3: color = '#16A34A'; text = '已完成'; break;
          case 4: color = '#DC2626'; text = '售后中'; break;
          case 5: color = 'default'; text = '已退款'; break;
          case 7: color = '#F59E0B'; text = '待审核'; break;
          case 6:
          case -1:
            color = 'default';
            text = '已取消';
            break;
        }
        return (
          <Tag
            color={color}
            style={{
              borderRadius: 999,
              paddingInline: 10,
              paddingBlock: 2,
              fontWeight: 650,
              borderColor: 'transparent',
            }}
          >
            {text}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size={10}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showDetail(record)} className="px-0">
            详情
          </Button>
          {record.status === 1 && (
            <Button 
              type="primary" 
              size="small" 
              className="ol-actPrimary"
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
              className="ol-actPrimary"
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

  const pageStyles = `
    .ol-root {
      position: relative;
    }
    .ol-hero {
      position: relative;
      overflow: hidden;
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background:
        radial-gradient(900px 380px at 10% 10%, rgba(16, 185, 129, 0.22), rgba(16, 185, 129, 0) 55%),
        radial-gradient(760px 360px at 75% 18%, rgba(34, 211, 238, 0.16), rgba(34, 211, 238, 0) 60%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0.78) 100%);
      box-shadow: 0 26px 80px rgba(2, 6, 23, 0.10);
      padding: 14px 14px 12px;
    }
    .ol-hero::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.34;
      background-image: radial-gradient(rgba(15, 23, 42, 0.16) 1px, transparent 1px);
      background-size: 26px 26px;
      mask-image: radial-gradient(620px 460px at 65% 20%, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
    }
    .ol-top {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }
    .ol-title {
      margin: 0;
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.3px;
      color: rgba(15, 23, 42, 0.92);
    }
    .ol-sub {
      margin-top: 4px;
      font-size: 12px;
      color: rgba(15, 23, 42, 0.62);
    }
    .ol-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .ol-actions .ant-btn {
      border-radius: 999px;
      height: 36px;
      padding: 0 14px;
      font-weight: 650;
      border-color: rgba(15, 23, 42, 0.12);
      color: rgba(15, 23, 42, 0.78);
      background: rgba(255,255,255,0.78);
    }
    .ol-primary.ant-btn {
      border: none;
      color: white;
      background: linear-gradient(90deg, rgba(5, 150, 105, 1), rgba(16, 185, 129, 1));
      box-shadow: 0 18px 42px rgba(5, 150, 105, 0.24);
    }
    .ol-primary.ant-btn:hover { filter: brightness(1.02); }
    .ol-actPrimary.ant-btn {
      border: none;
      border-radius: 999px;
      background: linear-gradient(90deg, rgba(5, 150, 105, 1), rgba(16, 185, 129, 1));
      box-shadow: 0 14px 30px rgba(16, 185, 129, 0.16);
    }
    .ol-actPrimary.ant-btn:hover { filter: brightness(1.02); }

    .ol-filters {
      position: relative;
      z-index: 1;
      margin-top: 12px;
      padding: 12px;
      border-radius: 16px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background: rgba(255, 255, 255, 0.78);
      box-shadow: 0 10px 26px rgba(2, 6, 23, 0.08);
    }
    .ol-filterRow {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
    }
    .ol-filterLeft, .ol-filterRight {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }
    .ol-statusPills.ant-radio-group {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .ol-statusPills .ant-radio-button-wrapper {
      border-radius: 999px !important;
      border: 1px solid rgba(15, 23, 42, 0.10) !important;
      background: rgba(255,255,255,0.86) !important;
      color: rgba(15, 23, 42, 0.72) !important;
      height: 32px;
      line-height: 30px;
      padding-inline: 12px;
      font-weight: 650;
      box-shadow: 0 10px 22px rgba(2, 6, 23, 0.06);
    }
    .ol-statusPills .ant-radio-button-wrapper::before { display: none; }
    .ol-statusPills .ant-radio-button-wrapper-checked {
      border-color: rgba(5, 150, 105, 0.30) !important;
      color: rgba(5, 150, 105, 1) !important;
      background: rgba(16, 185, 129, 0.12) !important;
      box-shadow: 0 14px 30px rgba(16, 185, 129, 0.14);
    }

    .ol-tableCard.ant-card {
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      box-shadow: 0 20px 60px rgba(2, 6, 23, 0.08);
      overflow: hidden;
      background: rgba(255,255,255,0.86);
    }
    .ol-tableCard .ant-card-body { padding: 0; }
    .ol-tableCard .ant-table { background: transparent; }
    .ol-tableCard .ant-table-thead > tr > th {
      background: rgba(2, 6, 23, 0.02);
      font-weight: 750;
      color: rgba(15, 23, 42, 0.78);
      border-bottom: 1px solid rgba(15, 23, 42, 0.08);
    }
    .ol-rowMuted td { opacity: 0.70; }

    @media (max-width: 768px) {
      .ol-actions { width: 100%; justify-content: flex-end; }
      .ol-filters { padding: 10px; }
    }
  `;

  const statusQuickOptions: Array<{ value: string; label: string }> = [
    { value: 'all', label: '全部' },
    { value: '1', label: '待发货' },
    { value: '7', label: '待审核' },
    { value: '2', label: '配送中' },
    { value: '8', label: '待揽收' },
    { value: '3', label: '已完成' },
    { value: '4', label: '售后' },
    { value: '5', label: '已退款' },
    { value: '0', label: '待支付' },
    { value: '6', label: '已取消' },
  ];

  return (
    <div className="ol-root space-y-4">
      <style>{pageStyles}</style>

      <div className="ol-hero" aria-label="订单列表概览">
        <div className="ol-top">
          <div>
            <h2 className="ol-title">{isPendingPage ? '待发货' : '全部订单'}</h2>
            <div className="ol-sub">{isPendingPage ? '聚焦待发货订单：快速查看、发货、追踪处理进度' : '覆盖订单全生命周期：筛选、查看、处理售后与审核'}</div>
          </div>
          <div className="ol-actions" aria-label="页面操作">
            <Button onClick={fetchOrders} loading={loading}>
              刷新
            </Button>
            <Button className="ol-primary" type="primary" icon={<SearchOutlined />} onClick={applyFilters} loading={loading}>
              查询
            </Button>
          </div>
        </div>

        <div className="ol-filters" aria-label="筛选区">
          {!isPendingPage && (
            <div style={{ marginBottom: 10 }}>
              <Radio.Group
                className="ol-statusPills"
                optionType="button"
                value={status === undefined ? 'all' : String(status)}
                onChange={(e) => handleStatusChange(String(e.target.value))}
              >
                {statusQuickOptions.map((opt) => (
                  <Radio.Button key={opt.value} value={opt.value}>
                    {opt.label}
                  </Radio.Button>
                ))}
              </Radio.Group>
            </div>
          )}

          <div className="ol-filterRow">
            <div className="ol-filterLeft">
              <Input
                placeholder="订单编号"
                prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
                style={{ width: 220 }}
                value={draftOrderNo}
                onChange={(e) => setDraftOrderNo(e.target.value)}
                onPressEnter={applyFilters}
                allowClear
                size="middle"
              />
              <Input
                placeholder="收货人姓名"
                style={{ width: 180 }}
                value={draftReceiverName}
                onChange={(e) => setDraftReceiverName(e.target.value)}
                onPressEnter={applyFilters}
                allowClear
                size="middle"
              />
              <RangePicker
                value={draftRange?.[0] && draftRange?.[1] ? [draftRange[0], draftRange[1]] : null}
                onChange={(dates) => setDraftRange(dates ? [dates[0], dates[1]] : null)}
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                allowClear
                style={{ minWidth: 280 }}
                size="middle"
              />
              {!isPendingPage && (
                <Select value={status === undefined ? 'all' : String(status)} style={{ width: 140 }} onChange={handleStatusChange} size="middle">
                  <Option value="all">全部状态</Option>
                  <Option value="1">待发货</Option>
                  <Option value="7">待审核</Option>
                  <Option value="2">配送中</Option>
                  <Option value="8">待揽收</Option>
                  <Option value="3">已完成</Option>
                  <Option value="4">售后中</Option>
                  <Option value="5">已退款</Option>
                  <Option value="0">待支付</Option>
                  <Option value="6">已取消</Option>
                  <Option value="-1">已取消</Option>
                </Select>
              )}
            </div>

            <div className="ol-filterRight">
              <Button onClick={resetFilters}>重置</Button>
            </div>
          </div>
        </div>
      </div>

      <Card className="ol-tableCard" variant="outlined">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          size="middle"
          rowClassName={(record) => (record.status === 6 || record.status === -1 ? 'ol-rowMuted' : '')}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 980 }}
        />
      </Card>

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
