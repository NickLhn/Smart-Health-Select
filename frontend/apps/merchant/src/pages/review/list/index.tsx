import React, { useEffect, useState } from 'react';
import { Card, Table, Rate, Image, Typography, Space, Tag, Button, Modal, Input, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getMerchantCommentList, replyComment, type MedicineComment } from '../../../services/product';

const { Text } = Typography;

const ReviewList: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MedicineComment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [replyVisible, setReplyVisible] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [currentReplyId, setCurrentReplyId] = useState<number | null>(null);
  const [replyLoading, setReplyLoading] = useState(false);

  const loadData = async (current: number, size: number) => {
    setLoading(true);
    try {
      const res = await getMerchantCommentList(current, size);
      if (res.code === 200) {
        setData(res.data.records);
        setTotal(res.data.total);
      }
    } catch (error) {
      console.error(error);
      messageApi.error('加载评价失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(page, pageSize);
  }, [page, pageSize]);

  const handleReplyClick = (record: MedicineComment) => {
    setCurrentReplyId(record.id);
    setReplyContent('');
    setReplyVisible(true);
  };

  const handleReplySubmit = async () => {
    if (!currentReplyId) return;
    if (!replyContent.trim()) {
      messageApi.warning('请输入回复内容');
      return;
    }

    setReplyLoading(true);
    try {
      const res = await replyComment(currentReplyId, replyContent);
      if (res.code === 200) {
        messageApi.success('回复成功');
        setReplyVisible(false);
        loadData(page, pageSize);
      } else {
        messageApi.error(res.message || '回复失败');
      }
    } catch (error) {
      console.error(error);
      messageApi.error('回复失败');
    } finally {
      setReplyLoading(false);
    }
  };

  const columns: ColumnsType<MedicineComment> = [
    {
      title: '商品ID',
      dataIndex: 'medicineId',
      key: 'medicineId',
      width: 100,
    },
    {
      title: '用户',
      dataIndex: 'userName',
      key: 'userName',
      width: 120,
      render: (text, record) => (
        <Space>
          {record.userAvatar && <Image src={record.userAvatar} width={24} style={{ borderRadius: '50%' }} />}
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '评分',
      dataIndex: 'star',
      key: 'star',
      width: 200,
      render: (star) => (
        <Space>
          <Rate disabled defaultValue={star} allowHalf style={{ fontSize: 14 }} />
          <Tag
            color={
              star >= 4 ? 'green' : star >= 3 ? 'blue' : 'red'
            }
          >
            {star >= 4 ? '好评' : star >= 3 ? '中评' : '差评'}
          </Tag>
        </Space>
      ),
    },
    {
      title: '评价内容',
      dataIndex: 'content',
      key: 'content',
      render: (text, record) => (
        <div>
          <div style={{ marginBottom: 8 }}>{text}</div>
          {record.images && (
            <Image.PreviewGroup>
              {record.images.split(',').map((img, index) => (
                <Image key={index} src={img} width={60} style={{ marginRight: 8, marginBottom: 8 }} />
              ))}
            </Image.PreviewGroup>
          )}
          {record.reply && (
            <div className="bg-gray-50 p-2 rounded mt-2 text-gray-600 text-sm">
                <span className="font-medium">商家回复：</span>
                {record.reply}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '评价时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) =>
        !record.reply && (
          <Button type="link" onClick={() => handleReplyClick(record)}>
            回复
          </Button>
        ),
    },
  ];

  return (
    <div>
      {contextHolder}
      <div
        style={{
          marginBottom: 16,
          padding: '8px 12px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 16,
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
              color: '#022c22',
            }}
          >
            评价管理
          </h2>
          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              color: '#6B7280',
            }}
          >
            查看用户对商品的评价，及时回复提升店铺口碑
          </div>
        </div>
        <Space size="middle">
          <Tag color="default">共 {total} 条评价</Tag>
          <Button
            size="middle"
            onClick={() => loadData(page, pageSize)}
            style={{
              borderRadius: 999,
              borderColor: '#D1D5DB',
              color: '#374151',
            }}
          >
            刷新列表
          </Button>
        </Space>
      </div>
      <Card variant="borderless">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          size="middle"
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, s) => {
              setPage(p);
              setPageSize(s);
            },
          }}
        />
      </Card>

      <Modal
        title="回复评价"
        open={replyVisible}
        onOk={handleReplySubmit}
        onCancel={() => setReplyVisible(false)}
        confirmLoading={replyLoading}
      >
        <Input.TextArea
          rows={4}
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder="请输入回复内容..."
        />
      </Modal>
    </div>
  );
};

export default ReviewList;
