import React, { useState, useEffect } from 'react';
import { App, Table, Tag, Space, Button, Card, Input, DatePicker, Select, Modal, Descriptions, Image, Radio } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, EyeOutlined, SendOutlined, AuditOutlined, PayCircleOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { getSellerOrderList, shipOrder, auditOrder, processRefund } from '../../../services/order';
import type { Order } from '../../../services/order';

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

  // Audit State
  const [auditVisible, setAuditVisible] = useState(false);
  const [auditStatus, setAuditStatus] = useState<number>(2); // 2通过 3拒绝
  const [auditReason, setAuditReason] = useState('');

  // Refund State
  const [refundVisible, setRefundVisible] = useState(false);
  const [refundStatus, setRefundStatus] = useState<number>(5); // 5已退款
  const [refundRemark, setRefundRemark] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [pagination.current, pagination.pageSize, status]);

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
      message.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
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
    setAuditStatus(1); // Default to pass (1=Pass in backend param for auditWithId, 2=Pass in Order entity? Wait. Controller uses 1=Pass)
    // Controller: boolean pass = status != null && status == 1;
    // So 1 is pass.
    setAuditReason('');
    setAuditVisible(true);
  };

  const handleAuditSubmit = async () => {
    if (!currentOrder) return;
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
    }
  };

  const handleRefundClick = (record: Order) => {
    setCurrentOrder(record);
    setRefundStatus(1); // Controller: 1=Agree
    setRefundRemark('');
    setRefundVisible(true);
  };

  const handleRefundSubmit = async () => {
    if (!currentOrder) return;
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
           {record.medicineImage && <img src={record.medicineImage} alt="" className="w-8 h-8 object-cover rounded" />}
           <div>
               <div className="text-sm">{record.medicineName}</div>
               <div className="text-xs text-gray-500">x {record.quantity}</div>
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
        // 0待支付 1待发货 2待收货 3已完成 4已取消
        switch (status) {
          case 0: color = 'default'; text = '待支付'; break;
          case 1: color = 'orange'; text = '待发货'; break;
          case 2: color = 'blue'; text = '已发货'; break;
          case 8: color = 'purple'; text = '待揽收'; break;
          case 3: color = 'green'; text = '已完成'; break;
          case 4: color = 'red'; text = '已取消'; break;
          case 5: color = 'default'; text = '已退款'; break;
          case 7: color = 'orange'; text = '待审核'; break;
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

  return (
    <div className="space-y-4">
      <Card variant="outlined">
        <div className="flex flex-wrap gap-4 items-center">
          <Input placeholder="订单编号/客户姓名" prefix={<SearchOutlined />} style={{ width: 200 }} />
          <RangePicker />
          <Select 
            value={status === undefined ? 'all' : String(status)} 
            style={{ width: 120 }}
            onChange={handleStatusChange}
          >
            <Option value="all">全部状态</Option>
            <Option value="1">待发货</Option>
            <Option value="2">配送中</Option>
            <Option value="3">已完成</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={() => fetchOrders()}>查询</Button>
        </div>
      </Card>
      
      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="id" 
        loading={loading}
        pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`
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
                <Descriptions.Item label="药品" span={2}>
                    <div className="flex items-center gap-2">
                        {currentOrder.medicineImage && <img src={currentOrder.medicineImage} alt="" className="w-12 h-12 object-cover" />}
                        <span>{currentOrder.medicineName} x {currentOrder.quantity}</span>
                    </div>
                </Descriptions.Item>
                <Descriptions.Item label="支付金额">¥{currentOrder.payAmount}</Descriptions.Item>
                <Descriptions.Item label="创建时间">{currentOrder.createTime}</Descriptions.Item>
                {currentOrder.refundReason && <Descriptions.Item label="退款原因" span={2}>{currentOrder.refundReason}</Descriptions.Item>}
                {currentOrder.prescriptionImage && (
                    <Descriptions.Item label="处方" span={2}>
                        <Image src={currentOrder.prescriptionImage} width={100} />
                    </Descriptions.Item>
                )}
            </Descriptions>
        )}
      </Modal>

      <Modal
        title="处方审核"
        open={auditVisible}
        onOk={handleAuditSubmit}
        onCancel={() => setAuditVisible(false)}
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
        title="退款处理"
        open={refundVisible}
        onOk={handleRefundSubmit}
        onCancel={() => setRefundVisible(false)}
      >
        <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded">
                <div>退款原因：{currentOrder?.refundReason}</div>
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

