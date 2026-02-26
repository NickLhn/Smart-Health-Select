import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { App, Button, Card, Drawer, Form, Input, InputNumber, Popconfirm, Space, Table, Tag, TreeSelect, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { getCategoryList, addCategory, updateCategory, deleteCategory } from '../../../services/medicine';
import type { Category } from '../../../services/medicine';

const CategoryList: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Category[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCategoryList();
      if (res.code === 200) {
        setData(res.data);
        setLastUpdatedAt(Date.now());
      }
    } catch (error) {
      message.error('获取分类失败');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = useCallback((parentId?: number) => {
    setEditingId(null);
    form.resetFields();
    if (parentId) {
      form.setFieldValue('parentId', parentId);
    }
    setDrawerOpen(true);
  }, [form]);

  const handleEdit = useCallback((record: Category) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      parentId: record.parentId === 0 ? undefined : record.parentId,
    });
    setDrawerOpen(true);
  }, [form]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      const res = await deleteCategory(id);
      if (res.code === 200) {
        message.success('删除成功');
        fetchData();
      }
    } catch (error) {
      message.error('删除失败');
    }
  }, [fetchData, message]);

  const handleOk = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        parentId: values.parentId ?? 0,
      };
      if (editingId) {
        const res = await updateCategory({ ...payload, id: editingId });
        if (res.code !== 200) {
          message.error(res.message || '更新失败');
          return;
        }
        message.success('更新成功');
      } else {
        const res = await addCategory(payload);
        if (res.code !== 200) {
          message.error(res.message || '添加失败');
          return;
        }
        message.success('添加成功');
      }
      setDrawerOpen(false);
      fetchData();
    } catch (error) {
      message.error('提交失败');
    }
  }, [editingId, fetchData, form, message]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setEditingId(null);
    form.resetFields();
  }, [form]);

  const countNodes = useCallback((nodes: Category[]): number => {
    let total = 0;
    for (const n of nodes) {
      total += 1;
      if (n.children && n.children.length) total += countNodes(n.children);
    }
    return total;
  }, []);

  const totalCount = useMemo(() => countNodes(data), [countNodes, data]);

  const filterTree = useCallback((nodes: Category[], kw: string): Category[] => {
    const k = kw.trim().toLowerCase();
    if (!k) return nodes;
    const result: Category[] = [];
    for (const n of nodes) {
      const children = n.children ? filterTree(n.children, k) : [];
      const selfMatch = (n.name || '').toLowerCase().includes(k);
      if (selfMatch || children.length) {
        result.push({
          ...n,
          children,
        });
      }
    }
    return result;
  }, []);

  const filteredData = useMemo(() => filterTree(data, keyword), [data, filterTree, keyword]);

  const collectSubtreeIds = useCallback((nodes: Category[], rootId: number): Set<number> => {
    const res = new Set<number>();
    const walk = (list: Category[]) => {
      for (const n of list) {
        if (n.id === rootId) {
          const collect = (x: Category) => {
            res.add(x.id);
            if (x.children?.length) x.children.forEach(collect);
          };
          collect(n);
          return true;
        }
        if (n.children?.length) {
          const found = walk(n.children);
          if (found) return true;
        }
      }
      return false;
    };
    walk(nodes);
    return res;
  }, []);

  const disabledParentIds = useMemo(() => {
    if (!editingId) return new Set<number>();
    return collectSubtreeIds(data, editingId);
  }, [collectSubtreeIds, data, editingId]);

  const renderTreeNodes = useCallback(
    (nodes: Category[]): any[] => {
      return nodes.map((item) => ({
        title: item.name,
        value: item.id,
        children: item.children ? renderTreeNodes(item.children) : [],
        disabled: disabledParentIds.has(item.id),
      }));
    },
    [disabledParentIds],
  );

  const columns: any = useMemo(() => [
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
      render: (v: string, record: Category) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background:
                record.level === 1
                  ? 'rgba(37, 99, 235, 1)'
                  : record.level === 2
                    ? 'rgba(14, 165, 233, 1)'
                    : 'rgba(16, 185, 129, 1)',
              boxShadow: '0 10px 24px rgba(2, 6, 23, 0.12)',
              flex: '0 0 auto',
            }}
          />
          <Typography.Text ellipsis style={{ fontWeight: 900, color: 'rgba(15, 23, 42, 0.86)' }}>
            {v}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 120,
      render: (v: number) => (
        <Typography.Text style={{ color: 'rgba(15, 23, 42, 0.78)' }}>{v ?? 0}</Typography.Text>
      ),
    },
    {
      title: '层级',
      dataIndex: 'level',
      key: 'level',
      width: 120,
      render: (level: number) => <Tag style={{ borderRadius: 999, paddingInline: 10 }}>{level}级</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Category) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<PlusOutlined />} 
            onClick={() => handleAdd(record.id)}
            disabled={record.level >= 3}
          >
            添加子级
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除?"
            description="删除后不可恢复，且可能影响关联商品"
            onConfirm={() => handleDelete(record.id)}
          >
             <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ], [handleAdd, handleDelete, handleEdit]);

  const pageStyles = `
    .cat-root { position: relative; padding: 8px 0; }
    .cat-hero {
      position: relative;
      overflow: hidden;
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background:
        radial-gradient(860px 360px at 12% 14%, rgba(37, 99, 235, 0.22), rgba(37, 99, 235, 0) 55%),
        radial-gradient(760px 360px at 78% 18%, rgba(16, 185, 129, 0.14), rgba(16, 185, 129, 0) 60%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.90) 0%, rgba(255, 255, 255, 0.82) 100%);
      box-shadow: 0 26px 80px rgba(2, 6, 23, 0.10);
      padding: 14px 14px 12px;
      margin-bottom: 14px;
    }
    .cat-hero::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.30;
      background-image: radial-gradient(rgba(15, 23, 42, 0.16) 1px, transparent 1px);
      background-size: 26px 26px;
      mask-image: radial-gradient(620px 460px at 70% 22%, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
    }
    .cat-top {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }
    .cat-title {
      margin: 0;
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.3px;
      color: rgba(15, 23, 42, 0.92);
    }
    .cat-sub {
      margin-top: 4px;
      font-size: 12px;
      color: rgba(15, 23, 42, 0.62);
    }
    .cat-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .cat-chip.ant-tag {
      border-radius: 999px;
      padding-inline: 10px;
      margin-inline-end: 0;
      background: rgba(2, 6, 23, 0.04);
      border-color: rgba(15, 23, 42, 0.10);
      color: rgba(15, 23, 42, 0.70);
      font-weight: 650;
    }
    .cat-actions .ant-btn {
      border-radius: 999px;
      height: 36px;
      padding: 0 14px;
      font-weight: 650;
      border-color: rgba(15, 23, 42, 0.12);
      color: rgba(15, 23, 42, 0.78);
      background: rgba(255,255,255,0.78);
    }
    .cat-card.ant-card {
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      box-shadow: 0 20px 60px rgba(2, 6, 23, 0.08);
      background: rgba(255,255,255,0.86);
      overflow: hidden;
    }
    .cat-card .ant-card-body { padding: 14px; }
    .cat-toolbar {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .cat-table .ant-table-container {
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(15, 23, 42, 0.08);
    }
    .cat-table .ant-table-thead > tr > th {
      background: rgba(2, 6, 23, 0.02);
      color: rgba(15, 23, 42, 0.70);
      font-weight: 900;
    }
    .cat-table .ant-table-tbody > tr > td {
      border-bottom: 1px solid rgba(15, 23, 42, 0.06);
    }
  `;

  return (
    <div className="cat-root">
      <style>{pageStyles}</style>

      <div className="cat-hero" aria-label="分类管理概览">
        <div className="cat-top">
          <div>
            <h2 className="cat-title">分类管理</h2>
            <div className="cat-sub">支持多级分类维护与快速检索</div>
          </div>
          <div className="cat-actions">
            <Tag className="cat-chip">总计 {totalCount}</Tag>
            <Tag className="cat-chip">
              {lastUpdatedAt ? `更新于 ${new Date(lastUpdatedAt).toLocaleTimeString()}` : '未刷新'}
            </Tag>
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleAdd()}
              style={{
                borderRadius: 999,
                background: 'linear-gradient(90deg, rgba(37, 99, 235, 1), rgba(16, 185, 129, 1))',
                border: 'none',
                boxShadow: '0 18px 42px rgba(37, 99, 235, 0.16)',
              }}
            >
              添加一级分类
            </Button>
          </div>
        </div>
      </div>

      <Card className="cat-card cat-table" variant="outlined">
        <div className="cat-toolbar">
          <Input
            allowClear
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            prefix={<SearchOutlined />}
            placeholder="搜索分类名称"
            style={{ width: 320, borderRadius: 999 }}
          />
          <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.58)' }}>
            {keyword.trim() ? `筛选后 ${countNodes(filteredData)} 项` : `共 ${totalCount} 项`}
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={false}
          expandable={{ defaultExpandAllRows: true }}
        />
      </Card>

      <Drawer
        title={editingId ? '编辑分类' : '添加分类'}
        open={drawerOpen}
        onClose={closeDrawer}
        width={420}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <Button onClick={closeDrawer} style={{ borderRadius: 999 }}>
              取消
            </Button>
            <Button
              type="primary"
              onClick={handleOk}
              style={{
                borderRadius: 999,
                background: 'linear-gradient(90deg, rgba(37, 99, 235, 1), rgba(16, 185, 129, 1))',
                border: 'none',
                boxShadow: '0 18px 42px rgba(16, 185, 129, 0.14)',
              }}
            >
              保存
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="parentId" label="上级分类">
            <TreeSelect
              allowClear
              placeholder="请选择上级分类（留空为一级分类）"
              treeData={renderTreeNodes(data)}
              treeDefaultExpandAll
            />
          </Form.Item>
          <Form.Item name="name" label="分类名称" rules={[{ required: true, message: '请输入分类名称' }]}>
            <Input placeholder="例如：日常护理" />
          </Form.Item>
          <Form.Item name="sort" label="排序" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default CategoryList;
