import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Switch, App, Popconfirm, Image, Tag, Upload } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { getBannerList, addBanner, updateBanner, deleteBanner } from '../../../services/banner';
import type { Banner } from '../../../services/banner';
import { uploadFile } from '../../../services/file';
import type { UploadFile } from 'antd/es/upload/interface';

const BannerList: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Banner[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getBannerList({ page, size });
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
  }, [page, size]);

  const handleAdd = () => {
    setEditingId(null);
    setFileList([]);
    form.resetFields();
    form.setFieldsValue({ status: 1, sort: 0 });
    setModalOpen(true);
  };

  const handleEdit = (record: Banner) => {
    setEditingId(record.id);
    if (record.imageUrl) {
      setFileList([{
        uid: '-1',
        name: 'image.png',
        status: 'done',
        url: record.imageUrl,
      }]);
    } else {
      setFileList([]);
    }
    form.setFieldsValue({
      ...record,
      status: record.status === 1
    });
    setModalOpen(true);
  };

  const customRequest = async (options: any) => {
    const { onSuccess, onError, file } = options;
    try {
      const res = await uploadFile(file);
      if (res.code === 200) {
        onSuccess(res, file);
      } else {
        onError(new Error(res.message));
        message.error(res.message);
      }
    } catch (err) {
      onError(err);
      message.error('上传失败');
    }
  };

  const handleChange = ({ fileList: newFileList }: any) => {
    setFileList(newFileList);
  };

  const getFileUrl = (file: any) => {
    if (file.url) return file.url;
    if (file.response && file.response.code === 200) return file.response.data;
    return '';
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await deleteBanner(id);
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
      
      const imageUrl = fileList.length > 0 ? getFileUrl(fileList[0]) : '';
      if (!imageUrl) {
        message.error('请上传图片');
        return;
      }

      const payload = {
        ...values,
        imageUrl,
        status: values.status ? 1 : 0
      };

      if (editingId) {
        await updateBanner(editingId, payload);
        message.success('更新成功');
      } else {
        await addBanner(payload);
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
      title: '图片',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      render: (url: string) => <Image src={url} width={100} height={50} style={{ objectFit: 'cover' }} />,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '跳转链接',
      dataIndex: 'linkUrl',
      key: 'linkUrl',
      render: (url: string) => url ? <a href={url} target="_blank" rel="noreferrer">{url}</a> : '-',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'success' : 'error'}>
          {status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Banner) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} type="link" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加轮播图
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: size,
          total: total,
          onChange: (p, s) => {
            setPage(p);
            setSize(s);
          },
        }}
      />

      <Modal
        title={editingId ? '编辑轮播图' : '添加轮播图'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入标题" />
          </Form.Item>
          <Form.Item label="图片" required>
            <Upload
              listType="picture-card"
              fileList={fileList}
              customRequest={customRequest}
              onChange={handleChange}
              maxCount={1}
            >
              {fileList.length >= 1 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传</div>
                </div>
              )}
            </Upload>
          </Form.Item>
          <Form.Item name="linkUrl" label="跳转链接">
            <Input placeholder="请输入跳转链接" />
          </Form.Item>
          <Form.Item name="sort" label="排序">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked">
             <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BannerList;
