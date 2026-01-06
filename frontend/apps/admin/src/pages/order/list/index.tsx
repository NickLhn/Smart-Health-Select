import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Card, Input, DatePicker, Select, message, Modal, Descriptions, Image, Form, Radio } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { getAdminOrderList, auditOrder } from '../../../services/order';
import type { Order } from '../../../services/order';

const { RangePicker } = DatePicker;
const { Option } = Select;

const OrderList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [status, setStatus] = useState<number | undefined>(
    searchParams.get('status') ? Number(searchParams.get('status')) : undefined
  );
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order>();

  // Audit State
  const [auditModalVisible, setAuditModalVisible] = useState(false);
  const [auditForm] = Form.useForm();
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditTarget, setAuditTarget] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [pagination.current, pagination.pageSize, status]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getAdminOrderList({
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

  const showDetail = (record: Order) => {
      setCurrentOrder(record);
      setDetailVisible(true);
  };

  const columns: ColumnsType<Order> = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (text) => <a>{text}</a>,
    },
    {
      title: '买家ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 80,
    },
    {
      title: '收货人',
      dataIndex: 'receiverName',
      key: 'receiverName',
      width: 100,
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
      width: 100,
    },
    {
      title: '状态',
      key: 'status',
      dataIndex: 'status',
      width: 100,
      render: (status) => {
        let color = 'default';
        let text = '未知';
        // 0待支付 1待发货 2待收货 3已完成 4售后中 5已退款 6已取消 7待审核
        switch (status) {
          case 0: color = 'default'; text = '待支付'; break;
          case 1: color = 'orange'; text = '待发货'; break;
          case 2: color = 'blue'; text = '配送中'; break;
          case 3: color = 'green'; text = '已完成'; break;
          case 4: color = 'purple'; text = '售后中'; break;
          case 5: color = 'magenta'; text = '已退款'; break;
          case 6: color = 'red'; text = '已取消'; break;
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
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showDetail(record)}>详情</Button>
          {record.status === 7 && (
             <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => showAudit(record)}>审核</Button>
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
        setAuditModalVisible(false);
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
    setAuditTarget(record);
    auditForm.resetFields();
    setAuditModalVisible(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap gap-4 items-center">
          <Input placeholder="订单编号/客户姓名" prefix={<SearchOutlined />} style={{ width: 200 }} />
          <RangePicker />
          <Select 
            value={status === undefined ? 'all' : String(status)} 
            style={{ width: 120 }}
            onChange={handleStatusChange}
          >
            <Option value="all">全部状态</Option>
            <Option value="0">待支付</Option>
            <Option value="1">待发货</Option>
            <Option value="2">配送中</Option>
            <Option value="3">已完成</Option>
            <Option value="7">待审核</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={() => fetchOrders()}>查询</Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            ...pagination,
            showTotal: (total) => `共 ${total} 条`,
            showSizeChanger: true,
            onChange: (page, pageSize) => {
                setPagination({ ...pagination, current: page, pageSize: pageSize });
            }
          }}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
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
                    <Tag>{currentOrder.status === 7 ? '待审核' : currentOrder.status}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="买家ID">{currentOrder.userId}</Descriptions.Item>
                  <Descriptions.Item label="创建时间">{currentOrder.createTime}</Descriptions.Item>
                  <Descriptions.Item label="药品名称" span={2}>{currentOrder.medicineName}</Descriptions.Item>
                  <Descriptions.Item label="处方图片" span={2}>
                     {currentOrder.prescriptionImage ? (
                       <Image src={currentOrder.prescriptionImage} width={200} />
                     ) : '无'}
                  </Descriptions.Item>
              </Descriptions>
          )}
      </Modal>

      <Modal
        title="处方审核"
        open={auditModalVisible}
        onOk={handleAudit}
        onCancel={() => setAuditModalVisible(false)}
        confirmLoading={auditLoading}
      >
        {auditTarget && (
          <div className="flex flex-col gap-4">
             <div>
               <div className="mb-2 font-bold">处方图片：</div>
               {auditTarget.prescriptionImage ? (
                 <Image src={auditTarget.prescriptionImage} height={200} className="object-contain bg-gray-100 rounded" />
               ) : (
                 <div className="text-red-500">未上传处方图片</div>
               )}
             </div>
             
             <Form form={auditForm} layout="vertical">
               <Form.Item name="pass" label="审核结果" rules={[{ required: true }]}>
                 <Radio.Group>
                   <Radio value={true}>通过</Radio>
                   <Radio value={false}>拒绝</Radio>
                 </Radio.Group>
               </Form.Item>
               <Form.Item 
                 name="reason" 
                 label="审核意见" 
                 rules={[{ required: true, message: '请输入审核意见' }]}
               >
                 <Input.TextArea rows={3} placeholder="请输入审核意见（如拒绝原因）" />
               </Form.Item>
             </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderList;
