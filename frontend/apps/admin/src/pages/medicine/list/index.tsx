import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Form, Input, Select, App, Popconfirm, Tag, Image, Switch, Card } from 'antd';
import { SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { getAdminMedicineList, deleteMedicineAdmin, updateMedicineStatusAdmin, getCategoryList } from '../../../services/medicine';
import type { Medicine, MedicineQuery, Category } from '../../../services/medicine';
import type { ColumnsType } from 'antd/es/table';

const MedicineList: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Medicine[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState<MedicineQuery>({
    page: 1,
    size: 10,
  });

  const [form] = Form.useForm();

  const fetchCategories = async () => {
    try {
      const res = await getCategoryList();
      if (res.code === 200) {
        setCategories(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAdminMedicineList(query);
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
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchData();
  }, [query]);

  const handleSearch = (values: any) => {
    setQuery({
      ...query,
      page: 1,
      ...values,
    });
  };

  const handleReset = () => {
    form.resetFields();
    setQuery({
      page: 1,
      size: 10,
    });
  };

  const handleTableChange = (pagination: any) => {
    setQuery({
      ...query,
      page: pagination.current,
      size: pagination.pageSize,
    });
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await deleteMedicineAdmin(id);
      if (res.code === 200) {
        message.success('删除成功');
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleStatusChange = async (id: number, checked: boolean) => {
    try {
      const res = await updateMedicineStatusAdmin(id, checked ? 1 : 0);
      if (res.code === 200) {
        message.success('状态更新成功');
        fetchData(); // Refresh to ensure data consistency
      }
    } catch (error) {
      console.error(error);
    }
  };

  const columns: ColumnsType<Medicine> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '商品图片',
      dataIndex: 'mainImage',
      key: 'mainImage',
      width: 100,
      render: (text) => <Image src={text} width={50} height={50} fallback="https://via.placeholder.com/50" />,
    },
    {
      title: '药品名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '店铺名称',
      dataIndex: 'sellerName',
      key: 'sellerName',
      render: (text) => text || '-',
    },
    {
      title: '分类',
      dataIndex: 'categoryName',
      key: 'categoryName',
      render: (text) => text || '-',
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `¥${price.toFixed(2)}`,
    },
    {
      title: '属性',
      dataIndex: 'isPrescription',
      key: 'isPrescription',
      render: (val) => (
        <Tag color={val === 1 ? 'red' : 'green'}>
          {val === 1 ? '处方药' : 'OTC'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Switch 
          checked={status === 1} 
          checkedChildren="上架" 
          unCheckedChildren="下架" 
          onChange={(checked) => handleStatusChange(record.id, checked)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Popconfirm
            title="确定要删除这个药品吗?"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="药品库管理" variant="borderless">
      <Form
        form={form}
        layout="inline"
        onFinish={handleSearch}
        style={{ marginBottom: 24 }}
      >
        <Form.Item name="keyword" label="关键词">
          <Input placeholder="输入药品名称/编码" allowClear />
        </Form.Item>
        <Form.Item name="categoryId" label="分类">
          <Select placeholder="选择分类" allowClear style={{ width: 150 }}>
            {categories.map((c) => (
              <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select placeholder="全部" allowClear style={{ width: 100 }}>
            <Select.Option value={1}>上架</Select.Option>
            <Select.Option value={0}>下架</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: query.page,
          pageSize: query.size,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
      />
    </Card>
  );
};

export default MedicineList;
