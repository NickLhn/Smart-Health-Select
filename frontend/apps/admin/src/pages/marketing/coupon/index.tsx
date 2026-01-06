import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Select, Tag, Modal, Form, DatePicker, InputNumber, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import request from '../../../services/request';

const { RangePicker } = DatePicker;

const CouponList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<any>({});
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await request.get('/marketing/coupon/page', {
        params: {
          page,
          size: pageSize,
          ...filters
        }
      });
      if (res.code === 200) {
        setData(res.data.records);
        setTotal(res.data.total);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, filters]);

  const handleSearch = (values: any) => {
    setFilters(values);
    setPage(1);
  };

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

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      timeRange: [dayjs(record.startTime), dayjs(record.endTime)]
    });
    setIsModalVisible(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
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
          setIsModalVisible(false);
          fetchData();
        }
      } else {
        const res = await request.post('/marketing/coupon/create', payload);
        if (res.code === 200) {
          message.success('创建成功');
          setIsModalVisible(false);
          fetchData();
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '名称', dataIndex: 'name' },
    { 
      title: '类型', 
      dataIndex: 'type',
      render: (type: number) => {
        const map = { 0: '全场通用', 1: '指定分类', 2: '指定商品' };
        return map[type as keyof typeof map] || '未知';
      }
    },
    { 
      title: '面值', 
      dataIndex: 'amount',
      render: (amount: number) => <span className="text-red-500 font-bold">¥{amount}</span>
    },
    { 
      title: '门槛', 
      dataIndex: 'minPoint',
      render: (minPoint: number) => minPoint > 0 ? `满${minPoint}可用` : '无门槛'
    },
    { 
      title: '有效期', 
      render: (_: any, record: any) => (
        <div className="text-xs text-gray-500">
          <div>{dayjs(record.startTime).format('YYYY-MM-DD HH:mm')}</div>
          <div>{dayjs(record.endTime).format('YYYY-MM-DD HH:mm')}</div>
        </div>
      )
    },
    { 
      title: '发放/使用', 
      render: (_: any, record: any) => (
        <span>{record.receiveCount} / {record.useCount}</span>
      )
    },
    { 
      title: '状态', 
      dataIndex: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Button 
            type="link" 
            size="small" 
            onClick={() => handleStatusChange(record.id, record.status === 1 ? 0 : 1)}
          >
            {record.status === 1 ? '禁用' : '启用'}
          </Button>
          <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger size="small">删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card className="mb-4">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="name" label="名称">
            <Input placeholder="优惠券名称" allowClear />
          </Form.Item>
          <Form.Item name="type" label="类型">
            <Select placeholder="全部" allowClear style={{ width: 120 }}>
              <Select.Option value={0}>全场通用</Select.Option>
              <Select.Option value={1}>指定分类</Select.Option>
              <Select.Option value={2}>指定商品</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" allowClear style={{ width: 120 }}>
              <Select.Option value={1}>启用</Select.Option>
              <Select.Option value={0}>禁用</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>查询</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card 
        title="优惠券列表" 
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新建优惠券</Button>}
      >
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id" 
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, s) => {
              setPage(p);
              setPageSize(s);
            }
          }}
        />
      </Card>

      <Modal
        title={editingId ? '编辑优惠券' : '新建优惠券'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="优惠券名称" rules={[{ required: true }]}>
            <Input placeholder="请输入名称" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="type" label="类型" rules={[{ required: true }]}>
              <Select>
                <Select.Option value={0}>全场通用</Select.Option>
                <Select.Option value={1}>指定分类</Select.Option>
                <Select.Option value={2}>指定商品</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="amount" label="面值" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0.01} precision={2} prefix="¥" />
            </Form.Item>
            <Form.Item name="minPoint" label="使用门槛" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="0为无门槛" prefix="¥" />
            </Form.Item>
            <Form.Item name="totalCount" label="发行总量" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={1} precision={0} />
            </Form.Item>
            <Form.Item name="perLimit" label="每人限领" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={1} precision={0} />
            </Form.Item>
          </div>
          <Form.Item name="timeRange" label="有效期" rules={[{ required: true }]}>
            <RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CouponList;
