import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Card, Descriptions, Drawer, Form, Input, Popconfirm, Select, Space, Switch, Table, Tag, Typography, App } from 'antd';
import { DeleteOutlined, EyeOutlined, MedicineBoxOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { getAdminMedicineList, deleteMedicineAdmin, updateMedicineStatusAdmin, getCategoryList } from '../../../services/medicine';
import type { Medicine, MedicineQuery, Category } from '../../../services/medicine';
import type { ColumnsType } from 'antd/es/table';

const MedicineList: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Medicine[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [query, setQuery] = useState<MedicineQuery>({
    page: 1,
    size: 10,
  });

  const [form] = Form.useForm();
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeMedicine, setActiveMedicine] = useState<Medicine | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await getCategoryList();
      if (res.code === 200) {
        setCategories(res.data);
      }
    } catch (error) {
      message.error('获取分类失败');
    }
  }, [message]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminMedicineList(query);
      if (res.code === 200) {
        setData(res.data.records);
        setTotal(res.data.total);
        setLastUpdatedAt(Date.now());
      }
    } catch (error) {
      message.error('获取药品列表失败');
    } finally {
      setLoading(false);
    }
  }, [message, query]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = useCallback((values: any) => {
    const keyword = (values?.keyword || '').trim();
    setQuery((prev) => ({
      ...prev,
      page: 1,
      keyword: keyword || undefined,
      categoryId: values?.categoryId ?? undefined,
      status: values?.status ?? undefined,
      isPrescription: values?.isPrescription ?? undefined,
    }));
  }, []);

  const handleReset = useCallback(() => {
    form.resetFields();
    setQuery({
      page: 1,
      size: 10,
    });
  }, [form]);

  const handleTableChange = useCallback((pagination: any) => {
    setQuery((prev) => ({
      ...prev,
      page: pagination.current,
      size: pagination.pageSize,
    }));
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    try {
      const res = await deleteMedicineAdmin(id);
      if (res.code === 200) {
        message.success('删除成功');
        fetchData();
      }
    } catch (error) {
      message.error('删除失败');
    }
  }, [fetchData, message]);

  const handleStatusChange = useCallback(async (id: number, checked: boolean) => {
    try {
      const res = await updateMedicineStatusAdmin(id, checked ? 1 : 0);
      if (res.code === 200) {
        message.success('状态更新成功');
        fetchData(); // Refresh to ensure data consistency
      }
    } catch (error) {
      message.error('状态更新失败');
    }
  }, [fetchData, message]);

  const openDetail = useCallback((m: Medicine) => {
    setActiveMedicine(m);
    setDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setActiveMedicine(null);
  }, []);

  const columns: ColumnsType<Medicine> = useMemo(() => {
    return [
      {
        title: '药品',
        key: 'medicine',
        width: 360,
        render: (_, record) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar
              shape="square"
              size={44}
              src={record.mainImage}
              icon={<MedicineBoxOutlined />}
              style={{ borderRadius: 12, background: 'rgba(37, 99, 235, 1)' }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Typography.Text ellipsis style={{ maxWidth: 240, fontWeight: 900, color: 'rgba(15, 23, 42, 0.86)' }}>
                  {record.name || '未命名药品'}
                </Typography.Text>
                <Tag color={record.isPrescription === 1 ? 'red' : 'green'} style={{ borderRadius: 999, paddingInline: 10 }}>
                  {record.isPrescription === 1 ? '处方药' : 'OTC'}
                </Tag>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.56)' }}>
                <Space size={10} wrap>
                  <span>{record.categoryName || '未分类'}</span>
                </Space>
              </div>
            </div>
          </div>
        ),
      },
      {
        title: '店铺',
        dataIndex: 'sellerName',
        key: 'sellerName',
        width: 200,
        render: (v: string) => (
          <Typography.Text ellipsis style={{ maxWidth: 180, color: 'rgba(15, 23, 42, 0.78)' }}>
            {v || '-'}
          </Typography.Text>
        ),
      },
      {
        title: '价格',
        dataIndex: 'price',
        key: 'price',
        width: 120,
        render: (price: number) => (
          <Typography.Text style={{ fontWeight: 900, color: 'rgba(15, 23, 42, 0.86)' }}>
            ¥{Number(price || 0).toFixed(2)}
          </Typography.Text>
        ),
      },
      {
        title: '库存',
        dataIndex: 'stock',
        key: 'stock',
        width: 110,
        render: (v: number) => <Typography.Text style={{ color: 'rgba(15, 23, 42, 0.78)' }}>{v ?? '-'}</Typography.Text>,
      },
      {
        title: '销量',
        dataIndex: 'sales',
        key: 'sales',
        width: 110,
        render: (v: number) => <Typography.Text style={{ color: 'rgba(15, 23, 42, 0.78)' }}>{v ?? '-'}</Typography.Text>,
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (status: number, record) => (
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
        width: 200,
        fixed: 'right',
        render: (_, record) => (
          <Space size={8}>
            <Button icon={<EyeOutlined />} onClick={() => openDetail(record)} style={{ borderRadius: 999 }}>
              查看
            </Button>
            <Popconfirm
              title="确定要删除这个药品吗?"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button danger icon={<DeleteOutlined />} style={{ borderRadius: 999 }}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ];
  }, [handleDelete, handleStatusChange, openDetail]);

  const pageStyles = `
    .med-root { position: relative; padding: 8px 0; }
    .med-hero {
      position: relative;
      overflow: hidden;
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background:
        radial-gradient(900px 380px at 10% 10%, rgba(37, 99, 235, 0.22), rgba(37, 99, 235, 0) 55%),
        radial-gradient(760px 360px at 78% 18%, rgba(14, 165, 233, 0.14), rgba(14, 165, 233, 0) 60%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.90) 0%, rgba(255, 255, 255, 0.82) 100%);
      box-shadow: 0 26px 80px rgba(2, 6, 23, 0.10);
      padding: 14px 14px 12px;
      margin-bottom: 14px;
    }
    .med-hero::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.30;
      background-image: radial-gradient(rgba(15, 23, 42, 0.16) 1px, transparent 1px);
      background-size: 26px 26px;
      mask-image: radial-gradient(620px 460px at 65% 20%, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
    }
    .med-top {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }
    .med-title {
      margin: 0;
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.3px;
      color: rgba(15, 23, 42, 0.92);
    }
    .med-sub {
      margin-top: 4px;
      font-size: 12px;
      color: rgba(15, 23, 42, 0.62);
    }
    .med-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .med-chip.ant-tag {
      border-radius: 999px;
      padding-inline: 10px;
      margin-inline-end: 0;
      background: rgba(2, 6, 23, 0.04);
      border-color: rgba(15, 23, 42, 0.10);
      color: rgba(15, 23, 42, 0.70);
      font-weight: 650;
    }
    .med-actions .ant-btn {
      border-radius: 999px;
      height: 36px;
      padding: 0 14px;
      font-weight: 650;
      border-color: rgba(15, 23, 42, 0.12);
      color: rgba(15, 23, 42, 0.78);
      background: rgba(255,255,255,0.78);
    }
    .med-card.ant-card {
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      box-shadow: 0 20px 60px rgba(2, 6, 23, 0.08);
      background: rgba(255,255,255,0.86);
      overflow: hidden;
    }
    .med-card .ant-card-body { padding: 14px; }
    .med-filters { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
    .med-filters .ant-form-item { margin-bottom: 0; }
    .med-table .ant-table-container {
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(15, 23, 42, 0.08);
    }
    .med-table .ant-table-thead > tr > th {
      background: rgba(2, 6, 23, 0.02);
      color: rgba(15, 23, 42, 0.70);
      font-weight: 900;
    }
    .med-table .ant-table-tbody > tr > td {
      border-bottom: 1px solid rgba(15, 23, 42, 0.06);
    }
    .med-drawer .ant-drawer-body { padding: 16px; }
  `;

  return (
    <div className="med-root">
      <style>{pageStyles}</style>

      <div className="med-hero" aria-label="药品库概览">
        <div className="med-top">
          <div>
            <h2 className="med-title">药品库</h2>
            <div className="med-sub">筛选、上/下架与信息核验</div>
          </div>
          <div className="med-actions">
            <Tag className="med-chip">总计 {total}</Tag>
            <Tag className="med-chip">
              {lastUpdatedAt ? `更新于 ${new Date(lastUpdatedAt).toLocaleTimeString()}` : '未刷新'}
            </Tag>
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
              刷新
            </Button>
          </div>
        </div>
      </div>

      <Card className="med-card" variant="outlined">
        <Form form={form} layout="vertical" onFinish={handleSearch}>
          <div className="med-filters">
            <Form.Item name="keyword" label="关键词">
              <Input placeholder="药品名称 / 编码" allowClear prefix={<SearchOutlined />} style={{ width: 280 }} />
            </Form.Item>
            <Form.Item name="categoryId" label="分类">
              <Select placeholder="全部" allowClear style={{ width: 180 }}>
                {categories.map((c) => (
                  <Select.Option key={c.id} value={c.id}>
                    {c.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="isPrescription" label="属性">
              <Select placeholder="全部" allowClear style={{ width: 140 }}>
                <Select.Option value={0}>OTC</Select.Option>
                <Select.Option value={1}>处方药</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Select placeholder="全部" allowClear style={{ width: 140 }}>
                <Select.Option value={1}>上架</Select.Option>
                <Select.Option value={0}>下架</Select.Option>
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

      <Card className="med-card med-table" variant="outlined" style={{ marginTop: 14 }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: query.page,
            pageSize: query.size,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      <Drawer
        className="med-drawer"
        title="药品详情"
        open={detailOpen}
        onClose={closeDetail}
        width={520}
        destroyOnClose
      >
        {activeMedicine ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar
                shape="square"
                size={56}
                src={activeMedicine.mainImage}
                icon={<MedicineBoxOutlined />}
                style={{ borderRadius: 14, background: 'rgba(37, 99, 235, 1)' }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <Typography.Text style={{ fontSize: 18, fontWeight: 900, color: 'rgba(15, 23, 42, 0.88)' }} ellipsis>
                    {activeMedicine.name || '未命名药品'}
                  </Typography.Text>
                  <Tag color={activeMedicine.isPrescription === 1 ? 'red' : 'green'} style={{ borderRadius: 999, paddingInline: 10 }}>
                    {activeMedicine.isPrescription === 1 ? '处方药' : 'OTC'}
                  </Tag>
                  <Tag color={activeMedicine.status === 1 ? 'success' : 'default'} style={{ borderRadius: 999, paddingInline: 10 }}>
                    {activeMedicine.status === 1 ? '上架' : '下架'}
                  </Tag>
                </div>
                <div style={{ marginTop: 3, fontSize: 12, color: 'rgba(15, 23, 42, 0.56)' }}>
                  <Space size={10} wrap>
                    <span>{activeMedicine.categoryName || '未分类'}</span>
                  </Space>
                </div>
              </div>
            </div>

            <Card className="med-card" variant="outlined">
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="店铺">{activeMedicine.sellerName || '-'}</Descriptions.Item>
                <Descriptions.Item label="价格">¥{Number(activeMedicine.price || 0).toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label="库存">{activeMedicine.stock ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="销量">{activeMedicine.sales ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="生产日期">{activeMedicine.productionDate || '-'}</Descriptions.Item>
                <Descriptions.Item label="到期日期">{activeMedicine.expiryDate || '-'}</Descriptions.Item>
                <Descriptions.Item label="创建时间">{activeMedicine.createTime || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
};

export default MedicineList;
