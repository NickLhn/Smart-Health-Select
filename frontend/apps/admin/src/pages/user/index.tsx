import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Input, Form, Select, Card, App, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { getUserList, updateUserStatus } from '../../services/user';
import type { User, UserQuery } from '../../services/user';

const UserList: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState<UserQuery>({
    page: 1,
    size: 10,
  });

  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getUserList(query);
      if (res.code === 200) {
        setData(res.data.records);
        setTotal(res.data.total);
      } else {
        message.error(res.message);
      }
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [query]);

  const handleSearch = (values: any) => {
    setQuery({ ...query, ...values, page: 1 });
  };

  const handleReset = () => {
    form.resetFields();
    setQuery({ page: 1, size: 10 });
  };

  const handleStatusChange = async (id: number, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
      const res = await updateUserStatus(id, newStatus);
      if (res.code === 200) {
        message.success('状态更新成功');
        fetchData();
      } else {
        message.error(res.message);
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '手机号',
      dataIndex: 'mobile',
      key: 'mobile',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        let color = 'blue';
        let text = '普通用户';
        if (role === 'USER') {
          color = 'red';
          text = '用户';
        } else if (role === 'SELLER') {
          color = 'orange';
          text = '商家';
        } else if (role === 'RIDER') {
          color = 'purple';
          text = '骑手';
        }else if (role === 'ADMIN') {
          color = 'green';
          text = '管理员';
        } else if (role === 'PHARMACIST') {
          color = 'green';
          text = '医师';
        } 
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '注册时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 1 ? 'success' : 'error'}>
          {status === 1 ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Popconfirm
            title={`确定要${record.status === 1 ? '禁用' : '启用'}该用户吗？`}
            onConfirm={() => handleStatusChange(record.id, record.status)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger={record.status === 1}>
              {record.status === 1 ? '禁用' : '启用'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card variant="borderless" style={{ marginBottom: 24 }}>
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="用户名/昵称/手机号" allowClear />
          </Form.Item>
          <Form.Item name="role" label="角色">
            <Select placeholder="请选择" allowClear style={{ width: 120 }}>
              <Select.Option value="USER">用户</Select.Option>
              <Select.Option value="SELLER">商家</Select.Option>
              <Select.Option value="RIDER">骑手</Select.Option>
              <Select.Option value="ADMIN">管理员</Select.Option>
              <Select.Option value="PHARMACIST">医师</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择" allowClear style={{ width: 120 }}>
              <Select.Option value={1}>正常</Select.Option>
              <Select.Option value={0}>禁用</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card variant="borderless">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: query.page,
            pageSize: query.size,
            total: total,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, size) => {
              setQuery({ ...query, page, size });
            },
          }}
        />
      </Card>
    </div>
  );
};

export default UserList;