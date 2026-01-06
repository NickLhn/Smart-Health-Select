import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Switch, message, Popconfirm, Image, Tag, Upload } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getArticlePage, addArticle, updateArticle, deleteArticle } from '../../../services/article';
import type { HealthArticle } from '../../../services/article';
import { uploadFile } from '../../../services/file';
import type { UploadFile } from 'antd/es/upload/interface';

const { TextArea } = Input;
const { Option } = Select;

const ArticleList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HealthArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [query, setQuery] = useState({ title: '', category: '' });

  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getArticlePage({ page, size, ...query });
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
  }, [page, size, query]);

  const handleSearch = (values: any) => {
    setQuery(values);
    setPage(1);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFileList([]);
    form.resetFields();
    form.setFieldsValue({ status: 1 });
    setModalOpen(true);
  };

  const handleEdit = (record: HealthArticle) => {
    setEditingId(record.id);
    if (record.coverImage) {
      setFileList([{
        uid: '-1',
        name: 'cover.png',
        status: 'done',
        url: record.coverImage,
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
      const res = await deleteArticle(id);
      if (res.code === 200) {
        message.success('删除成功');
        fetchData();
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const imageUrl = fileList.length > 0 ? getFileUrl(fileList[0]) : '';
      
      const payload = {
        ...values,
        coverImage: imageUrl,
        status: values.status ? 1 : 0
      };

      if (editingId) {
        const res = await updateArticle({ ...payload, id: editingId });
        if (res.code === 200) {
          message.success('修改成功');
          setModalOpen(false);
          fetchData();
        }
      } else {
        const res = await addArticle(payload);
        if (res.code === 200) {
          message.success('添加成功');
          setModalOpen(false);
          fetchData();
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const columns = [
    {
      title: '封面',
      dataIndex: 'coverImage',
      key: 'coverImage',
      render: (text: string) => text ? <Image src={text} width={50} height={50} /> : '无',
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '已发布' : '草稿'}
        </Tag>
      ),
    },
    {
      title: '浏览量',
      dataIndex: 'views',
      key: 'views',
    },
    {
      title: '发布时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: HealthArticle) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Form layout="inline" onFinish={handleSearch} style={{ marginBottom: 16 }}>
        <Form.Item name="title" label="标题">
          <Input placeholder="请输入标题" />
        </Form.Item>
        <Form.Item name="category" label="分类">
          <Select placeholder="请选择分类" style={{ width: 120 }} allowClear>
            <Option value="日常护理">日常护理</Option>
            <Option value="慢性病管理">慢性病管理</Option>
            <Option value="营养保健">营养保健</Option>
            <Option value="健康生活">健康生活</Option>
            <Option value="儿童健康">儿童健康</Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">查询</Button>
        </Form.Item>
        <Form.Item>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增资讯</Button>
        </Form.Item>
      </Form>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: size,
          total,
          onChange: (p, s) => {
            setPage(p);
            setSize(s);
          },
        }}
      />

      <Modal
        title={editingId ? '编辑资讯' : '新增资讯'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="分类" name="category" rules={[{ required: true, message: '请选择分类' }]}>
            <Select>
              <Option value="日常护理">日常护理</Option>
              <Option value="慢性病管理">慢性病管理</Option>
              <Option value="营养保健">营养保健</Option>
              <Option value="健康生活">健康生活</Option>
              <Option value="儿童健康">儿童健康</Option>
            </Select>
          </Form.Item>
          <Form.Item label="封面图" required>
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
          <Form.Item label="摘要" name="summary" rules={[{ required: true, message: '请输入摘要' }]}>
            <TextArea rows={2} showCount maxLength={200} />
          </Form.Item>
          <Form.Item label="内容" name="content" rules={[{ required: true, message: '请输入内容' }]}>
            <TextArea rows={10} showCount maxLength={5000} />
          </Form.Item>
          <Form.Item label="状态" name="status" valuePropName="checked">
            <Switch checkedChildren="发布" unCheckedChildren="草稿" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ArticleList;
