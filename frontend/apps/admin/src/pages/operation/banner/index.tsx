import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { App, Avatar, Button, Card, Drawer, Form, Image, Input, InputNumber, Popconfirm, Space, Switch, Table, Tag, Typography, Upload } from 'antd';
import { PictureOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { getBannerList, addBanner, updateBanner, deleteBanner } from '../../../services/banner';
import type { Banner } from '../../../services/banner';
import { uploadFile } from '../../../services/file';
import type { UploadFile } from 'antd/es/upload/interface';

const BannerList: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Banner[]>([]);
  const [total, setTotal] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  
  const [editorOpen, setEditorOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 轮播图列表当前只受分页影响，不做额外本地筛选。
      const res = await getBannerList({ page, size });
      if (res.code === 200) {
        setData(res.data.records);
        setTotal(res.data.total);
        setLastUpdatedAt(Date.now());
      }
    } catch (error) {
      message.error('获取轮播图列表失败');
    } finally {
      setLoading(false);
    }
  }, [message, page, size]);

  useEffect(() => {
    fetchData();
  }, [page, size]);

  const handleAdd = useCallback(() => {
    setEditingId(null);
    setFileList([]);
    form.resetFields();
    // 新建时给一个默认状态和排序值，减少重复输入。
    form.setFieldsValue({ status: 1, sort: 0 });
    setEditorOpen(true);
  }, [form]);

  const handleEdit = useCallback((record: Banner) => {
    setEditingId(record.id);
    if (record.imageUrl) {
      // 编辑时构造一个已上传文件对象，复用 Upload 组件的回显能力。
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
      const res = await deleteBanner(id);
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
      
      // 提交前从 Upload 组件里提取最终图片 URL。
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
        // 编辑和新增共用同一个表单抽屉。
        await updateBanner(editingId, payload);
        message.success('更新成功');
      } else {
        await addBanner(payload);
        message.success('添加成功');
      }
      setEditorOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const statusMeta = useCallback((s: number) => {
    if (s === 1) return { text: '启用', color: 'green' as const };
    return { text: '禁用', color: 'red' as const };
  }, []);

  const columns: any = useMemo(() => {
    return [
      {
        title: '轮播图',
        key: 'banner',
        render: (_: any, record: Banner) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image
              src={record.imageUrl}
              width={96}
              height={54}
              style={{ objectFit: 'cover', borderRadius: 12, background: 'rgba(2, 6, 23, 0.06)' }}
              preview={{ mask: '预览' }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 950, color: 'rgba(15, 23, 42, 0.86)' }}>
                <Typography.Text ellipsis style={{ maxWidth: 360 }}>
                  {record.title || '-'}
                </Typography.Text>
              </div>
            </div>
          </div>
        ),
      },
      {
        title: '跳转链接',
        dataIndex: 'linkUrl',
        key: 'linkUrl',
        render: (url: string) =>
          url ? (
            <Typography.Link href={url} target="_blank" rel="noreferrer" ellipsis style={{ maxWidth: 360 }}>
              {url}
            </Typography.Link>
          ) : (
            <Typography.Text type="secondary">-</Typography.Text>
          ),
      },
      {
        title: '排序',
        dataIndex: 'sort',
        key: 'sort',
        width: 100,
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
        title: '操作',
        key: 'action',
        width: 200,
        fixed: 'right',
        render: (_: any, record: Banner) => (
          <Space size={8}>
            <Button onClick={() => handleEdit(record)} style={{ borderRadius: 999 }}>
              编辑
            </Button>
            <Popconfirm title="确定删除该轮播图吗？" onConfirm={() => handleDelete(record.id)}>
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
    .bn-root { position: relative; padding: 8px 0; }
    .bn-hero {
      position: relative;
      overflow: hidden;
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background:
        radial-gradient(900px 380px at 10% 10%, rgba(14, 165, 233, 0.18), rgba(14, 165, 233, 0) 55%),
        radial-gradient(760px 360px at 78% 18%, rgba(99, 102, 241, 0.14), rgba(99, 102, 241, 0) 60%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.90) 0%, rgba(255, 255, 255, 0.82) 100%);
      box-shadow: 0 26px 80px rgba(2, 6, 23, 0.10);
      padding: 14px 14px 12px;
      margin-bottom: 14px;
    }
    .bn-hero::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.30;
      background-image: radial-gradient(rgba(15, 23, 42, 0.16) 1px, transparent 1px);
      background-size: 26px 26px;
      mask-image: radial-gradient(620px 460px at 65% 20%, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
    }
    .bn-top {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }
    .bn-title {
      margin: 0;
      font-size: 20px;
      font-weight: 950;
      letter-spacing: -0.3px;
      color: rgba(15, 23, 42, 0.92);
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .bn-sub { margin-top: 4px; font-size: 12px; color: rgba(15, 23, 42, 0.62); }
    .bn-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .bn-chip.ant-tag {
      border-radius: 999px;
      padding-inline: 10px;
      margin-inline-end: 0;
      background: rgba(2, 6, 23, 0.04);
      border-color: rgba(15, 23, 42, 0.10);
      color: rgba(15, 23, 42, 0.70);
      font-weight: 650;
    }
    .bn-actions .ant-btn {
      border-radius: 999px;
      height: 36px;
      padding: 0 14px;
      font-weight: 650;
      border-color: rgba(15, 23, 42, 0.12);
      color: rgba(15, 23, 42, 0.78);
      background: rgba(255,255,255,0.78);
    }
    .bn-primaryBtn.ant-btn-primary {
      border-radius: 999px;
      height: 36px;
      padding: 0 14px;
      background: linear-gradient(90deg, rgba(14, 165, 233, 1), rgba(99, 102, 241, 1));
      border: none;
      box-shadow: 0 18px 42px rgba(14, 165, 233, 0.18);
      font-weight: 800;
    }
    .bn-card.ant-card {
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      box-shadow: 0 20px 60px rgba(2, 6, 23, 0.08);
      background: rgba(255,255,255,0.86);
      overflow: hidden;
    }
    .bn-card .ant-card-body { padding: 14px; }
    .bn-table .ant-table-container {
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(15, 23, 42, 0.08);
    }
    .bn-table .ant-table-thead > tr > th {
      background: rgba(2, 6, 23, 0.02);
      color: rgba(15, 23, 42, 0.70);
      font-weight: 950;
    }
    .bn-table .ant-table-tbody > tr > td {
      border-bottom: 1px solid rgba(15, 23, 42, 0.06);
    }
    .bn-uploader .ant-upload-list-picture-card-container,
    .bn-uploader .ant-upload-select { width: 168px !important; height: 168px !important; }
    .bn-uploader .ant-upload.ant-upload-select { border-radius: 16px; border-color: rgba(15, 23, 42, 0.16); }
  `;

  return (
    <div className="bn-root">
      <style>{pageStyles}</style>

      <div className="bn-hero" aria-label="轮播图管理概览">
        <div className="bn-top">
          <div>
            <h2 className="bn-title">
              <PictureOutlined />
              轮播图管理
            </h2>
            <div className="bn-sub">管理首页曝光位 · 图片预览 · 跳转链接</div>
          </div>
          <div className="bn-actions">
            <Tag className="bn-chip">总计 {total}</Tag>
            <Tag className="bn-chip">
              {lastUpdatedAt ? `更新于 ${new Date(lastUpdatedAt).toLocaleTimeString()}` : '未刷新'}
            </Tag>
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
              刷新
            </Button>
            <Button className="bn-primaryBtn" type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加轮播图
            </Button>
          </div>
        </div>
      </div>

      <Card className="bn-card bn-table" variant="outlined">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: size,
            total: total,
            showTotal: (t) => `共 ${t} 条`,
            showQuickJumper: true,
            showSizeChanger: true,
            onChange: (p, s) => {
              setPage(p);
              setSize(s);
            },
          }}
          scroll={{ x: 960 }}
        />
      </Card>

      <Drawer
        title={editingId ? '编辑轮播图' : '添加轮播图'}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        width={560}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <Button onClick={() => setEditorOpen(false)} style={{ borderRadius: 999 }}>
              取消
            </Button>
            <Button className="bn-primaryBtn" type="primary" onClick={handleSubmit}>
              保存
            </Button>
          </div>
        }
      >
        <Card className="bn-card" variant="outlined">
          <Form form={form} layout="vertical">
            <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
              <Input placeholder="请输入标题" />
            </Form.Item>
            <Form.Item label="图片" required>
              <div className="bn-uploader">
                <Upload
                  listType="picture-card"
                  fileList={fileList}
                  customRequest={customRequest}
                  onChange={handleChange}
                  maxCount={1}
                >
                  {fileList.length >= 1 ? null : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'rgba(15, 23, 42, 0.72)' }}>
                      <Avatar size={42} icon={<PictureOutlined />} style={{ background: 'rgba(2, 6, 23, 0.06)', color: 'rgba(15, 23, 42, 0.72)' }} />
                      <div style={{ fontWeight: 800 }}>上传图片</div>
                      <div style={{ fontSize: 12, opacity: 0.72 }}>推荐 16:9</div>
                    </div>
                  )}
                </Upload>
              </div>
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
        </Card>
      </Drawer>
    </div>
  );
};

export default BannerList;
