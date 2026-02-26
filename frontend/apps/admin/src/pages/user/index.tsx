import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Card, Descriptions, Drawer, Form, Input, Popconfirm, Select, Space, Table, Tag, Typography, App } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, ReloadOutlined, SearchOutlined, StopOutlined, UnlockOutlined, UserOutlined } from '@ant-design/icons';
import { getUserList, updateUserStatus } from '../../services/user';
import type { User, UserQuery } from '../../services/user';

const UserList: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [query, setQuery] = useState<UserQuery>({
    page: 1,
    size: 10,
  });

  const [form] = Form.useForm();
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<User | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUserList(query);
      if (res.code === 200) {
        setData(res.data.records);
        setTotal(res.data.total);
        setLastUpdatedAt(Date.now());
      } else {
        message.error(res.message);
      }
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [message, query]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = useCallback((values: any) => {
    setQuery((prev) => ({ ...prev, ...values, page: 1 }));
  }, []);

  const handleReset = useCallback(() => {
    form.resetFields();
    setQuery({ page: 1, size: 10 });
  }, [form]);

  const handleStatusChange = useCallback(async (id: number, currentStatus: number) => {
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
  }, [fetchData, message]);

  const openDetail = useCallback((u: User) => {
    setActiveUser(u);
    setDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setActiveUser(null);
  }, []);

  const roleMeta = useCallback((role: string) => {
    if (role === 'ADMIN') return { color: 'green', text: '管理员' };
    if (role === 'SELLER') return { color: 'orange', text: '商家' };
    if (role === 'RIDER') return { color: 'purple', text: '骑手' };
    if (role === 'PHARMACIST') return { color: 'geekblue', text: '医师' };
    return { color: 'blue', text: '用户' };
  }, []);

  const columns: ColumnsType<User> = useMemo(() => {
    return [
      {
        title: '用户',
        key: 'user',
        width: 320,
        render: (_, record) => {
          const title = record.nickname || record.username || '用户';
          const subtitle = record.username && record.nickname ? record.username : `ID ${record.id}`;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar src={record.avatar} icon={<UserOutlined />} style={{ background: 'rgba(37, 99, 235, 1)' }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 900, color: 'rgba(15, 23, 42, 0.86)', lineHeight: 1.15 }}>
                  <Typography.Text ellipsis style={{ maxWidth: 220 }}>
                    {title}
                  </Typography.Text>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.56)' }}>
                  <Typography.Text ellipsis style={{ maxWidth: 260 }}>
                    {subtitle}
                  </Typography.Text>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        title: '手机号',
        dataIndex: 'mobile',
        key: 'mobile',
        width: 200,
        render: (mobile: string) => (
          <Typography.Text copyable={mobile ? { text: mobile } : false} style={{ color: 'rgba(15, 23, 42, 0.80)' }}>
            {mobile || '-'}
          </Typography.Text>
        ),
      },
      {
        title: '角色',
        dataIndex: 'role',
        key: 'role',
        width: 120,
        render: (role: string) => {
          const meta = roleMeta(role);
          return <Tag color={meta.color}>{meta.text}</Tag>;
        },
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 110,
        render: (status: number) => (
          <Tag color={status === 1 ? 'success' : 'error'} style={{ borderRadius: 999, paddingInline: 10 }}>
            {status === 1 ? '正常' : '禁用'}
          </Tag>
        ),
      },
      {
        title: '注册时间',
        dataIndex: 'createTime',
        key: 'createTime',
        width: 200,
      },
      {
        title: '操作',
        key: 'action',
        width: 220,
        fixed: 'right',
        render: (_, record) => (
          <Space size={8}>
            <Button icon={<EyeOutlined />} onClick={() => openDetail(record)} style={{ borderRadius: 999 }}>
              查看
            </Button>
            <Popconfirm
              title={`确定要${record.status === 1 ? '禁用' : '启用'}该用户吗？`}
              onConfirm={() => handleStatusChange(record.id, record.status)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                icon={record.status === 1 ? <StopOutlined /> : <UnlockOutlined />}
                danger={record.status === 1}
                type={record.status === 1 ? 'default' : 'primary'}
                style={{
                  borderRadius: 999,
                  background: record.status === 1 ? undefined : 'linear-gradient(90deg, rgba(37, 99, 235, 1), rgba(14, 165, 233, 1))',
                  border: record.status === 1 ? undefined : 'none',
                  boxShadow: record.status === 1 ? undefined : '0 18px 42px rgba(37, 99, 235, 0.18)',
                }}
              >
                {record.status === 1 ? '禁用' : '启用'}
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ];
  }, [handleStatusChange, openDetail, roleMeta]);

  const pageStyles = `
    .au-root {
      position: relative;
      padding: 8px 0;
    }
    .au-hero {
      position: relative;
      overflow: hidden;
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background:
        radial-gradient(900px 380px at 10% 10%, rgba(37, 99, 235, 0.22), rgba(37, 99, 235, 0) 55%),
        radial-gradient(760px 360px at 75% 18%, rgba(14, 165, 233, 0.14), rgba(14, 165, 233, 0) 60%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.90) 0%, rgba(255, 255, 255, 0.80) 100%);
      box-shadow: 0 26px 80px rgba(2, 6, 23, 0.10);
      padding: 14px 14px 12px;
      margin-bottom: 14px;
    }
    .au-hero::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.32;
      background-image: radial-gradient(rgba(15, 23, 42, 0.16) 1px, transparent 1px);
      background-size: 26px 26px;
      mask-image: radial-gradient(620px 460px at 65% 20%, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
    }
    .au-top {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }
    .au-title {
      margin: 0;
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.3px;
      color: rgba(15, 23, 42, 0.92);
    }
    .au-sub {
      margin-top: 4px;
      font-size: 12px;
      color: rgba(15, 23, 42, 0.62);
    }
    .au-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .au-chip.ant-tag {
      border-radius: 999px;
      padding-inline: 10px;
      margin-inline-end: 0;
      background: rgba(2, 6, 23, 0.04);
      border-color: rgba(15, 23, 42, 0.10);
      color: rgba(15, 23, 42, 0.70);
      font-weight: 650;
    }
    .au-actions .ant-btn {
      border-radius: 999px;
      height: 36px;
      padding: 0 14px;
      font-weight: 650;
      border-color: rgba(15, 23, 42, 0.12);
      color: rgba(15, 23, 42, 0.78);
      background: rgba(255,255,255,0.78);
    }
    .au-card.ant-card {
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      box-shadow: 0 20px 60px rgba(2, 6, 23, 0.08);
      background: rgba(255,255,255,0.86);
      overflow: hidden;
    }
    .au-card .ant-card-body { padding: 14px; }
    .au-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: flex-end;
    }
    .au-filters .ant-form-item {
      margin-bottom: 0;
    }
    .au-table .ant-table-container {
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(15, 23, 42, 0.08);
    }
    .au-table .ant-table-thead > tr > th {
      background: rgba(2, 6, 23, 0.02);
      color: rgba(15, 23, 42, 0.70);
      font-weight: 900;
    }
    .au-table .ant-table-tbody > tr > td {
      border-bottom: 1px solid rgba(15, 23, 42, 0.06);
    }
  `;

  return (
    <div className="au-root">
      <style>{pageStyles}</style>

      <div className="au-hero" aria-label="普通用户概览">
        <div className="au-top">
          <div>
            <h2 className="au-title">普通用户</h2>
            <div className="au-sub">搜索、筛选与状态管理</div>
          </div>
          <div className="au-actions">
            <Tag className="au-chip">总计 {total}</Tag>
            <Tag className="au-chip">
              {lastUpdatedAt ? `更新于 ${new Date(lastUpdatedAt).toLocaleTimeString()}` : '未刷新'}
            </Tag>
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
              刷新
            </Button>
          </div>
        </div>
      </div>

      <Card className="au-card" variant="outlined">
        <Form form={form} layout="vertical" onFinish={handleSearch}>
          <div className="au-filters">
            <Form.Item name="keyword" label="关键词">
              <Input placeholder="用户名 / 昵称 / 手机号" allowClear style={{ width: 260 }} />
            </Form.Item>
            <Form.Item name="role" label="角色">
              <Select placeholder="全部" allowClear style={{ width: 160 }}>
                <Select.Option value="USER">用户</Select.Option>
                <Select.Option value="SELLER">商家</Select.Option>
                <Select.Option value="RIDER">骑手</Select.Option>
                <Select.Option value="ADMIN">管理员</Select.Option>
                <Select.Option value="PHARMACIST">医师</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Select placeholder="全部" allowClear style={{ width: 160 }}>
                <Select.Option value={1}>正常</Select.Option>
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
                    background: 'linear-gradient(90deg, rgba(37, 99, 235, 1), rgba(14, 165, 233, 1))',
                    border: 'none',
                    boxShadow: '0 18px 42px rgba(37, 99, 235, 0.18)',
                  }}
                >
                  搜索
                </Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />} style={{ borderRadius: 999 }}>
                  重置
                </Button>
              </Space>
            </Form.Item>
          </div>
        </Form>
      </Card>

      <Card className="au-card au-table" variant="outlined" style={{ marginTop: 14 }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1060 }}
          pagination={{
            current: query.page,
            pageSize: query.size,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, size) => setQuery((prev) => ({ ...prev, page, size })),
          }}
        />
      </Card>

      <Drawer
        title="用户详情"
        open={detailOpen}
        onClose={closeDetail}
        width={420}
        destroyOnClose
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Avatar src={activeUser?.avatar} icon={<UserOutlined />} size={48} style={{ background: 'rgba(37, 99, 235, 1)' }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: 'rgba(15, 23, 42, 0.86)' }}>
              <Typography.Text ellipsis style={{ maxWidth: 320 }}>
                {activeUser?.nickname || activeUser?.username || '-'}
              </Typography.Text>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.56)' }}>
              {activeUser?.username ? `用户名：${activeUser.username}` : '-'}
            </div>
          </div>
        </div>

        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="用户ID">{activeUser?.id ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="手机号">{activeUser?.mobile || '-'}</Descriptions.Item>
          <Descriptions.Item label="角色">
            {activeUser ? <Tag color={roleMeta(activeUser.role).color}>{roleMeta(activeUser.role).text}</Tag> : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            {activeUser ? (
              <Tag color={activeUser.status === 1 ? 'success' : 'error'} style={{ borderRadius: 999, paddingInline: 10 }}>
                {activeUser.status === 1 ? '正常' : '禁用'}
              </Tag>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="注册时间">{activeUser?.createTime || '-'}</Descriptions.Item>
        </Descriptions>
      </Drawer>
    </div>
  );
};

export default UserList;
