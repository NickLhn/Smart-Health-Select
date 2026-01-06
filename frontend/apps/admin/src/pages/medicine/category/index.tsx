import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, TreeSelect, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getCategoryList, addCategory, updateCategory, deleteCategory } from '../../../services/medicine';
import type { Category } from '../../../services/medicine';

const CategoryList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Category[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getCategoryList();
      if (res.code === 200) {
        setData(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = (parentId?: number) => {
    setEditingId(null);
    form.resetFields();
    if (parentId) {
      form.setFieldValue('parentId', parentId);
    }
    setModalOpen(true);
  };

  const handleEdit = (record: Category) => {
    setEditingId(record.id);
    form.setFieldsValue({
        ...record,
        parentId: record.parentId === 0 ? undefined : record.parentId, // 0 for root
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await deleteCategory(id);
      if (res.code === 200) {
        message.success('删除成功');
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await updateCategory({ ...values, id: editingId });
        message.success('更新成功');
      } else {
        await addCategory(values);
        message.success('添加成功');
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const columns: any = [
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
    },
    {
      title: '层级',
      dataIndex: 'level',
      key: 'level',
      render: (level: number) => <Tag>{level}级</Tag>,
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
            disabled={record.level >= 3} // Assume max 3 levels
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
  ];

  // Transform data for TreeSelect
  const renderTreeNodes = (data: Category[]): any[] => {
    return data.map((item) => ({
        title: item.name,
        value: item.id,
        children: item.children ? renderTreeNodes(item.children) : [],
        disabled: item.id === editingId, // Disable self as parent
    }));
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd()}>
          添加一级分类
        </Button>
      </div>
      
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingId ? '编辑分类' : '添加分类'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
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
          <Form.Item 
            name="name" 
            label="分类名称" 
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="sort" label="排序" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryList;
