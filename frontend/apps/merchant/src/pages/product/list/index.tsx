import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { App, Button, Card, Cascader, Input, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getCategoryList, getMedicineList, updateMedicineStatus } from '../../../services/product';
import type { Category, Medicine } from '../../../services/product';

const { Text } = Typography;

interface CategoryOption {
  value: string;
  label: string;
  children?: CategoryOption[];
}

const mapCategoryTree = (data: Category[]): CategoryOption[] => {
  return data.map((item) => ({
    value: item.id,
    label: item.name,
    children: item.children && item.children.length > 0 ? mapCategoryTree(item.children) : undefined,
  }));
};

const ProductList: React.FC = () => {
  const { message, modal } = App.useApp();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<number | undefined>(undefined);
  const [categoryPath, setCategoryPath] = useState<string[] | undefined>(undefined);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Medicine[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const navigate = useNavigate();
  const { current, pageSize } = pagination;

  const categoryId = useMemo(() => {
    if (!categoryPath || categoryPath.length === 0) return undefined;
    return categoryPath[categoryPath.length - 1];
  }, [categoryPath]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await getCategoryList();
      if (res.code === 200) {
        // 分类筛选直接复用后端分类树，避免前端再维护一套静态枚举。
        setCategoryOptions(mapCategoryTree(res.data));
      }
    } catch {
      message.error('获取分类失败');
    }
  }, [message]);

  const fetchData = useCallback(async (page = 1, size = 10) => {
    setLoading(true);
    try {
      // 商品列表统一按当前搜索词、状态和分类路径查询。
      const res = await getMedicineList({
        page,
        size,
        keyword,
        status,
        categoryId,
      });
      if (res.code === 200) {
        setData(res.data.records);
        setPagination({
          current: res.data.current,
          pageSize: res.data.size,
          total: res.data.total,
        });
      }
    } catch {
      message.error('获取商品列表失败');
    } finally {
      setLoading(false);
    }
  }, [categoryId, keyword, message, status]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = useCallback(() => {
    // 搜索时回到第一页，避免旧分页导致结果错位。
    fetchData(1, pageSize);
  }, [fetchData, pageSize]);

  const handleReset = useCallback(() => {
    setKeyword('');
    setStatus(undefined);
    setCategoryPath(undefined);
  }, []);

  useEffect(() => {
    fetchData(1, pageSize);
  }, [categoryId, fetchData, pageSize, status]);

  const handleStatusChange = useCallback(async (record: Medicine) => {
    const newStatus = record.status === 1 ? 0 : 1;
    const actionText = newStatus === 1 ? '上架' : '下架';
    
    modal.confirm({
      title: `确认${actionText}?`,
      content: `确定要${actionText}商品"${record.name}"吗？`,
      onOk: async () => {
        try {
          const res = await updateMedicineStatus(record.id, newStatus);
          if (res.code === 200) {
            message.success(`${actionText}成功`);
            // 状态变化后刷新当前页，保证表格展示和后端一致。
            fetchData(current, pageSize);
          } else {
            message.error(res.message || `${actionText}失败`);
          }
        } catch {
          message.error(`${actionText}失败`);
        }
      },
    });
  }, [current, fetchData, message, modal, pageSize]);

  const handleTableChange = useCallback((nextPagination: any) => {
    fetchData(nextPagination.current, nextPagination.pageSize);
  }, [fetchData]);

  const listStyles = `
    .pl-root {
      position: relative;
    }
    .pl-hero {
      position: relative;
      overflow: hidden;
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background:
        radial-gradient(920px 360px at 10% 10%, rgba(16, 185, 129, 0.20), rgba(16, 185, 129, 0) 60%),
        radial-gradient(760px 340px at 75% 18%, rgba(34, 211, 238, 0.18), rgba(34, 211, 238, 0) 60%),
        linear-gradient(180deg, rgba(255,255,255,0.86) 0%, rgba(255,255,255,0.76) 100%);
      box-shadow: 0 26px 80px rgba(2, 6, 23, 0.10);
      padding: 16px 16px 14px;
      margin-bottom: 16px;
    }
    .pl-hero::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.32;
      background-image: radial-gradient(rgba(15, 23, 42, 0.16) 1px, transparent 1px);
      background-size: 26px 26px;
      mask-image: radial-gradient(620px 460px at 65% 20%, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
    }
    .pl-top {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .pl-title {
      margin: 0;
      font-size: 20px;
      font-weight: 850;
      letter-spacing: -0.3px;
      color: rgba(15, 23, 42, 0.92);
    }
    .pl-sub {
      margin-top: 6px;
      font-size: 12px;
      color: rgba(15, 23, 42, 0.58);
    }
    .pl-actions {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .pl-actions .ant-btn {
      border-radius: 999px;
      height: 36px;
      padding: 0 14px;
      font-weight: 650;
    }
    .pl-actions .pl-primary.ant-btn {
      background: linear-gradient(90deg, rgba(5, 150, 105, 1), rgba(16, 185, 129, 1));
      border: none;
      box-shadow: 0 14px 38px rgba(16, 185, 129, 0.22);
    }
    .pl-filters {
      position: relative;
      z-index: 1;
      margin-top: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .pl-filterLeft {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .pl-filterLeft .ant-input-affix-wrapper,
    .pl-filterLeft .ant-select-selector,
    .pl-filterLeft .ant-cascader .ant-select-selector {
      border-radius: 999px !important;
    }
    .pl-filterLeft .ant-input-affix-wrapper {
      height: 36px;
    }
    .pl-filterRight {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .pl-tableCard {
      border-radius: 18px !important;
      border: 1px solid rgba(15, 23, 42, 0.10) !important;
      box-shadow: 0 18px 55px rgba(2, 6, 23, 0.06) !important;
      overflow: hidden;
    }
    .pl-tableCard .ant-card-body {
      padding: 0;
      background: rgba(255,255,255,0.90);
    }
    .pl-rowOff {
      opacity: 0.70;
    }
    @media (max-width: 768px) {
      .pl-actions { width: 100%; justify-content: flex-start; }
      .pl-filters { flex-direction: column; align-items: stretch; }
      .pl-filterRight { justify-content: flex-start; }
      .pl-filterLeft { width: 100%; }
      .pl-filterLeft .ant-input-affix-wrapper { width: 100% !important; }
      .pl-filterLeft .ant-select,
      .pl-filterLeft .ant-cascader { width: 100% !important; }
    }
    @media (prefers-reduced-motion: reduce) {
      .pl-actions .pl-primary.ant-btn { box-shadow: none; }
    }
  `;

  const columns: ColumnsType<Medicine> = [
    {
      title: '商品',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space size={12} align="start">
          <img
            src={record.mainImage || 'https://via.placeholder.com/72'}
            alt={text}
            style={{
              width: 54,
              height: 54,
              objectFit: 'cover',
              borderRadius: 12,
              border: '1px solid rgba(15, 23, 42, 0.10)',
              background: 'rgba(255,255,255,0.8)',
            }}
          />
          <div style={{ minWidth: 0 }}>
            <Button
              type="link"
              size="small"
              className="px-0"
              onClick={() => navigate(`/product/edit/${record.id}`)}
              aria-label={`编辑商品 ${text}`}
              style={{ padding: 0, height: 'auto', fontWeight: 800, color: 'rgba(15, 23, 42, 0.92)' }}
            >
              <span style={{ display: 'inline-block', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {text}
              </span>
            </Button>
            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Text type="secondary">{record.categoryName || '未分类'}</Text>
              {record.isPrescription ? <Tag color="red">Rx</Tag> : <Tag color="green">OTC</Tag>}
              {record.stock < 10 ? <Tag color="orange">低库存</Tag> : null}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '售价',
      dataIndex: 'price',
      key: 'price',
      sorter: (a, b) => Number(a.price) - Number(b.price),
      render: (price) => (
        <span style={{ fontWeight: 800, color: 'rgba(15, 23, 42, 0.92)' }}>
          ¥{Number(price).toFixed(2)}
        </span>
      ),
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      sorter: (a, b) => Number(a.stock) - Number(b.stock),
      render: (stock) => (
        <span
          style={{
            color: stock < 10 ? '#DC2626' : '#111827',
            fontWeight: stock < 10 ? 600 : 400,
          }}
        >
          {stock}
        </span>
      ),
    },
    {
      title: '销量',
      dataIndex: 'sales',
      key: 'sales',
      sorter: (a, b) => Number(a.sales) - Number(b.sales),
      render: (value) => (
        <span style={{ color: 'rgba(15, 23, 42, 0.78)', fontWeight: 650 }}>
          {value ?? 0}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 1 ? 'success' : 'default'} style={{ borderRadius: 999, paddingInline: 10 }}>
          {status === 1 ? '上架中' : '已下架'}
        </Tag>
      ),
    },
    {
      title: '更新',
      dataIndex: 'updateTime',
      key: 'updateTime',
      render: (value, record) => {
        const raw = value || record.createTime;
        if (!raw) return <Text type="secondary">-</Text>;
        const d = dayjs(raw);
        if (!d.isValid()) return <Text type="secondary">-</Text>;
        return <Text type="secondary">{d.format('YYYY-MM-DD')}</Text>;
      },
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 160,
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" size="small" className="px-0" onClick={() => navigate(`/product/edit/${record.id}`)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            className="px-0"
            style={{ color: record.status === 1 ? 'rgba(194, 65, 12, 1)' : 'rgba(5, 150, 105, 1)' }}
            onClick={() => handleStatusChange(record)}
          >
            {record.status === 1 ? '下架' : '上架'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="pl-root">
      <style>{listStyles}</style>

      <div className="pl-hero">
        <div className="pl-top">
          <div>
            <h2 className="pl-title">商品管理</h2>
            <div className="pl-sub">支持关键词、状态、分类筛选；在列表中快速上下架与编辑</div>
          </div>
          <div className="pl-actions" aria-label="页面操作">
            <Button icon={<ReloadOutlined />} onClick={() => fetchData(1, pageSize)} loading={loading}>
              刷新
            </Button>
            <Button className="pl-primary" type="primary" icon={<PlusOutlined />} onClick={() => navigate('/product/add')}>
              添加商品
            </Button>
          </div>
        </div>

        <div className="pl-filters" aria-label="筛选区">
          <div className="pl-filterLeft">
            <Input
              placeholder="搜索商品名称或关键字"
              prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
              style={{ width: 320 }}
              size="middle"
            />
            <Cascader
              options={categoryOptions}
              placeholder="全部分类"
              value={categoryPath}
              onChange={(value) => setCategoryPath(value as number[])}
              changeOnSelect
              showSearch
              style={{ width: 220 }}
              disabled={categoryOptions.length === 0}
              allowClear
            />
            <Select
              placeholder="全部状态"
              value={status}
              onChange={(value) => setStatus(value)}
              allowClear
              style={{ width: 160 }}
              options={[
                { value: 1, label: '上架中' },
                { value: 0, label: '已下架' },
              ]}
            />
          </div>
          <div className="pl-filterRight">
            <Button onClick={handleReset}>重置</Button>
            <Button type="primary" onClick={handleSearch} className="pl-primary">
              查询
            </Button>
          </div>
        </div>
      </div>


      <Card className="pl-tableCard" variant="outlined">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          size="middle"
          rowClassName={(record) => (record.status === 0 ? 'pl-rowOff' : '')}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 960 }}
        />
      </Card>
    </div>
  );
};

export default ProductList;
