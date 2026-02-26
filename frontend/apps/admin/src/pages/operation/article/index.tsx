import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { App, Avatar, Button, Card, Descriptions, Drawer, Form, Image, Input, Popconfirm, Select, Space, Switch, Table, Tag, Typography, Upload } from 'antd';
import { EditOutlined, FileTextOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { getArticlePage, addArticle, updateArticle, deleteArticle } from '../../../services/article';
import type { HealthArticle } from '../../../services/article';
import { uploadFile } from '../../../services/file';
import type { UploadFile } from 'antd/es/upload/interface';

const { TextArea } = Input;
const { Option } = Select;

const ArticleList: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HealthArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [query, setQuery] = useState({ title: '', category: '' });
  const [filterForm] = Form.useForm();

  const [detailOpen, setDetailOpen] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<HealthArticle | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getArticlePage({ page, size, ...query });
      if (res.code === 200) {
        setData(res.data.records);
        setTotal(res.data.total);
        setLastUpdatedAt(Date.now());
      }
    } catch (error) {
      message.error('获取健康资讯失败');
    } finally {
      setLoading(false);
    }
  }, [message, page, query, size]);

  useEffect(() => {
    fetchData();
  }, [page, size, query]);

  const handleSearch = useCallback((values: any) => {
    setQuery(values);
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    filterForm.resetFields();
    setQuery({ title: '', category: '' });
    setPage(1);
  }, [filterForm]);

  const handleAdd = useCallback(() => {
    setEditingId(null);
    setFileList([]);
    form.resetFields();
    form.setFieldsValue({ status: 1 });
    setEditorOpen(true);
  }, [form]);

  const handleEdit = useCallback((record: HealthArticle) => {
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
    setEditorOpen(true);
  }, [form]);

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

  const handleSubmit = async () => {
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
          setEditorOpen(false);
          fetchData();
        }
      } else {
        const res = await addArticle(payload);
        if (res.code === 200) {
          message.success('添加成功');
          setEditorOpen(false);
          fetchData();
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const statusMeta = useCallback((s: number) => {
    if (s === 1) return { text: '已发布', color: 'green' as const };
    return { text: '草稿', color: 'default' as const };
  }, []);

  const columns: any = useMemo(() => {
    return [
      {
        title: '资讯',
        key: 'article',
        width: 420,
        render: (_: any, record: HealthArticle) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {record.coverImage ? (
              <Image
                src={record.coverImage}
                width={64}
                height={64}
                style={{ objectFit: 'cover', borderRadius: 14, background: 'rgba(2, 6, 23, 0.06)' }}
                preview={{ mask: '预览' }}
              />
            ) : (
              <Avatar size={64} icon={<FileTextOutlined />} style={{ borderRadius: 14, background: 'rgba(2, 6, 23, 0.06)', color: 'rgba(15, 23, 42, 0.70)' }} />
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 950, color: 'rgba(15, 23, 42, 0.86)' }}>
                <Typography.Link
                  onClick={() => {
                    setCurrentArticle(record);
                    setDetailOpen(true);
                  }}
                  style={{ color: 'rgba(15, 23, 42, 0.86)' }}
                >
                  <Typography.Text ellipsis style={{ maxWidth: 320 }}>
                    {record.title}
                  </Typography.Text>
                </Typography.Link>
              </div>
              <Typography.Text ellipsis style={{ maxWidth: 420, fontSize: 12, color: 'rgba(15, 23, 42, 0.62)' }}>
                {record.summary || '—'}
              </Typography.Text>
            </div>
          </div>
        ),
      },
      {
        title: '分类',
        dataIndex: 'category',
        key: 'category',
        width: 140,
        render: (c: string) => (
          <Tag color="blue" style={{ borderRadius: 999, paddingInline: 10 }}>
            {c || '-'}
          </Tag>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (s: number) => {
          const meta = statusMeta(s);
          return (
            <Tag color={meta.color} style={{ borderRadius: 999, paddingInline: 10 }}>
              {meta.text}
            </Tag>
          );
        },
      },
      {
        title: '浏览量',
        dataIndex: 'views',
        key: 'views',
        width: 120,
        render: (v: number) => (
          <Typography.Text style={{ fontWeight: 900, color: 'rgba(15, 23, 42, 0.84)' }}>{v ?? 0}</Typography.Text>
        ),
      },
      {
        title: '发布时间',
        dataIndex: 'createTime',
        key: 'createTime',
        width: 200,
      },
      {
        title: '操作',
        key: 'action',
        width: 220,
        fixed: 'right',
        render: (_: any, record: HealthArticle) => (
          <Space size={8}>
            <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ borderRadius: 999 }}>
              编辑
            </Button>
            <Popconfirm title="确定删除该资讯吗？" onConfirm={() => handleDelete(record.id)}>
              <Button danger style={{ borderRadius: 999 }}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ];
  }, [handleDelete, handleEdit, statusMeta]);

  const pageStyles = `
    .ar-root { position: relative; padding: 8px 0; }
    .ar-hero {
      position: relative;
      overflow: hidden;
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background:
        radial-gradient(900px 380px at 10% 10%, rgba(16, 185, 129, 0.16), rgba(16, 185, 129, 0) 55%),
        radial-gradient(760px 360px at 78% 18%, rgba(14, 165, 233, 0.14), rgba(14, 165, 233, 0) 60%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.90) 0%, rgba(255, 255, 255, 0.82) 100%);
      box-shadow: 0 26px 80px rgba(2, 6, 23, 0.10);
      padding: 14px 14px 12px;
      margin-bottom: 14px;
    }
    .ar-hero::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.30;
      background-image: radial-gradient(rgba(15, 23, 42, 0.16) 1px, transparent 1px);
      background-size: 26px 26px;
      mask-image: radial-gradient(620px 460px at 65% 20%, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
    }
    .ar-top {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }
    .ar-title {
      margin: 0;
      font-size: 20px;
      font-weight: 950;
      letter-spacing: -0.3px;
      color: rgba(15, 23, 42, 0.92);
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .ar-sub { margin-top: 4px; font-size: 12px; color: rgba(15, 23, 42, 0.62); }
    .ar-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .ar-chip.ant-tag {
      border-radius: 999px;
      padding-inline: 10px;
      margin-inline-end: 0;
      background: rgba(2, 6, 23, 0.04);
      border-color: rgba(15, 23, 42, 0.10);
      color: rgba(15, 23, 42, 0.70);
      font-weight: 650;
    }
    .ar-actions .ant-btn {
      border-radius: 999px;
      height: 36px;
      padding: 0 14px;
      font-weight: 650;
      border-color: rgba(15, 23, 42, 0.12);
      color: rgba(15, 23, 42, 0.78);
      background: rgba(255,255,255,0.78);
    }
    .ar-primaryBtn.ant-btn-primary {
      border-radius: 999px;
      height: 36px;
      padding: 0 14px;
      background: linear-gradient(90deg, rgba(16, 185, 129, 1), rgba(14, 165, 233, 1));
      border: none;
      box-shadow: 0 18px 42px rgba(16, 185, 129, 0.18);
      font-weight: 800;
    }
    .ar-card.ant-card {
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      box-shadow: 0 20px 60px rgba(2, 6, 23, 0.08);
      background: rgba(255,255,255,0.86);
      overflow: hidden;
    }
    .ar-card .ant-card-body { padding: 14px; }
    .ar-filters { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
    .ar-filters .ant-form-item { margin-bottom: 0; }
    .ar-table .ant-table-container {
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(15, 23, 42, 0.08);
    }
    .ar-table .ant-table-thead > tr > th {
      background: rgba(2, 6, 23, 0.02);
      color: rgba(15, 23, 42, 0.70);
      font-weight: 950;
    }
    .ar-table .ant-table-tbody > tr > td {
      border-bottom: 1px solid rgba(15, 23, 42, 0.06);
    }
    .ar-uploader .ant-upload-list-picture-card-container,
    .ar-uploader .ant-upload-select { width: 168px !important; height: 168px !important; }
    .ar-uploader .ant-upload.ant-upload-select { border-radius: 16px; border-color: rgba(15, 23, 42, 0.16); }
  `;

  return (
    <div className="ar-root">
      <style>{pageStyles}</style>

      <div className="ar-hero" aria-label="健康资讯概览">
        <div className="ar-top">
          <div>
            <h2 className="ar-title">
              <FileTextOutlined />
              健康资讯
            </h2>
            <div className="ar-sub">内容生产与运营 · 分类筛选 · 草稿/发布管理</div>
          </div>
          <div className="ar-actions">
            <Tag className="ar-chip">总计 {total}</Tag>
            <Tag className="ar-chip">
              {lastUpdatedAt ? `更新于 ${new Date(lastUpdatedAt).toLocaleTimeString()}` : '未刷新'}
            </Tag>
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
              刷新
            </Button>
            <Button className="ar-primaryBtn" type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增资讯
            </Button>
          </div>
        </div>
      </div>

      <Card className="ar-card" variant="outlined">
        <Form form={filterForm} layout="vertical" onFinish={handleSearch}>
          <div className="ar-filters">
            <Form.Item name="title" label="标题">
              <Input allowClear prefix={<SearchOutlined />} placeholder="输入标题关键词" style={{ width: 320 }} />
            </Form.Item>
            <Form.Item name="category" label="分类">
              <Select placeholder="请选择分类" style={{ width: 180 }} allowClear>
                <Option value="日常护理">日常护理</Option>
                <Option value="慢性病管理">慢性病管理</Option>
                <Option value="营养保健">营养保健</Option>
                <Option value="健康生活">健康生活</Option>
                <Option value="儿童健康">儿童健康</Option>
              </Select>
            </Form.Item>
            <Form.Item label=" ">
              <Space>
                <Button className="ar-primaryBtn" type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  查询
                </Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />} style={{ borderRadius: 999 }}>
                  重置
                </Button>
              </Space>
            </Form.Item>
          </div>
        </Form>
      </Card>

      <Card className="ar-card ar-table" variant="outlined" style={{ marginTop: 14 }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: size,
            total,
            showTotal: (t) => `共 ${t} 条`,
            showQuickJumper: true,
            showSizeChanger: true,
            onChange: (p, s) => {
              setPage(p);
              setSize(s);
            },
          }}
          scroll={{ x: 1100 }}
        />
      </Card>

      <Drawer title="资讯详情" open={detailOpen} onClose={() => setDetailOpen(false)} width={560} destroyOnClose>
        {currentArticle ? (
          <Card className="ar-card" variant="outlined">
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="标题">{currentArticle.title}</Descriptions.Item>
              <Descriptions.Item label="分类">
                <Tag color="blue" style={{ borderRadius: 999, paddingInline: 10 }}>
                  {currentArticle.category}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMeta(currentArticle.status).color} style={{ borderRadius: 999, paddingInline: 10 }}>
                  {statusMeta(currentArticle.status).text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="浏览量">{currentArticle.views ?? 0}</Descriptions.Item>
              <Descriptions.Item label="发布时间">{currentArticle.createTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="封面">
                {currentArticle.coverImage ? (
                  <Image src={currentArticle.coverImage} width={220} style={{ borderRadius: 14, background: 'rgba(2, 6, 23, 0.06)' }} />
                ) : (
                  <Typography.Text type="secondary">无</Typography.Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="摘要">
                <Typography.Paragraph style={{ marginBottom: 0 }}>{currentArticle.summary || '—'}</Typography.Paragraph>
              </Descriptions.Item>
              <Descriptions.Item label="内容">
                <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{currentArticle.content || '—'}</Typography.Paragraph>
              </Descriptions.Item>
            </Descriptions>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
              <Button onClick={() => handleEdit(currentArticle)} style={{ borderRadius: 999 }}>
                编辑
              </Button>
            </div>
          </Card>
        ) : null}
      </Drawer>

      <Drawer
        title={editingId ? '编辑资讯' : '新增资讯'}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        width={720}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <Button onClick={() => setEditorOpen(false)} style={{ borderRadius: 999 }}>
              取消
            </Button>
            <Button className="ar-primaryBtn" type="primary" onClick={handleSubmit}>
              保存
            </Button>
          </div>
        }
      >
        <Card className="ar-card" variant="outlined">
          <Form form={form} layout="vertical">
            <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
              <Input />
            </Form.Item>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item label="分类" name="category" rules={[{ required: true, message: '请选择分类' }]}>
                <Select>
                  <Option value="日常护理">日常护理</Option>
                  <Option value="慢性病管理">慢性病管理</Option>
                  <Option value="营养保健">营养保健</Option>
                  <Option value="健康生活">健康生活</Option>
                  <Option value="儿童健康">儿童健康</Option>
                </Select>
              </Form.Item>
              <Form.Item label="状态" name="status" valuePropName="checked">
                <Switch checkedChildren="发布" unCheckedChildren="草稿" />
              </Form.Item>
            </div>
            <Form.Item label="封面图">
              <div className="ar-uploader">
                <Upload
                  listType="picture-card"
                  fileList={fileList}
                  customRequest={customRequest}
                  onChange={handleChange}
                  maxCount={1}
                >
                  {fileList.length >= 1 ? null : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'rgba(15, 23, 42, 0.72)' }}>
                      <Avatar size={42} icon={<FileTextOutlined />} style={{ background: 'rgba(2, 6, 23, 0.06)', color: 'rgba(15, 23, 42, 0.72)' }} />
                      <div style={{ fontWeight: 800 }}>上传封面</div>
                      <div style={{ fontSize: 12, opacity: 0.72 }}>建议 1:1 或 4:3</div>
                    </div>
                  )}
                </Upload>
              </div>
            </Form.Item>
            <Form.Item label="摘要" name="summary" rules={[{ required: true, message: '请输入摘要' }]}>
              <TextArea rows={3} showCount maxLength={200} />
            </Form.Item>
            <Form.Item label="内容" name="content" rules={[{ required: true, message: '请输入内容' }]}>
              <TextArea rows={12} showCount maxLength={5000} />
            </Form.Item>
          </Form>
        </Card>
      </Drawer>
    </div>
  );
};

export default ArticleList;
