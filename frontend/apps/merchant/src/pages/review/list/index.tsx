import React, { useCallback, useEffect, useState } from 'react';
import { Card, Table, Rate, Image, Typography, Space, Tag, Button, Modal, Input, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined } from '@ant-design/icons';
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
  const [currentReplyId, setCurrentReplyId] = useState<string | null>(null);
  const [currentReplyRecord, setCurrentReplyRecord] = useState<MedicineComment | null>(null);
  const [replyLoading, setReplyLoading] = useState(false);

  const loadData = useCallback(async (current: number, size: number) => {
    setLoading(true);
    try {
      // 评价列表分页直接走商家端接口，表格层只负责展示。
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
  }, [messageApi]);

  useEffect(() => {
    loadData(page, pageSize);
  }, [loadData, page, pageSize]);

  const handleReplyClick = (record: MedicineComment) => {
    // 打开回复弹窗时绑定当前评价并清空输入框。
    setCurrentReplyId(record.id);
    setReplyContent('');
    setCurrentReplyRecord(record);
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
      // 回复成功后重新拉当前页，确保表格和回复区同步。
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

  const handleModalOk = () => {
    if (currentReplyRecord?.reply) {
      setReplyVisible(false);
      setCurrentReplyRecord(null);
      return;
    }
    handleReplySubmit();
  };

  const pageStyles = `
    .rv-root {
      position: relative;
    }
    .rv-hero {
      position: relative;
      overflow: hidden;
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background:
        radial-gradient(900px 380px at 10% 10%, rgba(16, 185, 129, 0.22), rgba(16, 185, 129, 0) 55%),
        radial-gradient(760px 360px at 75% 18%, rgba(34, 211, 238, 0.16), rgba(34, 211, 238, 0) 60%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0.78) 100%);
      box-shadow: 0 26px 80px rgba(2, 6, 23, 0.10);
      padding: 14px 14px 12px;
      margin-bottom: 16px;
    }
    .rv-hero::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.34;
      background-image: radial-gradient(rgba(15, 23, 42, 0.16) 1px, transparent 1px);
      background-size: 26px 26px;
      mask-image: radial-gradient(620px 460px at 65% 20%, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
    }
    .rv-top {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }
    .rv-title {
      margin: 0;
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.3px;
      color: rgba(15, 23, 42, 0.92);
    }
    .rv-sub {
      margin-top: 4px;
      font-size: 12px;
      color: rgba(15, 23, 42, 0.62);
    }
    .rv-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .rv-actions .ant-btn {
      border-radius: 999px;
      height: 36px;
      padding: 0 14px;
      font-weight: 650;
      border-color: rgba(15, 23, 42, 0.12);
      color: rgba(15, 23, 42, 0.78);
      background: rgba(255,255,255,0.78);
    }
    .rv-chip.ant-tag {
      border-radius: 999px;
      padding-inline: 10px;
      margin-inline-end: 0;
      background: rgba(2, 6, 23, 0.04);
      border-color: rgba(15, 23, 42, 0.10);
      color: rgba(15, 23, 42, 0.70);
      font-weight: 650;
    }
    .rv-tableCard.ant-card {
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      box-shadow: 0 20px 60px rgba(2, 6, 23, 0.08);
      overflow: hidden;
      background: rgba(255,255,255,0.86);
    }
    .rv-tableCard .ant-card-body { padding: 0; }
    .rv-tableCard .ant-table { background: transparent; }
    .rv-tableCard .ant-table-thead > tr > th {
      background: rgba(2, 6, 23, 0.02);
      font-weight: 750;
      color: rgba(15, 23, 42, 0.78);
      border-bottom: 1px solid rgba(15, 23, 42, 0.08);
    }
    .rv-cell {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      min-width: 0;
    }
    .rv-avatar {
      width: 36px;
      height: 36px;
      border-radius: 999px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background: rgba(255,255,255,0.84);
      overflow: hidden;
      flex: 0 0 auto;
    }
    .rv-meta {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
      flex: 1 1 auto;
    }
    .rv-rowTop {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
    }
    .rv-name {
      font-weight: 850;
      color: rgba(15, 23, 42, 0.92);
      max-width: 260px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .rv-tags {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .rv-content {
      color: rgba(15, 23, 42, 0.82);
      line-height: 1.5;
      word-break: break-word;
    }
    .rv-reply {
      border: 1px solid rgba(15, 23, 42, 0.10);
      background: rgba(2, 6, 23, 0.02);
      border-radius: 12px;
      padding: 10px 10px;
      color: rgba(15, 23, 42, 0.78);
    }
    .rv-replyLabel {
      font-weight: 750;
      color: rgba(15, 23, 42, 0.80);
      margin-right: 6px;
    }
    .rv-thumb.ant-image-img {
      border-radius: 10px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background: rgba(255,255,255,0.8);
    }
    .rv-actPrimary.ant-btn {
      border: none;
      border-radius: 999px;
      background: linear-gradient(90deg, rgba(5, 150, 105, 1), rgba(16, 185, 129, 1));
      box-shadow: 0 14px 30px rgba(16, 185, 129, 0.16);
    }
    .rv-actPrimary.ant-btn:hover { filter: brightness(1.02); }
    .rv-muted td { opacity: 0.78; }
  `;

  const columns: ColumnsType<MedicineComment> = [
    {
      title: '评价',
      dataIndex: 'content',
      key: 'content',
      render: (_, record) => {
        const sentimentColor = record.star >= 4 ? 'success' : record.star >= 3 ? 'processing' : 'error';
        const sentimentText = record.star >= 4 ? '好评' : record.star >= 3 ? '中评' : '差评';
        const images = record.images
          ? record.images
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

        return (
          <div className="rv-cell">
            <div className="rv-avatar" aria-hidden="true">
              {record.userAvatar ? (
                <img src={record.userAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'rgba(15, 23, 42, 0.42)', fontWeight: 900 }}>
                  {record.userName?.slice?.(0, 1) || 'U'}
                </div>
              )}
            </div>

            <div className="rv-meta">
              <div className="rv-rowTop">
                <div className="rv-tags">
                  <div className="rv-name" title={record.userName}>
                    {record.userName || '匿名用户'}
                  </div>
                  <Tag color={sentimentColor} style={{ borderRadius: 999, marginInlineEnd: 0, fontWeight: 650, paddingInline: 10 }}>
                    {sentimentText}
                  </Tag>
                  {record.reply ? <Tag color="default" className="rv-chip">已回复</Tag> : <Tag color="warning" className="rv-chip">待回复</Tag>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Rate disabled value={record.star} allowHalf style={{ fontSize: 14 }} />
                  <Text type="secondary">{Number(record.star).toFixed(1)}</Text>
                </div>
              </div>

              <div className="rv-content">{record.content || '-'}</div>

              {images.length > 0 && (
                <Image.PreviewGroup>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {images.map((img, index) => (
                      <Image key={`${record.id}-${index}`} src={img} width={64} height={64} style={{ objectFit: 'cover' }} className="rv-thumb" />
                    ))}
                  </div>
                </Image.PreviewGroup>
              )}

              {record.reply && (
                <div className="rv-reply">
                  <span className="rv-replyLabel">商家回复：</span>
                  <span>{record.reply}</span>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: '评价时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      responsive: ['lg'],
      render: (value) => <Text type="secondary">{value || '-'}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size={8}>
          {!record.reply ? (
            <Button type="primary" size="small" className="rv-actPrimary" onClick={() => handleReplyClick(record)}>
              回复
            </Button>
          ) : (
            <Button size="small" disabled>
              已回复
            </Button>
          )}
          <Button type="link" size="small" className="px-0" onClick={() => handleReplyClick(record)}>
            查看
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="rv-root">
      {contextHolder}

      <style>{pageStyles}</style>

      <div className="rv-hero" aria-label="评价管理概览">
        <div className="rv-top">
          <div>
            <h2 className="rv-title">全部评价</h2>
            <div className="rv-sub">查看用户对商品的评价，及时回复提升店铺口碑</div>
          </div>
          <div className="rv-actions">
            <Tag className="rv-chip">共 {total} 条</Tag>
            <Button icon={<ReloadOutlined />} onClick={() => loadData(page, pageSize)} loading={loading}>
              刷新
            </Button>
          </div>
        </div>
      </div>

      <Card className="rv-tableCard" variant="outlined">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          size="middle"
          rowClassName={(record) => (record.reply ? 'rv-muted' : '')}
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
          scroll={{ x: 980 }}
        />
      </Card>

      <Modal
        title={currentReplyRecord?.reply ? '评价详情' : '回复评价'}
        open={replyVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setReplyVisible(false);
          setCurrentReplyRecord(null);
        }}
        confirmLoading={replyLoading}
        okText={currentReplyRecord?.reply ? '关闭' : '发送回复'}
        cancelText="取消"
      >
        {currentReplyRecord && (
          <div style={{ marginBottom: 12, padding: 12, borderRadius: 14, border: '1px solid rgba(15, 23, 42, 0.10)', background: 'rgba(2, 6, 23, 0.02)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ fontWeight: 850, color: 'rgba(15, 23, 42, 0.92)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentReplyRecord.userName || '匿名用户'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Rate disabled value={currentReplyRecord.star} allowHalf style={{ fontSize: 14 }} />
                <Text type="secondary">{Number(currentReplyRecord.star).toFixed(1)}</Text>
              </div>
            </div>
            <div style={{ marginTop: 10, color: 'rgba(15, 23, 42, 0.82)', lineHeight: 1.5 }}>{currentReplyRecord.content || '-'}</div>
            {currentReplyRecord.reply && (
              <div style={{ marginTop: 10, borderRadius: 12, padding: 10, background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(15, 23, 42, 0.08)' }}>
                <span style={{ fontWeight: 750, color: 'rgba(15, 23, 42, 0.80)', marginRight: 6 }}>商家回复：</span>
                <span style={{ color: 'rgba(15, 23, 42, 0.78)' }}>{currentReplyRecord.reply}</span>
              </div>
            )}
          </div>
        )}

        <Input.TextArea
          rows={4}
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder={currentReplyRecord?.reply ? '' : '请输入回复内容...'}
          disabled={Boolean(currentReplyRecord?.reply)}
        />
      </Modal>
    </div>
  );
};

export default ReviewList;
