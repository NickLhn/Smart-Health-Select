import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Input, Tag, App } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getMedicineList, updateMedicineStatus } from '../../../services/product';
import type { Medicine } from '../../../services/product';

const ProductList: React.FC = () => {
  const { message, modal } = App.useApp();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Medicine[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const navigate = useNavigate();

  const fetchData = async (page = 1, size = 10) => {
    setLoading(true);
    try {
      const res = await getMedicineList({
        page,
        size,
        keyword: searchText,
      });
      if (res.code === 200) {
        setData(res.data.records);
        setPagination({
          current: res.data.current,
          pageSize: res.data.size,
          total: res.data.total,
        });
      }
    } catch (error) {
      console.error(error);
      message.error('获取商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = () => {
    fetchData(1, pagination.pageSize);
  };

  const handleStatusChange = async (record: Medicine) => {
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
            fetchData(pagination.current, pagination.pageSize);
          } else {
            message.error(res.message || `${actionText}失败`);
          }
        } catch (error) {
          message.error(`${actionText}失败`);
        }
      },
    });
  };

  const handleTableChange = (pagination: any) => {
    fetchData(pagination.current, pagination.pageSize);
  };

  const columns: ColumnsType<Medicine> = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <img 
            src={record.mainImage || 'https://via.placeholder.com/40'} 
            alt={text} 
            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} 
          />
          <a>{text}</a>
        </Space>
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `¥${Number(price).toFixed(2)}`,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock) => (
        <span style={{ color: stock < 10 ? 'red' : 'inherit' }}>
          {stock}
        </span>
      ),
    },
    {
      title: '分类',
      dataIndex: 'categoryName', // 假设后端DTO返回了这个字段，或者需要前端自己关联
      key: 'categoryName',
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 1 ? 'success' : 'error'}>
          {status === 1 ? '上架中' : '已下架'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => navigate(`/product/edit/${record.id}`)}>编辑</a>
          <a 
            onClick={() => handleStatusChange(record)}
            style={{ color: record.status === 1 ? 'orange' : 'green' }}
          >
            {record.status === 1 ? '下架' : '上架'}
          </a>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>商品列表</h2>
        <Space>
          <Input 
            placeholder="搜索商品" 
            prefix={<SearchOutlined />} 
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
          />
          <Button type="primary" onClick={handleSearch}>搜索</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/product/add')}>
            添加商品
          </Button>
        </Space>
      </div>
      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default ProductList;
